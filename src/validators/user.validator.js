import { z } from "zod";

export const createUserSchema = z.object({
  phone: z.string().min(10).max(15),
  role:z.enum(["user", "dealer", "admin"]).default("user"),
});