import asyncHandler from "../utils/asyncHandler.js";
import { eq, and, or, ilike, desc, count } from "drizzle-orm";
import { db } from "../config/db/index.js";
import { leads } from "../config/db/schema.js";
import { ApiError } from "../utils/ApiError.js";

// ✅ CREATE LEAD
export const createLead = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
       if (!userId) {
      return next(new ApiError("User authentication required", 401));
    }


  const { fullName, phoneNo, city, sector, plot, address, comment, type } = req.body;

  try {
    const [lead] = await db
      .insert(leads)
      .values({
        fullName: fullName ?? null,
        phoneNo: phoneNo ?? null,
        city: city ?? null,
        type: type ?? null,
        sector: sector ?? null,
        plot: plot ?? null,
        address: address ?? null,
        comment: comment ?? null,
        userId: userId, 
      })
      .returning();

    // console.log("Lead Data:", req.body);

    return res.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: lead,
    });
  } catch (error) {
    console.error("Create Lead Error:", error);
    return next(error);
  }
});

// ✅ GET MY LEADS
export const getAllLeadByAdmin = asyncHandler(async (req, res, next) => {
  try {
    const {
      name,
      city,
      phone,
      type,
      export: isExport = "false",
      page = 1,
      limit = 20,
    } = req.query;

    const conditions = [];

    // Search by name
    if (name) {
      conditions.push(
        ilike(leads.fullName, `%${name}%`)
      );
    }
    if (type) {
      conditions.push(
        ilike(leads.type, type)
      );
    }

    // Search by city
    if (city) {
      conditions.push(
        ilike(leads.city, `%${city}%`)
      );
    }

    // Search by phone
    if (phone) {
      conditions.push(
        ilike(leads.phoneNo, `%${phone}%`)
      );
    }




    // Total Count
    const [countResult] = await db
      .select({
        totalCount: count(),
      })
      .from(leads)
      .where(
        conditions.length
          ? and(...conditions)
          : undefined
      );


    const totalCount = Number(countResult?.totalCount || 0);


    // Main Query
    let query = db
      .select()
      .from(leads)
      .where(
        conditions.length
          ? and(...conditions)
          : undefined
      )
      .orderBy(desc(leads.createdAt));


    // Pagination only when export is false
    if (isExport !== "true") {

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 20;

      query = query
        .limit(limitNum)
        .offset(
          (pageNum - 1) * limitNum
        );
    }


    const data = await query;


    return res.status(200).json({
      success: true,
      message: "Leads fetched successfully",
       currentCount: data.length,
      totalCount,
    data
    });


  } catch (error) {
    console.error("Get Lead By Admin Error:", error);
    return next(error);
  }
});

export const getAllLeadByUser = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next(new ApiError("User authentication required", 401));
    }

    const {
      name,
      city,
      phone,
      type,
      export: isExport = "false",
      page = 1,
      limit = 20,
    } = req.query;


    const conditions = [
      eq(leads.userId, userId) // 👈 only logged-in user's leads
    ];


    if (name) {
      conditions.push(
        ilike(leads.fullName, `%${name}%`)
      );
    }

        if (type) {
      conditions.push(
        ilike(leads.type, type)
      );
    }


    if (city) {
      conditions.push(
        ilike(leads.city, `%${city}%`)
      );
    }


    if (phone) {
      conditions.push(
        ilike(leads.phoneNo, `%${phone}%`)
      );
    }


    // Total Count
    const [countResult] = await db
      .select({
        totalCount: count(),
      })
      .from(leads)
      .where(
        and(...conditions)
      );


    const totalCount = Number(countResult?.totalCount || 0);


    // Get Leads
    let query = db
      .select()
      .from(leads)
      .where(
        and(...conditions)
      )
      .orderBy(desc(leads.createdAt));


    // Pagination
    if (isExport !== "true") {
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 20;

      query = query
        .limit(limitNum)
        .offset(
          (pageNum - 1) * limitNum
        );
    }


    const data = await query;


    return res.status(200).json({
      success: true,
      message: "User leads fetched successfully",
     currentCount: data.length,
      totalCount,
      data,
    });


  } catch (error) {
    console.error("Get Lead By User Error:", error);
    return next(error);
  }
});

export const getLeadById = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(new ApiError("Lead id is required", 400));
    }

    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, Number(id)));

    if (!lead) {
      return next(new ApiError("Lead not found", 404));
    }

    return res.status(200).json({
      success: true,
      message: "Lead details fetched successfully",
      data: lead,
    });

  } catch (error) {
    console.error("Get Lead By Id Error:", error);
    return next(error);
  }
});

export const updateLead = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(new ApiError("Lead id is required", 400));
    }

    const {
      fullName,
      phoneNo,
      city,
      sector,
      plot,
      address,
      type,
      comment,
    } = req.body;


    const [updatedLead] = await db
      .update(leads)
      .set({
        fullName: fullName ?? undefined,
        phoneNo: phoneNo ?? undefined,
        city: city ?? undefined,
        sector: sector ?? undefined,
        type: type ?? undefined,
        plot: plot ?? undefined,
        address: address ?? undefined,
        comment: comment ?? undefined,
      })
      .where(eq(leads.id, Number(id)))
      .returning();


    if (!updatedLead) {
      return next(new ApiError("Lead not found", 404));
    }


    return res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      data: updatedLead,
    });


  } catch (error) {
    console.error("Update Lead Error:", error);
    return next(error);
  }
});
export const deleteLead = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;


    if (!id) {
      return next(new ApiError("Lead id is required", 400));
    }


    const [deletedLead] = await db
      .delete(leads)
      .where(eq(leads.id, Number(id)))
      .returning();


    if (!deletedLead) {
      return next(new ApiError("Lead not found", 404));
    }


    return res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
      data: deletedLead,
    });


  } catch (error) {
    console.error("Delete Lead Error:", error);
    return next(error);
  }
});