import { z } from "zod";

export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Invalid phone number");

export const createDealerSchema = z.object({
  city: z.string().trim().min(1, "City is required"),
  name: z.string().trim().min(1, "Name is required"),
  address: z.string().optional(),
  website: z.string().optional(),
  phone: phoneSchema,
  rating: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
});

export const getDealerParamsSchema = z.object({
  id: z.coerce.number(),
});

export const updateDealerSchema = z
  .object({
    city: z.string().trim().optional(),
    name: z.string().trim().optional(),
    address: z.string().optional(),
    website: z.string().optional(),
    phone: phoneSchema.optional(),
    rating: z.string().optional(),
    lat: z.string().optional(),
    lng: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be updated",
  });

export const dealerImportRowSchema = z.object({
  city: z.string().min(1, "City is required"),
  name: z.string().min(1, "Name is required"),
  address: z.string().optional().default(""),
  website: z.string().optional().default(""),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  rating: z.string().optional().default(""),
  lat: z.string().optional().default("0"),
  lng: z.string().optional().default("0"),
  userId: z.string().optional().default(""),
});
