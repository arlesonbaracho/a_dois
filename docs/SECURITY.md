# Segurança e resposta a incidente

O que fazer quando der ruim, escrito antes de dar. Plano curto de propósito:
plano longo não é lido às duas da manhã.

`<<PREENCHER>>` marca o que depende de decisão do controlador.

## Quem decide

| Papel | Quem | Quando aciona |
|---|---|---|
| Controlador | `<<PREENCHER>>` | Decide comunicar ANPD e titulares |
| Encarregado (DPO) | `<<PREENCHER>>` | Fala com a ANPD e com os titulares — Art. 41 |
| Quem responde tecnicamente | `<<PREENCHER>>` | Contém, investiga, corrige |
| Canal do titular | `<<PREENCHER>>` | Onde chega relato de fora |

Com uma pessoa só no projeto, os quatro papéis são a mesma pessoa. Escrever os
quatro assim mesmo tem um motivo: quando entrar a segunda, a divisão já existe.

## O que conta como incidente

Qualquer um destes, mesmo sem confirmação de dano:

- alguém enxergou dado de um casal de que não é membro;
- a `service_role key` apareceu em log, commit, bundle ou variável de prefixo
  público;
- uma tabela ficou sem RLS, ou uma policy passou a aceitar `using (true)`;
- o bucket `capas` ficou público, ou uma URL de capa funcionou sem assinatura;
- e-mail em claro saiu num lugar que deveria mascarar;
- token de convite vazou em claro (o banco só guarda SHA-256 — se apareceu em
  claro, veio de log ou de e-mail);
- acesso não autorizado ao painel do Supabase ou da Vercel.

**Bug que impede de usar o app não é incidente de dados.** Vira tarefa normal.

## Os passos

### 1. Conter — primeira hora

O objetivo é parar o vazamento, não entender a causa.

```bash
# Revogar todas as sessões, se houver suspeita de conta comprometida
# Painel Supabase → Authentication → Users → Sign out all users

# Se a service_role key vazou: rotacionar AGORA
# Painel Supabase → Settings → API → Reset service role key
# Depois, atualizar onde ela é usada (Edge Functions, CI)
```

Se o vazamento vem de policy, `revoke` é mais rápido e mais seguro que
consertar a policy sob pressão:

```sql
-- Fecha a tabela para o cliente. Todo mundo perde acesso, ninguém vaza.
revoke all on public.<tabela> from anon, authenticated;
```

Se vem do Storage: marcar o bucket como privado no painel, ou apagar as
policies de `storage.objects` — sem policy, o RLS nega tudo.

**Não apague log nem evidência.** A tentação é limpar; o registro é o que
sustenta a comunicação depois.

### 2. Medir — mesmo dia

Três perguntas, nesta ordem:

1. **Quais dados?** Consultar `docs/ROPA.md` e dizer em categorias: e-mail,
   nome, faixa de renda, valores do plano, fotografia.
2. **Quantos titulares?** Contar. "Alguns" não serve para a ANPD.
3. **Qual o risco para eles?** Faixa de renda e valores do plano são dados
   financeiros de duas pessoas específicas. Fotografia pode ter rosto. E-mail
   permite contato indesejado.

Registrar tudo em `relatorios/incidente-<data>.md`, mesmo que a conclusão seja
"não houve exposição". O registro de que se investigou também vale.

### 3. Comunicar

**À ANPD**, quando puder acarretar risco ou dano relevante ao titular
(Art. 48). O prazo que a ANPD indica é de **3 dias úteis** a contar do
conhecimento. Pelo formulário oficial, com:

- natureza e categorias dos dados;
- número de titulares;
- medidas técnicas de proteção que já existiam;
- riscos, e o que foi feito para reverter ou mitigar;
- por que demorou, se demorou.

**Aos titulares**, no mesmo prazo, quando o risco for relevante. Em português
claro, dizendo o que aconteceu, que dado era, o que já foi feito e o que a
pessoa pode fazer. Sem eufemismo — a mesma regra da tela de risco no app.

Com o canal de privacidade ainda em `<<PREENCHER>>`, a comunicação sai pelo
e-mail de cadastro da pessoa.

### 4. Corrigir, e provar que corrigiu

O conserto entra como qualquer mudança: migration em arquivo, teste que
**reprova** com o bug de volta, e registro em `EVOLUCAO.md`. A regra do
projeto vale aqui com mais força — guarda novo sem sabotagem não está provado.

## O que já existe, e que reduz o estrago

Vale saber de cor, porque é o que se responde à ANPD na pergunta sobre medidas
prévias:

- RLS em todas as 9 tabelas, com teste automatizado de isolamento entre casais
- `couple_id` sempre do JWT, nunca do corpo da requisição
- Token de convite guardado só como SHA-256 — vazamento do banco não vira
  convite utilizável
- Sessão em cookie `httpOnly`, nunca em `localStorage`
- Senha gerida pelo Supabase Auth; a aplicação nunca vê a senha
- Nenhum log carrega valor monetário, e-mail ou `couple_id`
- E-mail do parceiro mascarado na tela de confirmação e no export
- EXIF (e GPS) removido de toda foto antes de subir
- `gitleaks` no CI, com histórico completo

## Buracos conhecidos

Honestidade aqui vale mais que a lista acima. Detalhe em `EVOLUCAO.md`:

- **O Realtime entrega o uuid de linha apagada entre casais.** O filtro por
  `couple_id` não se aplica ao evento de DELETE. É um uuid, sem nome e sem
  valor, mas é informação que não devia sair. Conserto: broadcast por trigger
- **Capa órfã fica no bucket.** A exclusão da conta remove a foto que alguma
  jornada ainda referencia; arquivo que sobrou de uma troca malsucedida fica
- **Sem SMTP próprio.** O remetente é o padrão do Supabase
- **Backup nunca foi restaurado.** Backup não testado é suposição
- **Sem monitoramento.** Não há Sentry nem alerta: um incidente hoje seria
  descoberto por alguém olhando, não por aviso

## Contatos externos

| Para quê | Onde |
|---|---|
| ANPD — comunicação de incidente | gov.br/anpd |
| Supabase — suporte e segurança | painel do projeto |
| Vercel — suporte | painel do projeto |
