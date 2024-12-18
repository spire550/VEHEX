import mongoose, { Schema, Types } from "mongoose";
import { systemRoles } from "../../../src/module/utils/system-roles.js";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    forgetCode: {
      type: String,
    },
    role: {
        type: String,
        enum: [systemRoles.USER, systemRoles.ADMIN, systemRoles.SUPER_ADMIN],
        default: systemRoles.USER,
      },
  },

  {
    timestamps: true,
  }
);

var User = mongoose.model("User", userSchema);

export default User;
