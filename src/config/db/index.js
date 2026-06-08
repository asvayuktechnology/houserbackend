import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

// 🔥 test connection
export const checkDB = async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("✅ DB Connected:", res.rows[0]);
  } catch (err) {
    console.error("❌ DB Error:", err.message);
  }
};