import mongoose from "mongoose";

const packageSchema = new mongoose.Schema({
    name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true, // Optional if you want to calculate price dynamically
  },
  mileage: {
    type: Number,
    required: true,
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  description: {
    type: String,
  },
}, { timestamps: true });


const Package = mongoose.model("Package", packageSchema);

export default Package;