import { z } from "zod";

export const createPropertySchema = z.object({
  city: z.string().min(1, "City is required").lowercase(),

  sector: z.string().optional(),
  plotNumber: z.string().optional(),

  category: z.string().optional(),
  plotSize: z.string().optional(),

 propertyStatus: z
    .string()
    .transform((val) => val.toLowerCase().trim())
    .refine((val) => ["buy", "sell", "rent"].includes(val), {
      message: "Invalid property status",
    }),

  ownerName: z.string().optional(),
  // images: z.array(z.string()).optional(),
  ownerPhone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .optional(),

  permanentAddress: z.string().optional(),
  comments: z.string().optional(),
});

export const getPropertiesQuerySchema = z.object({
  propertyStatus: z.enum(["buy", "sell", "rent"]).optional(),

  city: z.string().optional(),
  sector: z.string().optional(),

  category: z.string().optional(),
  plotSize: z.string().optional(),

  search: z.string().optional(),
});