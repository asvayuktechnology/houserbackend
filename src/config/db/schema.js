import { pgTable, serial, varchar, text, integer, timestamp,boolean } from "drizzle-orm/pg-core";
import { json } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";


export const bannerCategoryEnum = pgEnum("banner_category", [
  "homepage",
  "properties",
  "dealer",
]);


// USERS TABLE
export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  phone: varchar("phone", { length: 15 }).notNull().unique(),

  role: varchar("role", { length: 10 }).default("user"), // user / dealer / admin 

  isActive: boolean("is_active").default(true), // for blocking users

  createdAt: timestamp("created_at").defaultNow(), // for record-keeping
});

// OTP TABLE
export const otps = pgTable("otps", {
  id: serial("id").primaryKey(),

  phone: varchar("phone", { length: 20 }).notNull(),
  otp: varchar("otp", { length: 6 }).notNull(),

  expiresAt: timestamp("expires_at").notNull(),  // expired in 5 minutes
});

// PROPERTIES TABLE
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),

  createdBy: integer("created_by"),
  creatorRole: varchar("creator_role", { length: 10 }),

  city: varchar("city", { length: 100 }).notNull(),
  sector: varchar("sector", { length: 50 }),
  plotNumber: varchar("plot_number", { length: 50 }),

  category: varchar("category", { length: 50 }),
  plotSize: varchar("plot_size", { length: 50 }),
  propertyStatus: varchar("property_status", { length: 10 }),

  ownerName: varchar("owner_name", { length: 100 }),
  ownerPhone: varchar("owner_phone", { length: 20 }),
  permanentAddress: text("permanent_address"),

  comments: text("comments"),

 images: json("images"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// FIXED PROPERTIES TABLE (FOR ADMIN) - ADMIN CAN'T DELETE THESE, CAN ONLY CHANGE STATUS
export const fixedproperties = pgTable("fixedproperties", {
  id: serial("id").primaryKey(),

  createdBy: integer("created_by"),
  creatorRole: varchar("creator_role", { length: 10 }),

  city: varchar("city", { length: 100 }).notNull(),
  sector: varchar("sector", { length: 50 }),
  plotNumber: varchar("plot_number", { length: 50 }),

  category: varchar("category", { length: 50 }),
  plotSize: varchar("plot_size", { length: 50 }),
  propertyStatus: varchar("property_status", { length: 10 }),

  ownerName: varchar("owner_name", { length: 100 }),
  ownerPhone: varchar("owner_phone", { length: 20 }),
  permanentAddress: text("permanent_address"),

  comments: text("comments"),

  images: json("images"),

  createdAt: timestamp("created_at").defaultNow(),
});

// DEALERS TABLE 

export const dealers = pgTable("dealers", {
  id: serial("id").primaryKey(),

  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),

  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }),
  contact: varchar("contact", { length: 20 }).notNull(),

  address: text("address"),
  area: varchar("area", { length: 100 }),

  // 🔥 ADD THESE
  lat: varchar("lat", { length: 50 }).default("0"),
  lng: varchar("lng", { length: 50 }).default("0"),

  // optional (readable address)
  location: varchar("location", { length: 255 }),

  logo: text("logo"),

  createdAt: timestamp("created_at").defaultNow(),
});
// LEADS TABLE 
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),

  propertyId: integer("property_id").notNull(),
  ownerId: integer("owner_id").notNull(), // 🔥 jisko lead milegi

  userId: integer("user_id"), // 🔥 jisne click kiya

  type: varchar("type", { length: 20 }), // call / whatsapp

  createdAt: timestamp("created_at").defaultNow(),
});

// BANNERS TABLE

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),

  category: bannerCategoryEnum("category")
    .default("homepage") // ✅ default set
    .notNull(),

  title: varchar("title", { length: 255 }).notNull(),

  imageUrl: text("image_url").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// POST PROPERTIES TABLE (FOR PROPERTIES ADDED BY USERS/DEALERS - CAN BE DELETED BY ADMIN)
export const postProperties = pgTable("post_properties", {
  id: serial("id").primaryKey(),

  // 🔥 owner (user ya dealer dono)
  createdBy: integer("created_by")
    .references(() => users.id)
    .notNull(),

  city: varchar("city", { length: 100 }).notNull(),
  sector: varchar("sector", { length: 50 }),
  plotNumber: varchar("plot_number", { length: 50 }),

  category: varchar("category", { length: 50 }),
  plotSize: varchar("plot_size", { length: 50 }),
  propertyStatus: varchar("property_status", { length: 10 }),

  ownerName: varchar("owner_name", { length: 100 }),
  ownerPhone: varchar("owner_phone", { length: 20 }),

  permanentAddress: text("permanent_address"),
  comments: text("comments"),

  images: json("images"),

  createdAt: timestamp("created_at").defaultNow(),
});


export const propertyUnlocks = pgTable("property_unlocks", {
  id: serial("id").primaryKey(),

  userId: integer("user_id").notNull(),
  propertyId: integer("property_id").notNull(),

  paymentId: varchar("payment_id", { length: 100 }),

  createdAt: timestamp("created_at").defaultNow(),
});