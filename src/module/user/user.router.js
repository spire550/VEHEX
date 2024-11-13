import { Router } from "express";
import * as userController from "./user.controller.js";
import { asyncHandler } from "../utils/errorHandler.js";

const router = Router();

router.post("/register", asyncHandler(userController.registerUser));
router.post("/login", asyncHandler(userController.loginUser));
router.put("/logout", asyncHandler(userController.logout));

export default router;
