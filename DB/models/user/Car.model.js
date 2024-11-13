import mongoose from "mongoose";

const carSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  engineNumber: {
    type: String,
  },
  carDetails: {
    model: { type: String },
    year: { type: Number },
    agency: { type: String },
    warranty: { type: Boolean, default: false }, // Whether the car is under warranty
  },
  createdAt: { type: Date, default: Date.now },
});

const Car = mongoose.model("Car", carSchema);

export default Car;
