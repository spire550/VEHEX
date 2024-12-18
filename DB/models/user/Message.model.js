import mongoose, { Schema, Types } from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String },
    description: { type: String },
    
  },
  {
    timestamps: true,
  }
);
const messageModel = mongoose.model("Message", messageSchema);
export default messageModel;
