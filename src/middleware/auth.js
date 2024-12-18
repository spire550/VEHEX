import jwt from "jsonwebtoken";
import { asyncHandler } from "../module/utils/errorHandler.js";
import User from "../../DB/models/user/User.model.js";
import tokenModel from "../../DB/models/token/Token.model.js";
const auth = asyncHandler(async (req, res, next) => {
  const { token } = req.headers;

  if (!token) {
    return next(new Error("Token is required"));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload.id) {
      return next(new Error("Invalid payload"));
    }

    const user = await User.findById(payload.id);
    if (!user) {
      return next(new Error("Invalid user ID"));
    }

    if (user.isDeleted === true) {
      return next(
        new Error("You deactivated your account. Please log in again.")
      );
    }

    const isTokenValid = await tokenModel.findOne({ token, isValid: true });
    if (!isTokenValid) {
      return next(new Error("Token is invalid"));
    }

    req.user = user; // Attach user to request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    return next(new Error("Invalid or expired token"));
  }
});

export default auth;
