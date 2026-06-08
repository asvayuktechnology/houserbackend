import "dotenv/config";

/** @type {import("drizzle-kit").Config} */
export default {
  schema: "./src/config/db/schema.js",
  out: "./drizzle",

  dialect: "postgresql", // ✅ MUST

  dbCredentials: {
    url: process.env.DATABASE_URL, // ✅ using connection string
  },
};