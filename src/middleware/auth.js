import jwt from "jsonwebtoken";
import { asyncHandler } from "../module/utils/errorHandler.js";
import userModel from "../../DB/models/user/User.model.js";
import tokenModel from "../../DB/models/token/Token.model.js";
const auth = asyncHandler(async (req, res, next) => {
  const { token } = req.headers;

  if (!token) {
    return next(new Error("token is required"));
  }

  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (!payload.id) {
    return next(new Error("invalid payload"));
  }

  const user = await userModel.findById(payload.id);
  if (!user) {
    return next(new Error("invalid user id"));
  }
  if (user.isDeleted == true) {
    return next(new Error("you deactivated your account,Please Login"));
  }
  const isTokenValid = await tokenModel.findOne({ token, isValid: true });
  if (!isTokenValid) {
    return next(new Error("token invalid"));
  }

  req.user = user;
  next();
});

export default auth;
