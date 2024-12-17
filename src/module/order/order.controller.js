import axios from "axios";
import Cart from "../../../DB/models/user/Cart.model.js";
import Order from "../../../DB/models/user/Order.model.js";


export const createOrderFromCart = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find the user's cart and populate products and packages
    const cart = await Cart.findOne({ userId })
      .populate("items.productId")
      .populate("items.packageId");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty." });
    }

    const { fullname, phone, shippingAddress, paymentMethod, cardDetails } = req.body;

    // Validate required fields
    if (!fullname || !phone || !shippingAddress) {
      return res.status(400).json({
        message: "Full name, phone number, and shipping address are required.",
      });
    }

    if (paymentMethod !== "creditcard") {
      return res.status(400).json({ message: "Only credit card payments are supported." });
    }

    if (!cardDetails || !cardDetails.name || !cardDetails.number || !cardDetails.cvc) {
      return res.status(400).json({
        message: "Incomplete credit card details provided.",
      });
    }

    // Validate credit card expiration date
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

    // Prepare items for the order
    const items = cart.items.map((item) => {
      if (item.productId) {
        return {
          type: "product",
          id: item.productId._id,
          name: item.productId.name,
          quantity: item.quantity,
          price: item.price,
        };
      } else if (item.packageId) {
        return {
          type: "package",
          id: item.packageId._id,
          name: item.packageId.name,
          quantity: item.quantity,
          price: item.price,
        };
      }
    });

    // Calculate total price
    const totalPrice = cart.items.reduce((total, item) => total + item.quantity * item.price, 0);

    // Create the order
    const order = await Order.create({
      userId,
      fullname,
      phone,
      shippingAddress,
      items: items.map((item) => ({
        productId: item.type === "product" ? item.id : null,
        packageId: item.type === "package" ? item.id : null,
        quantity: item.quantity,
        price: item.price,
      })),
      totalPrice,
      paymentMethod,
      paymentStatus: "initiated",
      shippingStatus: "processing",
    });

    // Clear the cart
    cart.items = [];
    await cart.save();

    // Initialize payment with Moyasar
    const paymentPayload = {
      amount: totalPrice * 100, // Amount in halalas
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
            password: "",
          },
        }
      );

      const { id: invoiceId, status, source } = response.data;

      // Update the order with payment details
      order.invoiceId = invoiceId;
      order.paymentStatus = status === "succeeded" ? "paid" : status;
      await order.save();

      if (status === "succeeded") {
        return res.status(200).json({
          message: "Order created and payment succeeded.",
          order: {
            ...order.toObject(),
            items,
          },
          payment: { status, source },
        });
      } else if (status === "failed") {
        return res.status(400).json({
          message: "Payment failed.",
          order: {
            ...order.toObject(),
            items,
          },
          payment: { status, source },
        });
      } else {
        return res.status(200).json({
          message: "Order created. Payment is pending.",
          order: {
            ...order.toObject(),
            items,
          },
          payment: { status, source },
        });
      }
    } catch (paymentError) {
      console.error(
        `Error creating payment for Order ID: ${order._id}:`,
        paymentError.response?.data || paymentError.message
      );

      // Mark the order as failed in case of a payment error
      order.paymentStatus = "failed";
      await order.save();

      return res.status(500).json({
        message: "Payment initialization failed. Order created but payment failed.",
        order: {
          ...order.toObject(),
          items,
        },
      });
    }
  } catch (error) {
    next(error);
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

/* export const updateOrder = async (req, res, next) => {
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
 */



export const getAllOrders = async (req, res, next) => {
  try {
    const filters = req.query; // Allow filtering based on query parameters, e.g., userId, paymentStatus, etc.
    const orders = await Order.find(filters).populate("items.productId").populate("items.packageId");

    if (orders.length === 0) {
      return res.status(404).json({ message: "No orders found." });
    }

    return res.status(200).json({
      message: "Orders retrieved successfully.",
      orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an order by ID
 */
export const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user; // Assuming user is added to the request after authentication
  if (!user || user.role !== "admin") {
    return res
      .status(403)
      .json({
        message: "Forbidden: You do not have permission to delete this car.",
      });
  }

    const deletedOrder = await Order.findByIdAndDelete(id);
    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found." });
    }

    return res.status(200).json({
      message: "Order deleted successfully.",
      order: deletedOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an order by ID
 */
export const updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const user = req.user; // Assuming user is added to the request after authentication
    if (!user || user.role !== "admin") {
      return res
        .status(403)
        .json({
          message: "Forbidden: You do not have permission to delete this car.",
        });
    }
    // Ensure only valid fields can be updated
    const allowedFields = ["paymentStatus", "shippingStatus"];
    const updateKeys = Object.keys(updates);

    for (const key of updateKeys) {
      if (!allowedFields.includes(key)) {
        return res.status(400).json({
          message: `Invalid field: ${key}. Allowed fields: ${allowedFields.join(", ")}`,
        });
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, updates, {
      new: true, // Return the updated document
      runValidators: true, // Ensure validation rules are applied
    }).populate("items.productId").populate("items.packageId");

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found." });
    }

    return res.status(200).json({
      message: "Order updated successfully.",
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};