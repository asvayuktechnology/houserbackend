import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10).max(15),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "dealer", "admin"]).default("user"),
  companyName: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().trim().optional(),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().min(10).max(15).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  role: z.enum(["user", "dealer", "admin"]).optional(),
  companyName: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  isActive: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be updated",
});

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const getUserParamsSchema = z.object({
  id: z.coerce.number(),
});
