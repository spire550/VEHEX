import { Router } from "express";
import * as userController from "./user.controller.js";
import { asyncHandler } from "../utils/errorHandler.js";
import auth from "../../middleware/auth.js";

const router = Router();

router.post("/register", asyncHandler(userController.registerUser));
router.post("/login", asyncHandler(userController.loginUser));
router.put("/logout", asyncHandler(userController.logout));
router.patch("/forget_code", asyncHandler(userController.sendForgetCode));
router.put("/reset_password", asyncHandler(userController.resetPassword));
router.delete(
  "/deleteUser/:userId",
  auth,
  asyncHandler(userController.deleteUser)
);
router.get("/allUsers", asyncHandler(userController.getAllUsers));
export default router;
