// import asyncHandler from "../../utils/asyncHandler.js";
// import { db } from "../../config/db/index.js";
// import { dealers, users } from "../../config/db/schema.js";
// import { eq } from "drizzle-orm";
// import { ApiError } from "../../utils/ApiError.js";
// export const createDealer = asyncHandler(async (req, res, next) => {
//   const data = req.body;

//   // 🔥 basic check (minimum required fields)
//   if (!data.name || !data.contact) {
//     return next(new ApiError("Name and Contact are required", 400));
//   }

//   // 🔍 duplicate check (by contact)
//   const existing = await db
//     .select()
//     .from(dealers)
//     .where(eq(dealers.contact, data.contact));

//   if (existing.length > 0) {
//     return next(new ApiError("Dealer already exists", 400));
//   }

//   // 📸 optional logo (if multer used)
//   if (req.file) {
//     data.logo = req.file.path || req.file.url;
//   }

//   // ✅ INSERT DIRECT BODY
//   const result = await db
//     .insert(dealers)
//     .values({
//       ...data,
//     })
//     .returning();

//   res.status(201).json({
//     success: true,
//     message: "Dealer created successfully",
//     data: result[0],
//   });
// });

// // ✅ GET ALL DEALERS
// export const getDealers = asyncHandler(async (req, res) => {
//   const result = await db.select().from(dealers);

//   res.json({
//     success: true,
//     count: result.length,
//     data: result,
//   });
// });

// // ✅ GET DEALER BY ID
// export const getDealerById = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   const result = await db
//     .select()
//     .from(dealers)
//     .where(eq(dealers.id, id));

//   if (!result.length) {
//     return res.status(404).json({
//       success: false,
//       message: "Dealer not found",
//     });
//   }

//   res.json({
//     success: true,
//     data: result[0],
//   });
// });

// // ✅ UPDATE DEALER
// export const updateDealer = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   const result = await db
//     .update(dealers)
//     .set(req.body)
//     .where(eq(dealers.id, id))
//     .returning();

//   if (!result.length) {
//     return res.status(404).json({
//       success: false,
//       message: "Dealer not found",
//     });
//   }

//   res.json({
//     success: true,
//     data: result[0],
//   });
// });

// // ❌ DELETE DEALER
// export const deleteDealer = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   const result = await db
//     .delete(dealers)
//     .where(eq(dealers.id, id))
//     .returning();

//   if (!result.length) {
//     return res.status(404).json({
//       success: false,
//       message: "Dealer not found",
//     });
//   }

//   res.json({
//     success: true,
//     message: "Dealer deleted successfully",
//   });
// });




// -------> NEW CODE <-------

import asyncHandler from "../../utils/asyncHandler.js";
import { db } from "../../config/db/index.js";
import { dealers, users } from "../../config/db/schema.js";
import { eq } from "drizzle-orm";
import { ApiError } from "../../utils/ApiError.js";

// ✅ CREATE DEALER (user + dealer sync)
export const createDealer = asyncHandler(async (req, res, next) => {
  const {
    name,
    email,
    contact,
    address,
    area,
    location,
    lat,
    lng,
  } = req.body;

  if (!name || !contact) {
    return next(new ApiError("Name and Contact are required", 400));
  }

  // 🔥 DEBUG (optional but useful)
  console.log("BODY:", req.body);

  // 🔍 user check
  let existingUser = await db
    .select()
    .from(users)
    .where(eq(users.phone, contact));

  let userId;

  if (existingUser.length > 0) {
    userId = existingUser[0].id;

    if (existingUser[0].role !== "dealer") {
      await db
        .update(users)
        .set({ role: "dealer" })
        .where(eq(users.id, userId));
    }
  } else {
    const newUser = await db
      .insert(users)
      .values({
        phone: contact,
        role: "dealer",
      })
      .returning();

    userId = newUser[0].id;
  }

  // 🔍 dealer exists?
  const existingDealer = await db
    .select()
    .from(dealers)
    .where(eq(dealers.userId, userId));

  if (existingDealer.length > 0) {
    return next(new ApiError("Dealer already exists", 400));
  }

  // 📸 logo
  let logo = null;
  if (req.file) {
    logo = req.file.path || req.file.url;
  }

  // 🔥 SAFE LAT LNG HANDLING
  const safeLat =
    lat !== undefined && lat !== null ? Number(lat) : null;

  const safeLng =
    lng !== undefined && lng !== null ? Number(lng) : null;

  // 🔥 FINAL INSERT
  const result = await db
    .insert(dealers)
    .values({
      userId,
      name,
      email,
      contact,
      address,
      area,
      location,

      lat: safeLat,   // ✅ FIXED
      lng: safeLng,   // ✅ FIXED

      logo,
    })
    .returning();

  res.status(201).json({
    success: true,
    data: result[0],
  });
});


// ✅ GET ALL DEALERS
export const getDealers = asyncHandler(async (req, res) => {
  const result = await db.select().from(dealers);

  res.json({
    success: true,
    count: result.length,
    data: result,
  });
});


// ✅ GET DEALER BY ID
export const getDealerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await db
    .select()
    .from(dealers)
    .where(eq(dealers.id, Number(id)));

  if (!result.length) {
    return res.status(404).json({
      success: false,
      message: "Dealer not found",
    });
  }

  res.json({
    success: true,
    data: result[0],
  });
});


// ✅ UPDATE DEALER
export const updateDealer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let updateData = { ...req.body };

  if (req.file) {
    updateData.logo = req.file.path || req.file.url;
  }

  const result = await db
    .update(dealers)
    .set(updateData)
    .where(eq(dealers.id, Number(id)))
    .returning();

  if (!result.length) {
    return res.status(404).json({
      success: false,
      message: "Dealer not found",
    });
  }

  res.json({
    success: true,
    data: result[0],
  });
});


// ❌ DELETE DEALER (role downgrade)
export const deleteDealer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 🔍 find dealer first
  const dealer = await db
    .select()
    .from(dealers)
    .where(eq(dealers.id, Number(id)));

  if (!dealer.length) {
    return res.status(404).json({
      success: false,
      message: "Dealer not found",
    });
  }

  const userId = dealer[0].userId;

  // ❌ delete dealer
  await db.delete(dealers).where(eq(dealers.id, Number(id)));

  // 🔽 downgrade role
  await db
    .update(users)
    .set({ role: "user" })
    .where(eq(users.id, userId));

  res.json({
    success: true,
    message: "Dealer deleted & user downgraded",
  });
});