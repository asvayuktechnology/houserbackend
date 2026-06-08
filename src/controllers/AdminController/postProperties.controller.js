import asyncHandler from "../../utils/asyncHandler.js";
import { db } from "../../config/db/index.js";
import { leads } from "../../config/db/schema.js";
import { users, otps } from "../../config/db/schema.js";
import { ApiError } from "../../utils/ApiError.js";
import { eq, and, gt ,sql} from "drizzle-orm";
import jwt from "jsonwebtoken";



export const getAdminProperties = asyncHandler(async (req, res) => {


  const result = await db.execute(sql`
    SELECT 
      p.*,

      true AS "isUnlocked", -- admin ke liye always true
      p.owner_phone AS "ownerPhone" -- always visible

    FROM properties p
    ORDER BY p.id DESC
  `);

  res.json({
    success: true,
    data: result.rows,
  });
});