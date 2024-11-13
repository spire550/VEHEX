import express from "express";
import * as carController from "./car.controller.js";
import auth from "../../middleware/auth.js";
import { asyncHandler } from "../utils/errorHandler.js";

// Assuming you have an authentication middleware

const router = express.Router();

// Route to register car by engine number or car details
router.post(
  "/registerWithData",
  auth,
  asyncHandler(carController.registerCarByCarDetails)
);
router.post(
  "/registerWithCarNumber",
  auth,
  asyncHandler(carController.registerCarByEngineNumber)
);
router.get("/userCars", auth, asyncHandler(carController.getAllCars));

export default router;
