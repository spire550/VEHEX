import mongoose from "mongoose";

const carSchema = new mongoose.Schema(
  {
    engineNumber: {
      type: String,
      default: null, // Allows null values
    },
    carDetails: {
      model: { type: String },
      year: { type: Number },
      agency: { type: String },
      warranty: { type: Boolean },
    },
    mileage: { type: Number, required: true }, // New mileage field
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    logo: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique engineNumber only when provided and per user
carSchema.index({ engineNumber: 1, userId: 1 }, { unique: true });

const Car = mongoose.model("Car", carSchema);

export default Car;
