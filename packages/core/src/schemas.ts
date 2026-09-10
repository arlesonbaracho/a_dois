import { z } from "zod";

// Formas de domínio, conferidas contra
// supabase/migrations/20260910003818_esquema_inicial.sql.
//
// Não confundir com o Database de packages/api: aquele descreve a linha crua
// que o PostgREST devolve (snake_case, gerado do banco), este descreve o objeto
// que a UI edita e valida. São trabalhos diferentes; quando os formulários
// entrarem, estes viram schemas de entrada e param de espelhar a linha inteira.

const uuid = z.uuid();
const cents = z.int().nonnegative();
const timestamp = z.iso.datetime();

export const coupleSchema = z.object({
  id: uuid,
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const goalSchema = z.object({
  id: uuid,
  coupleId: uuid,
  title: z.string().min(1).max(120),
  category: z.string().min(1).max(40),
  targetAmountCents: cents,
  deadlineAt: timestamp.nullable(),
  priority: z.enum(["baixa", "media", "alta"]),
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const goalItemSchema = z.object({
  id: uuid,
  coupleId: uuid,
  goalId: uuid,
  name: z.string().min(1).max(120),
  estimatedPriceCents: cents.nullable(),
  status: z.enum(["desejado", "pesquisando", "comprado"]),
  url: z.url().nullable(),
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const contributionSchema = z.object({
  id: uuid,
  coupleId: uuid,
  goalId: uuid,
  // Nulo quando quem aportou saiu do casal — o aporte vira "ex-membro".
  userId: uuid.nullable(),
  amountCents: cents.positive(),
  contributedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
});
