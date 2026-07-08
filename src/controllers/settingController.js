import asyncHandler from "../utils/asyncHandler.js";
import { db } from "../config/db/index.js";
import { settings } from "../config/db/schema.js";
import { eq } from "drizzle-orm";
import { ApiError } from "../utils/ApiError.js";


// CREATE SETTINGS
export const createSetting = asyncHandler(async (req, res, next) => {
  try {
    const {
      email,
      phoneNo,
      address,
    } = req.body;


    const [existingSetting] = await db
      .select()
      .from(settings)
      .limit(1);


    if (existingSetting) {
      return next(
        new ApiError("Settings already created", 400)
      );
    }


    const [setting] = await db
      .insert(settings)
      .values({
        email: email ?? null,
        phoneNo: phoneNo ?? null,
        address: address ?? null,
      })
      .returning();


    return res.status(201).json({
      success: true,
      message: "Settings created successfully",
      data: setting,
    });


  } catch (error) {
    console.error("Create Setting Error:", error);
    return next(error);
  }
});



// GET SETTINGS
export const getSetting = asyncHandler(async (req, res, next) => {
  try {

    const [setting] = await db
      .select()
      .from(settings)
      .limit(1);


    if (!setting) {
      return next(
        new ApiError("Settings not found", 404)
      );
    }


    return res.status(200).json({
      success: true,
      data: setting,
    });


  } catch (error) {
    console.error("Get Setting Error:", error);
    return next(error);
  }
});




// PATCH SETTINGS
export const updateSetting = asyncHandler(async (req, res, next) => {
  try {
    console.log(req.body, 'body');

    const {
      email,
      phoneNo,
      address,
      smtp,
    } = req.body;


    const [existingSetting] = await db
      .select()
      .from(settings)
      .limit(1);


    if (!existingSetting) {
      return next(
        new ApiError("Settings not found", 404)
      );
    }


    // Logo handling
    let logo = existingSetting.logo;

    if (req.files?.length) {
      logo = req.files[0].path; 
    }


    // SMTP handling
    let updatedSmtp = existingSetting.smtp;


    if (smtp) {
      let newSmtp;

      // agar frontend JSON bhej raha hai string me
      if (typeof smtp === "string") {
        newSmtp = JSON.parse(smtp);
      } else {
        newSmtp = smtp;
      }


      updatedSmtp = {
        ...existingSetting.smtp,
        ...newSmtp,
        encryption: {
          ...existingSetting.smtp?.encryption,
          ...newSmtp.encryption,
        },
      };
    }
console.log(updatedSmtp, 'updatedSmtp')
    const [updatedSetting] = await db
      .update(settings)
      .set({
        email: email ?? existingSetting.email,

        phoneNo: phoneNo ?? existingSetting.phoneNo,

        address: address ?? existingSetting.address,

        logo,

        smtp: updatedSmtp,

        updatedAt: new Date(),
      })
      .where(
        eq(settings.id, existingSetting.id)
      )
      .returning();


    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: updatedSetting,
    });


  } catch (error) {
    console.error("Update Setting Error:", error);
    return next(error);
  }
});