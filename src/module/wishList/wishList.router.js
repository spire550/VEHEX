import express from "express";
import * as wishlistController from "./wishList.controller.js";
import { asyncHandler } from "./../utils/errorHandler.js";
import auth from "../../middleware/auth.js";

const router = express.Router();

// Add product to wishlist
router.post("/wishlist",auth, asyncHandler(wishlistController.addToWishlist));

// Get user's wishlist
router.get("/wishlist",auth, asyncHandler(wishlistController.getWishlist));

// Remove product from wishlist
router.delete(
  "/wishlist/:productId",auth,
  asyncHandler(wishlistController.removeFromWishlist)
);

export default router;
