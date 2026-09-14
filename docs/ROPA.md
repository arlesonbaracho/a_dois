# Registro das operações de tratamento

Art. 37 da LGPD. Descreve o que o **Jornada** trata hoje, em 13 de setembro de
2026, tirado do schema real — não de intenção.

Tudo que aparece como `<<PREENCHER>>` depende de decisão ou documento que o
controlador precisa fornecer. Preencher com nome provisório seria pior que
deixar a lacuna: um ROPA errado dá a impressão de conformidade que não existe.

## Identificação

| | |
|---|---|
| **Controlador** | `<<PREENCHER>>` (nome / razão social e documento) |
| **Endereço** | `<<PREENCHER>>` |
| **Encarregado (DPO)** | `<<PREENCHER>>` — Art. 41 |
| **Canal do titular** | `<<PREENCHER>>` (e-mail de privacidade) |
| **Aplicação** | `a-dois-web.vercel.app` |
| **Banco** | Supabase Cloud, projeto `qysekkewsrwtebpiowim`, região `sa-east-1` (São Paulo) |

**Não há transferência internacional de dados pessoais do banco.** A região
`sa-east-1` é requisito do projeto exatamente por isso, e não é configurável
depois da criação. A hospedagem do front (Vercel) serve HTML e JavaScript; o
dado pessoal não passa por ela em repouso.

## Operações

### 1. Conta e autenticação

| | |
|---|---|
| **Finalidade** | Permitir que a pessoa entre no próprio plano |
| **Base legal** | Art. 7º, V — execução de contrato |
| **Titulares** | Pessoas maiores de idade que criam conta |
| **Dados** | E-mail e senha (`auth.users`, gerido pelo Supabase Auth; senha em hash, nunca em claro para a aplicação) |
| **Retenção** | Enquanto a conta existir. `delete_account` apaga |
| **Operador** | Supabase (Auth) |

### 2. Perfil

| | |
|---|---|
| **Finalidade** | Identificar as duas pessoas dentro do plano, e permitir convite por apelido |
| **Base legal** | Art. 7º, V |
| **Dados** | `profiles.display_name`, `profiles.nickname`, `profiles.discoverable_by_nickname`, `couple_members.display_name`, `couple_members.is_adult` |
| **Observações** | Nome e apelido são **opcionais**. `is_adult` é booleano: a data de nascimento não é coletada. `profiles.avatar_url` existe na tabela e **nenhuma função grava nela** — está reservada e vazia |
| **Retenção** | Até a exclusão da conta, ou até a saída do casal, quando o nome do vínculo é apagado (pseudonimização) |

### 3. Plano compartilhado do casal

| | |
|---|---|
| **Finalidade** | O produto: registrar objetivos, itens e quanto cada um colocou |
| **Base legal** | Art. 7º, V |
| **Dados** | `goals` (título, categoria, valor alvo, prazo, prioridade), `goal_items` (nome, preço estimado, status, URL da loja), `contributions` (quem, quanto, quando) |
| **Compartilhamento** | Entre as **duas pessoas do casal**, e só elas. O isolamento é garantido por RLS em toda tabela, com teste automatizado de isolamento |
| **Retenção** | Enquanto o plano existir. Quem sai vira "ex-membro" com o valor do aporte intacto; o plano só é apagado quando o último membro sai e confirma |

### 4. Convite e vínculo

| | |
|---|---|
| **Finalidade** | Trazer a segunda pessoa para o plano |
| **Base legal** | Art. 7º, V |
| **Dados** | `couple_invites`: e-mail convidado, canal, `claimed_by_user_id`, carimbos de tempo. O token **nunca é guardado em claro** — só o SHA-256 |
| **Minimização** | Quem confirma vê o e-mail de quem pediu **mascarado** (`j••e@gm••l.com`), nunca em claro |
| **Retenção** | 72h (e-mail/apelido) ou 24h (link) de validade; apagado 7 dias após o estado terminal. Claim sem desfecho em 48h expira e o `claimed_by_user_id` é apagado junto |

### 5. Faixa de renda

| | |
|---|---|
| **Finalidade** | Dividir os aportes na proporção da renda de cada um, quando o casal escolhe esse modo |
| **Base legal** | **Art. 7º, I — consentimento**, específico e revogável |
| **Dados** | `couple_members.income_band`: uma de quatro faixas em salários mínimos. **O valor exato da renda não é coletado** |
| **Consentimento** | Escolher a faixa É o ato afirmativo; o registro fica em `profiles.consent_income_band_at`. Revogar pelo perfil **apaga a faixa**, não só o registro |
| **Retenção** | Até a revogação ou a exclusão da conta |

### 6. Capa da jornada (fotografia)

