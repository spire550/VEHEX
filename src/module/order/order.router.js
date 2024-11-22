import express from "express";
import * as orderController from "./order.controller.js";
import auth from "../../middleware/auth.js";
import { asyncHandler } from "../utils/errorHandler.js";

const router = express.Router();

router.post(
  "/addOrder",
  auth,
  asyncHandler(orderController.createOrderFromCart)
);
router.post(
  "/api/webhook/moyasar",
  asyncHandler(orderController.moyasarWebhook)
);

export default router;
