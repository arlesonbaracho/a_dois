import { z } from "zod";

// Provisório: o Prompt 2 (migrations + RLS) é que vira a fonte de verdade do
// schema. Estes objetos existem para os formulários e a camada de dados terem
// contra o que validar até lá.

const uuid = z.uuid();
const cents = z.int().nonnegative();
const timestamp = z.iso.datetime();

export const coupleSchema = z.object({
  id: uuid,
  createdAt: timestamp,
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
});

export const contributionSchema = z.object({
  id: uuid,
  coupleId: uuid,
  goalId: uuid.nullable(),
  userId: uuid,
  amountCents: cents,
  contributedAt: timestamp,
});
