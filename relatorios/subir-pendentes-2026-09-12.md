# Pôr produção em dia — runbook

**Data:** 2026-09-12
**Alvo:** `qysekkewsrwtebpiowim` (`sa-east-1`) + `a-dois-web.vercel.app`
**Duração estimada:** 20 minutos, sem pressa em nenhum passo

---

## O que está quebrado, exatamente

Produção serve o build `d319e36` (confirmado: a página de login traz "Jornada"
e `#F7F0E1`), que tem a **UI da capa da jornada**. O banco tem 11 migrations,
sem o bucket `capas` e sem `goals.cover_path`.

**Só uma coisa está quebrada: o botão "Pôr uma foto"**, que falha com "Não
consegui usar essa foto". O caminho de leitura está intacto — sem a coluna,
`cover_path` é `undefined`, a lista de capas sai vazia e nada é assinado. Todo
o resto do app funciona normalmente.

## Por que este runbook não tem janela

A migration `regra_do_casal` originalmente apagava
`couple_members.split_rule` — coluna que o web publicado ainda lê. Isso
obrigaria `db push` e deploy a acontecerem juntos, sob pressão, sem rollback.

Esse `drop` foi movido para `20260912150948_regra_do_casal_contrai`, que **não
entra agora**. Com ele fora, **as cinco instruções destrutivas do lote viraram
uma só, isolada e adiada**, e todo o resto é aditivo:

| Migration | O que faz | Reversível? |
|---|---|---|
| `capa_da_jornada` | bucket `capas`, `goals.cover_path`, função, 4 policies | sim |
| `nome_no_cadastro` | `create_couple_for(uuid, text)`, trigger nova | sim |
| `regra_do_casal` | `couples.split_rule` + backfill (**a coluna velha fica**) | sim |
| `minha_linha_so_minha` | troca uma policy | sim |
| `regra_do_casal_contrai` | apaga `couple_members.split_rule` | **não — e é por isso que fica para depois** |

As quatro primeiras são inofensivas ao web que está no ar: ele lê
`couple_members.split_rule`, que continua existindo; ele não manda
`display_name` no cadastro, então a trigger grava nulo; e o `salvarMinhaDivisao`
dele já filtra pela própria linha, então passa no `with check` novo.

## Ensaio, já feito

`bash scripts/ensaio-producao.sh` levanta um Postgres descartável no estado
**exato de produção** (as 11 primeiras migrations), semeia dados que exercitam
os casos difíceis — um casal onde o dono quer `proporcional` e o parceiro tem
`igual` na linha dele, outro onde quem tinha `fixo` já saiu — aplica as
pendentes uma a uma e confere:

- nenhuma levanta;
- o backfill escolhe o dono e ignora quem saiu;
- `couple_members.split_rule` **continua existindo**;
- bucket privado, `cover_path` e as 4 policies no lugar;
- `create_couple_for` com uma versão só (a sobrecarga ambígua não voltou);
- o aporte semeado continua lá, com o valor intacto.

Rodar de novo antes de começar. Leva uns 40 segundos e é de graça.

---

## Os passos

### 1. Ligar o CLI ao projeto

```bash
supabase link --project-ref qysekkewsrwtebpiowim
```

Pede a senha do banco (Dashboard → Settings → Database). Não altera nada.

### 2. Ver o que vai entrar, sem aplicar

```bash
supabase db push --dry-run
```

**Esperado: exatamente 5 arquivos listados** — as quatro mais a contração.
Se aparecer número diferente, pare: o contador do `EVOLUCAO.md` está errado e
o ensaio rodou contra o estado errado.

### 3. Tirar a contração do caminho

`db push` aplica tudo que está pendente, e a contração **não pode entrar
agora**. Antes do push:

```bash
mkdir -p /tmp/contrai
mv supabase/migrations/20260912150948_regra_do_casal_contrai.sql /tmp/contrai/
```

> Guardar fora da pasta é feio e é o caminho mais curto. A alternativa seria
> um `db push` por arquivo, que a CLI não oferece.

### 4. Aplicar

```bash
supabase db push
```

**Esperado:** as 4 aplicadas, em ordem. Ao terminar, o botão "Pôr uma foto"
volta a funcionar em produção — **sem nenhum deploy**.

**O passo a vigiar:** as `create policy` em `storage.objects` exigem que o
papel `postgres` possa criar policy numa tabela de `supabase_storage_admin`.
Local funciona; no hospedado é o caminho documentado pelo Supabase, mas não
foi possível provar daqui. Se reprovar ali, ver o apêndice — não é emergência.

