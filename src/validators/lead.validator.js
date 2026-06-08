import { z } from "zod";

export const createLeadSchema = z.object({
  propertyId: z.coerce.number(),
  type: z.enum(["call", "whatsapp"]),
});