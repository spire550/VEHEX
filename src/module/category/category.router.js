import express from "express";
import * as categoryController from "./category.controller.js";
import auth from "../../middleware/auth.js";
import { asyncHandler } from "../utils/errorHandler.js";

const router = express.Router();

// Admin routes for category management
router.post(
  "/createCategory",
  auth,
  asyncHandler(categoryController.createCategory)
);
router.get("/", asyncHandler(categoryController.getAllCategories));
router.put(
  "/updateCategory/:id",
  auth,
  asyncHandler(categoryController.updateCategory)
);
router.delete(
  "/deleteCategory/:categoryId",
  auth,
  asyncHandler(categoryController.deleteCategory)
);
router.get("/cat/:catId", asyncHandler(categoryController.getCatById));

export default router;