```bash
mv /tmp/contrai/20260912150948_regra_do_casal_contrai.sql supabase/migrations/
```

### 5. Conferir, no app de verdade

Quatro conferências, não os 8 itens do teste de fumaça (que é outra tarefa):

1. abrir uma jornada e **pôr uma foto** — é o que estava quebrado;
2. `/aportes` ainda mostra a regra de divisão certa — prova que o web
   publicado sobreviveu ao passo;
3. criar conta nova e confirmar pelo e-mail — a trigger mudou;
4. anotar um aporte — prova que o `with check` novo não fechou demais.

### 6. Subir o web

```bash
git push origin main
```

Vercel constrói e publica `1f32071`. **Sem pressa:** entre o passo 4 e este, o
app no ar segue funcionando igual. A única consequência de demorar é que, se
alguém trocar a regra de divisão pelo web antigo nesse meio, `couples.split_rule`
fica desatualizada — com zero usuários, é teórico, e o deploy resolve.

Depois do deploy, conferir de novo o item 2 acima: agora a regra é lida de
`couples`.

### 7. A contração — outro dia

Quando o web novo estiver no ar e testado, `supabase db push` de novo, que
aplica só a contração. **Como saber que dá:** abra `/aportes` em produção e
troque a regra de divisão. Salvou sem erro? O web no ar é o novo. Deu erro?
Ainda é o antigo — espere.

Sem pressa nenhuma: coluna morta não atrapalha ninguém.

---

## Rollback

Nenhuma das quatro destrói dado, então o undo é SQL, no SQL Editor do painel.

**`minha_linha_so_minha`**

```sql
drop policy couple_members_update on public.couple_members;
create policy couple_members_update on public.couple_members
  for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));
```

**`regra_do_casal`** — a coluna nova ainda não é lida por ninguém em produção:

```sql
alter table public.couples drop column split_rule;
```

**`nome_no_cadastro`** — recriar a versão de um argumento e a trigger antiga:

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.create_couple_for(new.id, null);
  insert into public.profiles (user_id) values (new.id);
  return new;
end; $$;
```

> Note que ela chama a versão de **dois** argumentos com `null`. Recriar a de
> um argumento traria de volta a sobrecarga ambígua (`42725`), que é o defeito
> que essa migration consertou.

**`capa_da_jornada`** — na ordem inversa:

```sql
drop policy capas_delete on storage.objects;
drop policy capas_update on storage.objects;
drop policy capas_insert on storage.objects;
drop policy capas_select on storage.objects;
drop function public.casal_do_caminho(text);
alter table public.goals drop constraint goals_cover_path_do_nosso_bucket;
alter table public.goals drop column cover_path;
delete from storage.objects where bucket_id = 'capas';
delete from storage.buckets where id = 'capas';
```

> O `delete from storage.objects` é o único passo que apaga algo de gente: as
> capas que tiverem sido enviadas nesse meio-tempo. Conferir antes se há
> alguma (`select count(*) from storage.objects where bucket_id = 'capas'`).

Reverter no banco **não** reverte o `supabase_migrations.schema_migrations`.
Se rolar rollback, apagar também a linha correspondente de lá, senão o
próximo `db push` acha que já aplicou.

---

## Apêndice — se as policies de Storage reprovarem

Rodar no SQL Editor do painel, que executa como `postgres`, e seguir o
`db push`. É o mesmo SQL da migration:

```sql
create policy capas_select on storage.objects
  for select to authenticated
  using (bucket_id = 'capas'
     and public.is_couple_member(public.casal_do_caminho(name)));

create policy capas_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'capas'
     and public.is_couple_member(public.casal_do_caminho(name)));

create policy capas_update on storage.objects
  for update to authenticated
  using (bucket_id = 'capas'
     and public.is_couple_member(public.casal_do_caminho(name)))
  with check (bucket_id = 'capas'
     and public.is_couple_member(public.casal_do_caminho(name)));

create policy capas_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'capas'
     and public.is_couple_member(public.casal_do_caminho(name)));
```

**Se as policies não entrarem de jeito nenhum, apague o bucket.** Com RLS
ligado e zero policies, o Storage nega tudo — o botão continua quebrado, e
agora com um bucket órfão contando espaço. Melhor voltar ao estado conhecido
do que ficar no meio.
