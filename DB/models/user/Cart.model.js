import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Each user can only have one cart
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        packageId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Package", // Reference to Package model (optional)
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
      default: 0, // Make sure totalPrice is always initialized to 0
    },
  },
  
  {
    timestamps: true,
  }
);

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
