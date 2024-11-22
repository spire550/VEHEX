import express from "express";
import * as packageController from "./package.controller.js";
import { asyncHandler } from "../utils/errorHandler.js";
import auth from "../../middleware/auth.js";
import uploadFileCloud from "../utils/multerCloud.js";
import allowedExtensions from "../utils/allowedExtention.js";

const router = express.Router();

router.post(
  "/createPackage",
  auth,
  uploadFileCloud({ extensions: allowedExtensions.image }).single("logo"),
  asyncHandler(packageController.createPackage)
);
router.get("/allPackages", asyncHandler(packageController.getPackages));
router.put(
  "/updatePackage/:packageId",
  auth,
  uploadFileCloud({ extensions: allowedExtensions.image }).single("logo"),
  asyncHandler(packageController.updatePackage)
);
router.delete(
  "/deletePackage/:packageId",
  auth,
  asyncHandler(packageController.deletePackage)
);

router.get(
  "/getPackageCar/:carId",
  auth,
  asyncHandler(packageController.getPackageForCar)
);
router.get(
  "/getUserPackage/packages",
  auth,
  asyncHandler(packageController.getPackagesForUserCars)
); // Get all packages for user's cars under warranty

router.get(
  "/getpackageById/:packageId",
  asyncHandler(packageController.getPackageById)
);
export default router;