| | |
|---|---|
| **Finalidade** | Deixar o casal pôr uma foto na própria jornada |
| **Base legal** | Art. 7º, V |
| **Dados** | Imagem enviada pelo casal, no bucket privado `capas` do Storage. Referência em `goals.cover_path` |
| **Minimização** | A foto é **reencodada no navegador antes de subir**, o que remove todo o EXIF — inclusive a **coordenada de GPS** que a câmera grava. Geolocalização precisa não é coletada |
| **Acesso** | Bucket privado, com quatro policies de RLS: só os membros do casal leem e escrevem. A leitura é por URL assinada com validade de 1 hora |
| **Retenção** | Até a troca da foto (a anterior é apagada) ou até a exclusão da conta, quando os arquivos são removidos antes do apagamento do plano |

### 7. Cotação de preço

| | |
|---|---|
| **Finalidade** | Mostrar se o preço de um item subiu ou caiu |
| **Base legal** | Art. 7º, V |
| **Dados** | `price_quotes`: preço e **URL da loja** consultada, vinculados ao casal |
| **Terceiros** | A leitura da página é feita **pelo servidor**, por Edge Function, passando por guard anti-SSRF. Nenhum cookie, referer ou identificador nosso vai junto: a loja não fica sabendo quem consultou |
| **Retenção** | **180 dias**, por expurgo automático diário |

### 8. Limites de uso

| | |
|---|---|
| **Finalidade** | Impedir varredura de convites e enumeração de apelidos |
| **Base legal** | Art. 7º, IX — legítimo interesse (segurança do próprio titular e dos demais) |
| **Dados** | `rate_limit_hits`: ação e uma chave (id de usuário ou hash), com carimbo de tempo |
| **Acesso** | RLS ligado e **zero policies**: nem o titular alcança; só funções `security definer` |
| **Retenção** | 2 horas |

### 9. Consentimentos de métricas e comunicação

| | |
|---|---|
| **Finalidade** | Guardar a resposta da pessoa para quando existirem métricas e e-mail de novidades |
| **Base legal** | Art. 7º, I — consentimento |
| **Dados** | `profiles.consent_analytics_at`, `profiles.consent_marketing_at` |
| **Estado de hoje** | **Nenhum dos dois é usado.** Não há analytics, não há Sentry e não há envio de e-mail de marketing. A tela diz isso à pessoa, com essas palavras |

## Dados que o projeto decidiu NÃO coletar

Minimização, Art. 6º, III. A decisão é de produto, não só de conformidade.

- CPF, RG ou qualquer documento
- Endereço completo
- Geolocalização precisa
- Renda em valor exato (só a faixa, e opcional)
- Data de nascimento (só o booleano `is_adult`)

## Direitos do titular

| Direito | Como é atendido hoje |
|---|---|
| Acesso e portabilidade (Art. 18, II e V) | `/perfil` → exportar em JSON ou CSV, na hora |
| Correção (III) | As telas do app editam nome, apelido, faixa, jornadas e aportes |
| Eliminação (VI) | `/perfil` → apagar a conta, com a palavra EXCLUIR. Apaga também as fotos do bucket quando o plano acaba |
| Revogação do consentimento (IX) | `/perfil` → os três toggles. O da faixa de renda apaga o dado junto |
| Informação sobre compartilhamento (VII) | Esta seção e a política de privacidade |

O export **mascara o e-mail do parceiro** e não leva o `token_hash` dos
convites: um titular não leva embora o endereço de outro nem segredo do
sistema.

## Operadores (suboperadores)

| Quem | Para quê | Onde |
|---|---|---|
| Supabase | Banco, autenticação, storage, edge functions | `sa-east-1` (São Paulo) |
| Vercel | Hospedagem do front | Edge; não guarda dado pessoal em repouso |
| Envio de e-mail | Confirmação de cadastro e recuperação de senha | **Hoje é o remetente padrão do Supabase.** SMTP próprio está pendente |

## Medidas de segurança

- RLS em **todas** as 9 tabelas, com policy que compara contra a lista de
  casais do usuário autenticado. Nenhuma usa `using (true)`
- `couple_id` sempre do JWT, nunca do corpo da requisição
- Sessão em cookie `httpOnly` + `secure` + `sameSite=lax`
- Token de convite guardado só como SHA-256
- Guard anti-SSRF em toda leitura de URL externa
- Nenhum log ou evento carrega valor monetário, e-mail ou `couple_id`
- Teste automatizado de isolamento entre casais, obrigatório no CI

## O que muda na fase 2 — ainda NÃO vale

Esta seção descreve o pretendido. **Nada aqui está implementado**, e o ROPA
precisa ser revisado antes de qualquer um destes entrar no ar.

- **Push notification** (app nativo): passa a tratar token de dispositivo. O
  corpo da notificação não carrega valor — decisão já registrada
- **Lojas de aplicativo**: Apple e Google passam a ser operadores de
  distribuição, e exigem política publicada e formulário de privacidade
- **Sentry**, se entrar: tratamento novo, com `beforeSend` removendo PII
- **Métricas de uso**, se entrarem: o consentimento já é coletado, mas o
  tratamento não existe

## Histórico

| Data | O quê |
|---|---|
| 2026-09-13 | Primeira versão, a partir do schema em produção |
