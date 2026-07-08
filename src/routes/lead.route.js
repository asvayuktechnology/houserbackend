import express from "express";
import {
  createLead,
  deleteLead,
  getAllLeadByAdmin,
  getAllLeadByUser,
  getLeadById,
  updateLead,
} from "../controllers/lead.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { adminProtect } from "../middlewares/admin.middleware.js";
import { protectAny } from "../middlewares/protectAny.middlreware.js";

const router = express.Router();

router.post("/lead", protectAny, createLead);
router.get("/lead", adminProtect, getAllLeadByAdmin);
router.get("/lead-all", protectAny, getAllLeadByUser);
router.get("/lead/:id", protectAny, getLeadById);
router.patch("/lead/:id", protectAny, updateLead);
router.delete("/lead/:id", protectAny, deleteLead);

export default router;
