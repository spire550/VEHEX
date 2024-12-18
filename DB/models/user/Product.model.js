import mongoose from "mongoose";

// Define product schema
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0, // Set default stock to 0
    },
    // Add a field to store engine number or car details link
    carEngine: {
      type: String,
      required: false, // Optional: For linking product to car engine number
    },
    carDetails: {
      model: { type: String, required: false },
      year: { type: Number, required: false },
      warranty: { type: Boolean, required: false },
      agency: { type: String, required: false },

    },
    // Whether the product is available for a specific car or not
    isForSpecificCar: {
      type: Boolean,
      required: true,
      default: false, // If false, the product is generic for all cars
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category", // Reference to the Category model
    },
    image: [{ secure_url: String, public_id: String }],
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);
productSchema.index({ model: "text", description: "text" });

// Create and export the Product model
const Product = mongoose.model("Product", productSchema);
export default Product;
