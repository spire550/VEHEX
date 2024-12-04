import axios from "axios";
import Cart from "../../../DB/models/user/Cart.model.js";
import Order from "../../../DB/models/user/Order.model.js";

export const createOrderFromCart = async (req, res, next) => {
    const userId = req.user._id;
  
    // Find the user's cart
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty." });
    }
  
    const { fullname, phone, shippingAddress, paymentMethod, cardDetails } = req.body;
  
    // Ensure all required fields are provided
    if (!fullname || !phone || !shippingAddress) {
      return res.status(400).json({
        message: "Full name, phone number, and shipping address are required.",
      });
    }
  
    // Ensure paymentMethod is 'creditcard' and cardDetails are provided
    if (paymentMethod !== "creditcard") {
      return res.status(400).json({ message: "Only credit card payments are supported." });
    }
  
    if (!cardDetails || !cardDetails.name || !cardDetails.number || !cardDetails.cvc) {
      return res.status(400).json({
        message: "Incomplete credit card details provided.",
      });
    }
  
    // Validate expiration month/year
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    if (
      !cardDetails.month ||
      !cardDetails.year ||
      cardDetails.month < 1 ||
      cardDetails.month > 12 ||
      cardDetails.year < currentYear ||
      (cardDetails.year == currentYear && cardDetails.month < currentMonth)
    ) {
      return res.status(400).json({ message: "Invalid card expiration date." });
    }
  
    // Calculate total price
    const totalPrice = cart.items.reduce(
      (total, item) => total + item.quantity * item.price,
      0
    );
  
    // Extract items from cart
    const items = cart.items.map((item) => ({
      productId: item.productId._id,
      quantity: item.quantity,
      price: item.price,
    }));
  
    // Create a new order with default shippingStatus ('processing')
    const order = await Order.create({
      userId,
      fullname,
      phone,
      shippingAddress,
      items,
      totalPrice,
      paymentMethod,
      shippingStatus: "processing", // Default value
    });
  
    // Clear the cart
    cart.items = [];
    await cart.save();
  
    // Generate Moyasar payment request for credit card
    const paymentPayload = {
      amount: totalPrice * 100, // Amount in halalas*100
      currency: "SAR",
      source: {
        type: "creditcard",
        name: cardDetails.name,
        number: cardDetails.number,
        cvc: cardDetails.cvc,
        month: cardDetails.month,
        year: cardDetails.year,
      },
      callback_url: `${process.env.BASE_URL}/api/webhook/moyasar`,
      description: `Order payment for ${order._id}`,
    };
  
    try {
      const response = await axios.post(
        "https://api.moyasar.com/v1/payments",
        paymentPayload,
        {
          auth: {
            username: process.env.MOYASAR_API_KEY,
            password: "", // Empty password for Moyasar
          },
        }
      );
  
      const { id: invoiceId, status, source } = response.data;
  
      // Update the order with payment details
      order.invoiceId = invoiceId;
      order.paymentStatus = status;
      await order.save();
  
      // Send success response
      return res.status(200).json({
        message: "Order created and payment initialized.",
        order,
        payment: { status, source },
      });
    } catch (error) {
      console.error(
        `Error creating payment for Order ID: ${order._id}:`,
        error.response?.data || error.message
      );
      return next(new Error("Payment initialization failed."));
    }
  };
  
  

export const moyasarWebhook = async (req, res) => {
  console.log(
    `Webhook received at: ${process.env.BASE_URL}/api/webhook/moyasar`
  );

  const { id, status, invoice_id } = req.body;

  const order = await Order.findOne({ invoiceId: invoice_id });
  if (!order) {
    console.error(`Order not found for invoice ${invoice_id}`);
    return res.status(404).json({ message: "Order not found." });
  }

  order.paymentStatus = status === "paid" ? "paid" : "failed";
  order.status = status === "paid" ? "confirmed" : "canceled";
  await order.save();

  res.status(200).json({ message: "Webhook processed successfully." });
};

export const updateOrder = async (req, res, next) => {
  const { orderId } = req.params; // Order ID to identify the order
  const updates = req.body; // Get updates from request body

  const user = req.user; // Assuming user is added to the request after authentication
  if (!user || user.role !== "admin") {
    return res
      .status(403)
      .json({
        message: "Forbidden: You do not have permission to delete this car.",
      });
  }

  // Find the order by ID
  const order = await Order.findById(orderId);
  if (!order) {
    return next(new Error("Order not found"));
  }

  // List of allowed fields to update
  const allowedUpdates = ["shippingStatus", "paymentStatus"];

  // Make sure the provided updates are valid
  const isValidUpdate = Object.keys(updates).every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidUpdate) {
    return next(new Error("Invalid update field(s)"));
  }

  // Apply the updates to the order
  if (updates.shippingStatus) {
    order.shippingStatus = updates.shippingStatus; // Update shipping status
  }

  if (updates.paymentStatus) {
    order.paymentStatus = updates.paymentStatus; // Update payment status
  }

  // Save the updated order to the database
  const updatedOrder = await order.save();

  // Respond with the updated order
  res.status(200).json({
    message: "Order updated successfully.",
    order: updatedOrder,
  });
};
