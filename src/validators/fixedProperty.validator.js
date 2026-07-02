import { z } from "zod";

export const fixedPropertyImportRowSchema = z.object({
  city: z.string().min(1, "City is required"),
  sector: z.string().min(1, "SectorId is required"),
  plotNumber: z.string().min(1, "PlotNumber is required"),
  categoryCode: z.string(),
  subCategoryCode: z.string(),
  name: z.string(),
  fatherName: z.string().optional().default(""),
  permanentAddress: z.string().optional().default(""),
  correspondenceAddress: z.string().optional().default(""),
  mobileNumber: z
    .string(),
    // .min(10, "MobileNumber must be at least 10 digits"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  imageUrl: z.string().optional().default(""),
});

export const createFixedPropertySchema = z.object({
  city: z.string().min(1, "City is required"),
  sector: z.string().min(1, "Sector is required"),
  plotNumber: z.string().min(1, "PlotNumber is required"),
  categoryCode: z.string().min(1, "CategoryCode is required"),
  subCategoryCode: z.string().min(1, "SubCategoryCode is required"),
  name: z.string().min(1, "Name is required"),
  fatherName: z.string().optional(),
  permanentAddress: z.string().optional(),
  correspondenceAddress: z.string().optional(),
  mobileNumber: z.string().min(10, "MobileNumber must be at least 10 digits"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  imageUrl: z.string().optional(),
});

export const updateFixedPropertySchema = z.object({
  city: z.string().optional(),
  sector: z.string().optional(),
  plotNumber: z.string().optional(),
  categoryCode: z.string().optional(),
  subCategoryCode: z.string().optional(),
  name: z.string().optional(),
  fatherName: z.string().optional(),
  permanentAddress: z.string().optional(),
  correspondenceAddress: z.string().optional(),
  mobileNumber: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  imageUrl: z.string().optional(),
});
