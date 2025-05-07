import axios from "axios";
import Cart from "../../../DB/models/user/Cart.model.js";
import Order from "../../../DB/models/user/Order.model.js";


export const createOrderFromCart = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find the user's cart
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty." });
    }

    const { fullname, phone, shippingAddress } = req.body;

    // Validate required fields
    if (!fullname || !phone || !shippingAddress) {
      return res.status(400).json({
        message: "Full name, phone number, and shipping address are required.",
      });
    }

    // Prepare items (products only)
    const items = cart.items.map((item) => ({
      productId: item.productId._id,
      name: item.productId.name,
      quantity: item.quantity,
      price: item.price,
    }));

    // Calculate total price
    const totalPrice = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Create the order
    const order = await Order.create({
      userId,
      fullname,
      phone,
      shippingAddress,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      totalPrice,
      paymentStatus: "pending", // Payment removed
      shippingStatus: "processing",
    });

    // Clear the cart
    cart.items = [];
    await cart.save();

    res.status(200).json({
      message: "Order created successfully.",
      order: {
        ...order.toObject(),
        items,
      },
    });
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
    const orders = await Order.find(filters).populate("items.productId");

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
    }).populate("items.productId");

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


export const getSalesStats = async (req, res, next) => {
  try {
    const stats = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid", // Only consider paid orders
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
          totalOrders: { $sum: 1 },
          totalItems: { $sum: { $sum: "$items.quantity" } },
        },
      },
      {
        $project: {
          _id: 0,
          averageSaleValue: {
            $cond: [
              { $eq: ["$totalOrders", 0] },
              0,
              { $divide: ["$totalRevenue", "$totalOrders"] },
            ],
          },
          averageItemsPerSale: {
            $cond: [
              { $eq: ["$totalOrders", 0] },
              0,
              { $divide: ["$totalItems", "$totalOrders"] },
            ],
          },
        },
      },
    ]);

    res.json(stats[0] || { averageSaleValue: 0, averageItemsPerSale: 0 });
  } catch (error) {
    next(error);
  }
};
