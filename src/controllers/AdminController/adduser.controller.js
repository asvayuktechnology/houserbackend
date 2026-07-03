import asyncHandler from "../../utils/asyncHandler.js";
import { db } from "../../config/db/index.js";
import { users } from "../../config/db/schema.js";
import { or, ilike, eq, and, desc, count } from "drizzle-orm";
import bcrypt from "bcrypt";
import { ApiError } from "../../utils/ApiError.js";


export const createUserByAdmin = asyncHandler(async (req, res, next) => {
  const { name, email, phone, password, role, companyName, address, city, state } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  // check already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.phone, phone));

  if (existing.length) {
    return next(new ApiError("User already exists", 400));
  }

  const result = await db
    .insert(users)
    .values({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || "user",
      companyName,
      address,
      city,
      state,
    })
    .returning();

  res.status(201).json({
    success: true,
    data: result[0],
  });
});

// ✅ GET ALL USERS

export const getUsers = asyncHandler(async (req, res) => {
  const {
    phone,
    city,
    state,
    keyword,
    export: isExport = "false",
    page = 1,
    limit = 20,
  } = req.query;

  const conditions = [];

  if (city) {
    conditions.push(ilike(users.city, `%${city}%`));
  }

  if (phone) {
    conditions.push(eq(users.phone, phone));
  }

  if (state) {
    conditions.push(eq(users.state, `%${state}%`));
  }

  if (keyword) {
    conditions.push(
      or(
        ilike(users.name, `%${keyword}%`),
        ilike(users.email, `%${keyword}%`)
      )
    );
  }

  let data = [];
  let totalCount = 0;

  try {
    // ✅ COUNT QUERY
    const [countResult] = await db
      .select({
        totalCount: count(),
      })
      .from(users)
      .where(conditions.length ? and(...conditions) : undefined);

    totalCount = Number(countResult?.totalCount || 0);

    // ✅ MAIN DATA QUERY
    let query = db
      .select()
      .from(users)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(users.createdAt));

    // pagination only when export is NOT true
    if (isExport !== "true") {
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 20;

      query = query.limit(limitNum).offset((pageNum - 1) * limitNum);
    }

    data = await query;
  } catch (error) {
    console.error("❌ getUser error:", error);

    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }

  return res.status(200).json({
    success: true,
    currentCount: data.length,
    totalCount,
    data,
  });
});

// export const getUsers = asyncHandler(async (req, res) => {
//     const {
//     name,
//     phone,
//     email,
//     role,
//     // keyword,
//     export: isExport = "false",
//     page = 1,
//     limit = 20,
//   } = req.query;

//     const conditions = [];

//   if (name) {
//     conditions.push(ilike(fixedProperties.city, `%${city}%`));
//   }

//   if (mobileNumber) {
//     conditions.push(eq(fixedProperties.mobileNumber, mobileNumber));
//   }

//   if (sector) {
//     conditions.push(eq(fixedProperties.sector, sector));
//   }
//   if (plotNumber) {
//     conditions.push(eq(fixedProperties.plotNumber, plotNumber));
//   }

//     let data = [];
//     let totalCount = 0;
  
//     try {
//       // ✅ COUNT QUERY
//       const [countResult] = await db
//         .select({
//           totalCount: count(),
//         })
//         .from(fixedProperties)
//         .where(conditions.length ? and(...conditions) : undefined);
  
//       totalCount = Number(countResult?.totalCount || 0);
  
//       // ✅ MAIN DATA QUERY
//       let query = db
//         .select()
//         .from(fixedProperties)
//         .where(conditions.length ? and(...conditions) : undefined)
//         .orderBy(desc(fixedProperties.createdAt));
  
//       // pagination only when export is NOT true
//       if (isExport !== "true") {
//         const pageNum = Number(page) || 1;
//         const limitNum = Number(limit) || 20;
  
//         query = query.limit(limitNum).offset((pageNum - 1) * limitNum);
//       }
  
//       data = await query;
//     } catch (error) {
//       console.error("❌ getFixedProperties error:", error);
  
//       return res.status(500).json({
//         status: "error",
//         message: "Something went wrong",
//       });
//     }
  
//     return res.status(200).json({
//       success: true,
//       currentCount: data.length,
//       totalCount,
//       data,
//     });

// });


// ✅ UPDATE USER
export const updateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, email, phone, password, role, companyName, address, city, state, isActive } = req.body;

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, Number(id)));

  if (!existing.length) {
    return next(new ApiError("User not found", 404));
  }

  let hashedPassword;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  const updated = await db
    .update(users)
    .set({
      name: name ?? existing[0].name,
      email: email ?? existing[0].email,
      phone: phone ?? existing[0].phone,
      password: hashedPassword ?? existing[0].password,
      role: role ?? existing[0].role,
      companyName: companyName ?? existing[0].companyName,
      address: address ?? existing[0].address,
      city: city ?? existing[0].city,
      state: state ?? existing[0].state,
      isActive: isActive ?? existing[0].isActive,
    })
    .where(eq(users.id, Number(id)))
    .returning();

  res.json({
    success: true,
    data: updated[0],
  });
});


// ✅ DELETE USER
export const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, Number(id)));

  if (!existing.length) {
    return next(new ApiError("User not found", 404));
  }

  await db.delete(users).where(eq(users.id, Number(id)));

  res.json({
    success: true,
    message: "User deleted successfully",
  });
});