import express from "express";
import * as cartController from "./cart.controller.js";
import auth from "../../middleware/auth.js";
import { asyncHandler } from "../utils/errorHandler.js";
const router = express.Router();

router.post("/addToCart", auth, asyncHandler(cartController.addToCart)); // Add to cart
router.get("/viewCart", auth, asyncHandler(cartController.viewCart)); // View cart
router.put("/updateCart", auth, asyncHandler(cartController.updateCartItem)); // Update cart item
router.delete("/removeCart", auth, asyncHandler(cartController.removeFromCart)); // Remove from cart
router.get(
  "/getCartWithTotalPrice",
  auth,
  asyncHandler(cartController.getCartWithTotal)
); // View cart

export default router;
