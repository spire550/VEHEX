import { Router } from "express";
import * as dashbaordController from "./dashboardStatus.js";
import { asyncHandler } from "../utils/errorHandler.js";
import auth from "../../middleware/auth.js";
const router = Router();


router.get("/stats", asyncHandler(dashbaordController.getDashboardStats));
router.get("/sales", asyncHandler(dashbaordController.sales));

export default router;
