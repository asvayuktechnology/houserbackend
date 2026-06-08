import asyncHandler from "../../utils/asyncHandler.js";
import { db } from "../../config/db/index.js";
import { properties, dealers, users } from "../../config/db/schema.js";
import { desc } from "drizzle-orm";

export const getDashboardData = asyncHandler(async (req, res) => {
  // ✅ counts (fast approach)
  const allProperties = await db.select().from(properties);
  const allDealers = await db.select().from(dealers);
  const allUsers = await db.select().from(users);

  // ✅ latest 2 (BEST PRACTICE: DB ORDER BY)
  const latestProperties = await db
    .select()
    .from(properties)
    .orderBy(desc(properties.createdAt))
    .limit(2);

  const latestDealers = await db
    .select()
    .from(dealers)
    .orderBy(desc(dealers.createdAt))
    .limit(2);

  const latestUsers = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(2);

  res.json({
    success: true,
    data: {
      counts: {
        properties: allProperties.length,
        dealers: allDealers.length,
        users: allUsers.length,
      },
      latest: {
        properties: latestProperties,
        dealers: latestDealers,
        users: latestUsers,
      },
    },
  });
});