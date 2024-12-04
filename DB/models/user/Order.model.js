import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true,
    },
    fullname: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    shippingAddress: {
      type: String,
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product", // Reference to the Product model
        },
        quantity: {
          type: Number,
          required: true,
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
    },
    paymentMethod: {
      type: String,
      enum: ["creditcard"], // Only allow "creditcard" as the payment method
      required: true,
    },
    invoiceId: String,
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "initiated"],
      default: "pending",
    },
    shippingStatus: {
      type: String,
      enum: ["on the way", "delivered", "canceled", "pending", "processing"],
      default: "processing", // Default to 'processing'
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
