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
  uploadFileCloud({ extensions: allowedExtensions.image }).fields([
    { name: "images", maxCount: 4 },
    { name: "video", maxCount: 1 },
  ]),
  asyncHandler(productsController.addProduct)
);

// Public route to get products
router.get("/getAllProducts", asyncHandler(productsController.getAllProducts));


router.get(
  "/prouctsByCategory/:categoryId",
  asyncHandler(productsController.getProductsByCategory)
);

router.delete(
  "/deleteProduct/:productId",
  auth,
  asyncHandler(productsController.deleteProduct)
);
router.get('/getAllProducts',asyncHandler(productsController.getAllProducts))
router.put('/products/:productId',auth,
  uploadFileCloud({ extensions: allowedExtensions.image }).fields([
    { name: "images", maxCount: 4 },
    { name: "video", maxCount: 1 },
  ]),asyncHandler(productsController.updateProduct)); 
export default router;
