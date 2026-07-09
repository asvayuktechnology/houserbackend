import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import { users } from "./src/config/db/schema.js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

const seed = async () => {
  try {
    console.log("🌱 Seeding started...");

    const salt = await bcrypt.genSalt(10);

    // ===== ADMIN =====
    const adminPassword = await bcrypt.hash("Admin@123//", salt);

    const adminData = {
      name: "Admin",
      email: "houzer@gmail.com",
      password: adminPassword,
      role: "admin",
      phone: "9999999999",
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    };

    // ===== DUMMY USERS =====
    const dummyPassword = await bcrypt.hash("User@1234", salt);

    const dummyUsers = [
      {
        name: "Rahul Sharma",
        email: "rahul@gmail.com",
        password: dummyPassword,
        role: "user",
        phone: "9876543210",
        city: "Gurugram",
        state: "Haryana",
        address: "Sector 14, Gurugram",
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
      {
        name: "Priya Singh",
        email: "priya@gmail.com",
        password: dummyPassword,
        role: "user",
        phone: "9876543211",
        city: "Delhi",
        state: "Delhi",
        address: "Lajpat Nagar, Delhi",
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
      {
        name: "Amit Verma",
        email: "amit@gmail.com",
        password: dummyPassword,
        role: "user",
        phone: "9876543212",
        city: "Noida",
        state: "Uttar Pradesh",
        address: "Sector 62, Noida",
        isActive: true,
        emailVerified: false,
      },
      {
        name: "Neha Gupta",
        email: "neha@gmail.com",
        password: dummyPassword,
        role: "user",
        phone: "9876543213",
        city: "Faridabad",
        state: "Haryana",
        address: "Sector 21, Faridabad",
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
      {
        name: "Vikas Kumar",
        email: "vikas@gmail.com",
        password: dummyPassword,
        role: "user",
        phone: "9876543214",
        city: "Gurugram",
        state: "Haryana",
        address: "DLF Phase 3, Gurugram",
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    ];

    // ===== DUMMY DEALERS =====
    const dealerPassword = await bcrypt.hash("Dealer@1234", salt);

    const dummyDealers = [
      {
        name: "Suresh Properties",
        email: "suresh@dealer.com",
        password: dealerPassword,
        role: "dealer",
        phone: "9876543220",
        companyName: "Suresh Real Estate",
        city: "Gurugram",
        state: "Haryana",
        address: "MG Road, Gurugram",
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
      {
        name: "HomeFinders India",
        email: "homefinders@dealer.com",
        password: dealerPassword,
        role: "dealer",
        phone: "9876543221",
        companyName: "HomeFinders Pvt Ltd",
        city: "Delhi",
        state: "Delhi",
        address: "Connaught Place, Delhi",
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
      {
        name: "PropertyHub",
        email: "propertyhub@dealer.com",
        password: dealerPassword,
        role: "dealer",
        phone: "9876543222",
        companyName: "PropertyHub Solutions",
        city: "Noida",
        state: "Uttar Pradesh",
        address: "Sector 18, Noida",
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    ];

    // Insert admin
    await db.insert(users).values(adminData);
    console.log("✅ Admin inserted: houzer@gmail.com / Admin@123//");

    // Insert dummy users
    for (const user of dummyUsers) {
      await db.insert(users).values(user);
      console.log(`✅ User inserted: ${user.email}`);
    }

    // Insert dummy dealers
    for (const dealer of dummyDealers) {
      await db.insert(users).values(dealer);
      console.log(`✅ Dealer inserted: ${dealer.email}`);
    }

    console.log("\n🎉 Seeding completed successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("ADMIN LOGIN:");
    console.log("  Email:    houzer@gmail.com");
    console.log("  Password: Admin@123//");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("USER PASSWORDS: User@1234");
    console.log("DEALER PASSWORDS: Dealer@1234");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    if (error.code === "23505") {
      console.error("⚠️  Duplicate entry found. Some data may already exist.");
    }
  } finally {
    await pool.end();
  }
};

seed();
