import type { z } from "zod";
import type {
  contributionSchema,
  coupleSchema,
  goalItemSchema,
  goalSchema,
} from "./schemas";

export type Couple = z.infer<typeof coupleSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type GoalItem = z.infer<typeof goalItemSchema>;
export type Contribution = z.infer<typeof contributionSchema>;
