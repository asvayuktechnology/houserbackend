import { z } from "zod";

// 🔥 phone validation
 export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Invalid phone number"); // India format

export const createDealerSchema = z.object({
  name: z.string().trim().min(1, "Name required"),

  email: z.string().email().optional(),

  contact: phoneSchema,

  address: z.string().optional(),
  area: z.string().optional(),
  location: z.string().optional(),

  // 🔥 ADD THESE
  lat: z.coerce.number().optional(),  // string ya number dono accept karega
  lng: z.coerce.number().optional(),
});

// validation schema for byid 
export const getDealerParamsSchema = z.object({
  id: z.coerce.number(),
});

export const updateDealerSchema = z
  .object({
    name: z.string().trim().optional(),
    email: z.string().email().optional(),
    contact: phoneSchema.optional(),
    address: z.string().optional(),
    area: z.string().optional(),
    location: z.string().optional(),

    // 🔥 ADD HERE ALSO
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be updated",
  });