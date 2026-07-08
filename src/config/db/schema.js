import { pgTable, serial, varchar, text, integer, timestamp,boolean, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
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

  name: varchar("name", { length: 100 }).notNull(),

  email: varchar("email", { length: 255 }).notNull().unique(),
  avatar: varchar("avatar", { length: 500 }),

  password: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 10 }).default("user"),  

  phone: varchar("phone", { length: 15 }).unique(),

  companyName: varchar("company_name", { length: 255 }),
  address: varchar("address", { length: 500 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),

  isActive: boolean("is_active").default(true).notNull(),

  emailVerified: boolean("email_verified").default(false).notNull(),
  emailVerifiedAt: timestamp("email_verified_at"),

  lastLogin: timestamp("last_login"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
export const fixedProperties = pgTable(
  "fixed_properties",
  {
    id: serial("id").primaryKey(),

    // 🔥 Property identity
    city: varchar("city", { length: 100 }).notNull(),
    sector: varchar("sector", { length: 50 }).notNull(),
    plotNumber: varchar("plot_number", { length: 50 }).notNull(),

    categoryCode: varchar("category_code", { length: 50 }).notNull(),
    subCategoryCode: varchar("sub_category_code", { length: 50 }).notNull(),

    // 👤 Owner details
    name: varchar("name", { length: 100 }).notNull(),
    fatherName: varchar("father_name", { length: 100 }),

    permanentAddress: text("permanent_address"),
    correspondenceAddress: text("correspondence_address"),

    mobileNumber: varchar("mobile_number"),
    email: varchar("email", { length: 100 }),

    // 🖼 Image (Cloudinary URL)
    imageUrl: text("image_url"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // 🔥 1. Property duplicate protection (MOST IMPORTANT)
    // uniquePlot: uniqueIndex("uniq_city_sector_plot").on(
    //   table.city,
    //   table.sector,
    //   table.plotNumber
    // ),

    // 🔥 2. Mobile must be unique
    // uniqueMobile: uniqueIndex("uniq_mobile").on(table.mobileNumber),

    // 🔥 3. Email unique (nullable allowed)
    // uniqueEmail: uniqueIndex("uniq_email").on(table.email),
  })
);

// DEALERS TABLE 

export const dealers = pgTable("dealers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  city: varchar("city", { length: 100 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  address: text("address"),
  website: varchar("website", { length: 255 }),
  phone: varchar("phone", { length: 20 }).notNull(),
  rating: varchar("rating", { length: 10 }),
  lat: varchar("lat", { length: 50 }).default("0"),
  lng: varchar("lng", { length: 50 }).default("0"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // uniqueDealer: uniqueIndex("uniq_dealer_unique").on(
  //   table.name, table.website, table.phone, table.lat, table.lng
  // ),
  // uniquePhone: uniqueIndex("uniq_dealer_phone").on(table.phone),
}));
// LEADS TABLE 
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),

  fullName: varchar("fullName", { length: 255 }),
  phoneNo: varchar("phoneNo", { length: 20 }),
  city: varchar("city", { length: 100 }),
  sector: varchar("sector", { length: 100 }),
  plot: varchar("plot", { length: 100 }),
  address: text("address"),
  comment: text("comment"),
  userId: integer("userId"),
    userId: integer("userId")
    .references(() => users.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").defaultNow(),
});

export const post = pgTable("post", {
  id: serial("id").primaryKey(),

  fullName: varchar("fullName", { length: 255 }),
  phoneNo: varchar("phoneNo", { length: 20 }),
  city: varchar("city", { length: 100 }),
  sector: varchar("sector", { length: 100 }),
  plot: varchar("plot", { length: 100 }),
  address: text("address"),
  comment: text("comment"),
   userId: integer("userId")
    .references(() => users.id, { onDelete: "cascade" }),

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
  link: text("link"),

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

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),

  email: varchar("email", { length: 255 }),

  phoneNo: varchar("phoneNo", { length: 20 }),

  address: text("address"),

  logo: text("logo"),

  smtp: jsonb("smtp"),

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),
});