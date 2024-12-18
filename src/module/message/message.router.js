import { Router } from "express";
import * as messageController from "./message.controller.js";
import { asyncHandler } from "../utils/errorHandler.js";
import auth from "../../middleware/auth.js";
const router = Router();

router.post(
  "/addMessage",
  asyncHandler(messageController.addMessage)
);
router.delete(
  "/deleteMessage/:id",auth,
  asyncHandler(messageController.deleteMessage)
);

router.get("/", asyncHandler(messageController.getAllMessages));

export default router;
