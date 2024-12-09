import Cart from "../../../DB/models/user/Cart.model.js";
import Package from "../../../DB/models/user/Package.model.js";
import Product from "../../../DB/models/user/Product.model.js";

export const addToCart = async (req, res, next) => {
  try {
    const { productId, packageId, quantity } = req.body; // Product or package ID, and quantity
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
        // If the product is already in the cart, update the quantity
        cart.items[itemIndex].quantity += quantity;
      } else {
        // Add new product to the cart
        cart.items.push({
          productId,
          quantity,
          price: product.price,
        });
      }
    } else if (packageId) {
      // Case: Adding a package
      const packageToAdd = await Package.findById(packageId);
      if (!packageToAdd) {
        return res.status(404).json({ message: "Package not found." });
      }

      // Check if the package is already in the cart
      const itemIndex = cart.items.findIndex(
        (item) => item.packageId?.toString() === packageId
      );

      if (itemIndex > -1) {
        // If the package is already in the cart, update the quantity
        cart.items[itemIndex].quantity += quantity;
      } else {
        // Add new package to the cart
        cart.items.push({
          packageId,
          quantity,
          price: packageToAdd.price,
          name: packageToAdd.name, // Optional: Add the package name for better clarity
        });
      }
    } else {
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
    const { productId, packageId, quantity } = req.body;
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
    } else if (packageId) {
      // Case: Update package in cart
      const itemIndex = cart.items.findIndex(
        (item) => item.packageId?.toString() === packageId
      );

      if (itemIndex === -1) {
        return res.status(404).json({ message: "Package not found in cart." });
      }

      // Update the quantity for the package
      cart.items[itemIndex].quantity = quantity;
    } else {
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
    const { productId, packageId } = req.body;
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
    } else if (packageId) {
      // Case: Remove a package from the cart
      const itemIndex = cart.items.findIndex(
        (item) => item.packageId?.toString() === packageId
      );

      if (itemIndex !== -1) {
        // Remove the package from the cart
        cart.items.splice(itemIndex, 1);
      } else {
        // Handle package added as individual products
        const packageToRemove = await Package.findById(packageId).populate(
          "products"
        );

        if (!packageToRemove) {
          return res.status(404).json({ message: "Package not found." });
        }

        // Loop through all products in the package and remove them from the cart
        for (let product of packageToRemove.products) {
          const productIndex = cart.items.findIndex(
            (item) => item.productId?.toString() === product._id.toString()
          );

          if (productIndex !== -1) {
            cart.items.splice(productIndex, 1);
          }
        }
      }
    } else {
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
    .populate("items.packageId"); // Populate package data if needed

  if (!cart || cart.items.length === 0) {
    return res.status(404).json({ message: "Your cart is empty." });
  }

  // Calculate total cost
  const total = cart.items.reduce((sum, item) => {
    if (item.productId) {
      return sum + item.quantity * item.productId.price; // For regular products
    }
    if (item.packageId) {
      // Handle total calculation for packages (if applicable)
      return sum + item.quantity * item.packageId.price; // Assuming you have a price for packages
    }
    return sum;
  }, 0);

  res.status(200).json({
    message: "Cart fetched successfully.",
    cart,
    total,
  });
};
