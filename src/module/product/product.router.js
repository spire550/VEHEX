import express from "express";
import * as productsController from "./product.controller.js";
import { asyncHandler } from "../utils/errorHandler.js";
import auth from "../../middleware/auth.js";
import { uploadFileCloud } from "../utils/multerCloud.js";
import allowedExtensions from "../utils/allowedExtention.js";
const router = express.Router();

// Admin-only route to add products
router.post(
  "/addProduct",
  auth,
  uploadFileCloud({ extensions: allowedExtensions.image }).array(
    "productImage",
    4
  ),
  asyncHandler(productsController.addProduct)
);

// Public route to get products
router.get("/", asyncHandler(productsController.getProducts));
router.get("/getAllProducts", asyncHandler(productsController.getAllProducts));

router.get(
  "/loggedUserProducts",
  auth,
  asyncHandler(productsController.getProductsForUser)
);
router.get(
  "/selectedCar/:carId",
  auth,
  asyncHandler(productsController.getProductsForSelectedCar)
);
router.get(
  "/prouctsByCategory/:categoryId",
  asyncHandler(productsController.getProductsByCategory)
);

router.delete(
  "/deleteProduct/:productId",
  auth,
  asyncHandler(productsController.deleteProduct)
);
router.get(
  "/getCarById/:productId",
  asyncHandler(productsController.getProductById)
);
export default router;
