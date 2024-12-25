import express from "express";
import * as carController from "./car.controller.js";
import auth from "../../middleware/auth.js";
import { asyncHandler } from "../utils/errorHandler.js";
import uploadFileCloud from "../utils/multerCloud.js";
import allowedExtensions from "../utils/allowedExtention.js";

const router = express.Router();

router.post(
  "/registerUserCar",
  auth,
  uploadFileCloud({ extensions: allowedExtensions.image }).single("logo"),
  asyncHandler(carController.registerCar)
);
/* router.post(
  "/registerWithCarNumber",
  auth,
  asyncHandler(carController.registerCar)
); */
router.get("/userCars", auth, asyncHandler(carController.getAllUserCars));
router.put(
  "/updateUserCar/:carId",
  auth,
  uploadFileCloud({ extensions: allowedExtensions.image }).single("logo"),
  asyncHandler(carController.updateCar)
);
router.delete(
  "/deleteUserCarForUser/:carId",
  auth,
  asyncHandler(carController.deleteCarForUser)
);
router.delete(
  "/deleteCarAdmin/:carId",
  auth,
  asyncHandler(carController.deleteCarAdmin)
);
router.get("/allCars", asyncHandler(carController.getAllCars));
router.get("/car/:carId", asyncHandler(carController.getCarById));
router.post(
  "/addCarBrand",
  auth,
  uploadFileCloud({ extensions: allowedExtensions.image }).single("logo"),
  asyncHandler(carController.addCarBrand)
);
router.get("/getAllcarBrands", asyncHandler(carController.getAllcarBrands));
router.delete(
  "/deleteCarBrand/:id",
  auth,
  asyncHandler(carController.deleteCarBrand)
);
router.post(
  "/registerCarwithBrand",
  auth,
  asyncHandler(carController.registerCarwithBrand)
);
export default router;
