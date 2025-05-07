import Cart from "../../../DB/models/user/Cart.model.js";
import Product from "../../../DB/models/user/Product.model.js";

export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body; // Product or package ID, and quantity
    const userId = req.user._id; // User ID from the authenticated user

    // Validate quantity
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid quantity provided." });
    }

    // Find or create the user's cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [], totalPrice: 0 });
    }

    if (productId) {
      // Case: Adding a regular product
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found." });
      }

      // Check if the product is already in the cart
      const itemIndex = cart.items.findIndex(
        (item) => item.productId?.toString() === productId
      );

      if (itemIndex > -1) {
        // Already in cart, update quantity only
        cart.items[itemIndex].quantity += quantity;
      } else {
        // Add new product to the cart
        cart.items.push({
          productId,
          quantity,
          price: product.price, // Save price only when adding for first time
        });
      }
      
      // Always re-calculate totalPrice from fresh product prices
      let total = 0;
      for (let item of cart.items) {
        const prod = await Product.findById(item.productId);
        if (prod) {
          item.price = prod.price; // update to current price
          total += prod.price * item.quantity;
        }
      }
      cart.totalPrice = total;
    }  else {
      return res
        .status(400)
        .json({ message: "Please provide either a productId or packageId." });
    }

    // Recalculate total price based on updated cart items
    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    await cart.save();
    res.status(200).json({ message: "Item(s) added to cart.", cart });
  } catch (error) {
    next(error); // Pass errors to the global error handler
  }
};

export const viewCart = async (req, res, next) => {
  const userId = req.user._id;

  const cart = await Cart.findOne({ userId }).populate(
    "items.productId",
    "name price"
  );

  if (!cart || cart.items.length === 0) {
    return res.status(200).json({ message: "Your cart is empty.", cart: null });
  }

  res.status(200).json({ message: "Cart retrieved successfully.", cart });
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    if (quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than zero." });
    }

    // Find the user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found." });
    }

    if (productId) {
      // Case: Update regular product in cart
      const itemIndex = cart.items.findIndex(
        (item) => item.productId?.toString() === productId
      );

      if (itemIndex === -1) {
        return res.status(404).json({ message: "Product not found in cart." });
      }

      // Update the quantity for the product
      cart.items[itemIndex].quantity = quantity;
    }  else {
      return res.status(400).json({ message: "Please provide either a productId or packageId." });
    }

    // Recalculate total price based on updated cart items
    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    await cart.save();
    res.status(200).json({
      message: "Cart updated successfully.",
      cart,
    });
  } catch (error) {
    next(error); // Pass the error to the global error handler
  }
};


export const removeFromCart = async (req, res, next) => {
  try {
    const { productId  } = req.body;
    const userId = req.user._id;

    // Find the user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found." });
    }

    if (productId) {
      // Case: Remove a regular product from the cart
      const itemIndex = cart.items.findIndex(
        (item) => item.productId?.toString() === productId
      );

      if (itemIndex === -1) {
        return res.status(404).json({ message: "Product not found in cart." });
      }

      // Remove the product from the cart
      cart.items.splice(itemIndex, 1);
    }  else {
      return res
        .status(400)
        .json({ message: "Please provide either a productId or packageId." });
    }

    // Recalculate total price after removal
    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    await cart.save();

    res.status(200).json({
      message: "Item(s) removed from cart successfully.",
      cart,
    });
  } catch (error) {
    next(error); // Pass the error to the global error handler
  }
};

export const getCartWithTotal = async (req, res, next) => {
  const userId = req.user._id;

  // Find the user's cart and populate both productId and packageId if needed
  const cart = await Cart.findOne({ userId })
    .populate("items.productId") // Populate regular products

  if (!cart || cart.items.length === 0) {
    return res.status(404).json({ message: "Your cart is empty." });
  }

  // Calculate total cost
  const total = cart.items.reduce((sum, item) => {
    if (item.productId) {
      return sum + item.quantity * item.productId.price; // For regular products
    }
    
    return sum;
  }, 0);

  res.status(200).json({
    message: "Cart fetched successfully.",
    cart,
    total,
  });
};
