import asyncHandler from "../../utils/asyncHandler.js";
import { db } from "../../config/db/index.js";
import { users, otps } from "../../config/db/schema.js";
import { eq, and, gt } from "drizzle-orm";
import { ApiError } from "../../utils/ApiError.js";


export const createUserByAdmin = asyncHandler(async (req, res, next) => {
  const { phone, role } = req.body;

  if (!phone) {
    return next(new ApiError("Phone is required", 400));
  }

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
      phone,
      role: role || "user",
    })
    .returning();

  res.status(201).json({
    success: true,
    data: result[0],
  });
});

// ✅ GET ALL USERS
export const getUsers = asyncHandler(async (req, res) => {
  const result = await db.select().from(users);

  res.json({
    success: true,
    count: result.length,
    data: result,
  });
});


// ✅ UPDATE USER
export const updateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { phone, role } = req.body;

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, Number(id)));

  if (!existing.length) {
    return next(new ApiError("User not found", 404));
  }

  const updated = await db
    .update(users)
    .set({
      phone: phone ?? existing[0].phone,
      role: role ?? existing[0].role,
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