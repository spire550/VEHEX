import Cart from "../../../DB/models/user/Cart.model.js";
import Package from "../../../DB/models/user/Package.model.js";
import Product from "../../../DB/models/user/Product.model.js";

export const addToCart = async (req, res, next) => {
    const { productId, packageId, quantity } = req.body;  // Product or package ID, and quantity
    const userId = req.user._id;  // User ID from the authenticated user
  
    // Find or create the user's cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }
  
    if (productId) {
      // Case: Adding a regular product
      const product = await Product.findById(productId);
      if (!product) {
        return next(new Error("Product not found."));
      }
  
      // Check if the product is already in the cart
      const itemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId
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
      const packageToAdd = await Package.findById(packageId).populate("products");
      if (!packageToAdd) {
        return next(new Error("Package not found."));
      }
  
      // Loop through all products in the package and add them to the cart
      for (let product of packageToAdd.products) {
        const itemIndex = cart.items.findIndex(
          (item) => item.productId.toString() === product._id.toString()
        );
  
        if (itemIndex > -1) {
          // If the product is already in the cart, update the quantity
          cart.items[itemIndex].quantity += quantity;
        } else {
          // Add new product to the cart
          cart.items.push({
            productId: product._id,
            quantity,
            price: product.price,
          });
        }
      }
    } else {
      return next(new Error("Please provide either a productId or packageId."));
    }
  
    // Recalculate total price based on updated cart items
    cart.totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
  
    await cart.save();
    res.status(200).json({ message: "Item(s) added to cart.", cart });
  };
  


export const viewCart = async (req, res, next) => {
    const userId = req.user._id;
  
    const cart = await Cart.findOne({ userId }).populate("items.productId", "name price");
    
    if (!cart || cart.items.length === 0) {
      return res.status(200).json({ message: "Your cart is empty.", cart: null });
    }
  
    res.status(200).json({ message: "Cart retrieved successfully.", cart });
  };

  export const updateCartItem = async (req, res, next) => {
    const { productId, packageId, quantity } = req.body;
    const userId = req.user._id;
  
    if (quantity <= 0) {
      return next(new Error("Quantity must be greater than zero."));
    }
  
    // Find the user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return next(new Error("Cart not found."));
    }
  
    if (productId) {
      // Case: Update regular product in cart
      const itemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId
      );
  
      if (itemIndex === -1) {
        return next(new Error("Product not found in cart."));
      }
  
      // Update the quantity for the product
      cart.items[itemIndex].quantity = quantity;
    } else if (packageId) {
      // Case: Update products in a package
      const packageToUpdate = await Package.findById(packageId).populate("products");
      if (!packageToUpdate) {
        return next(new Error("Package not found."));
      }
  
      // Loop through all products in the package and update their quantities
      for (let product of packageToUpdate.products) {
        const itemIndex = cart.items.findIndex(
          (item) => item.productId.toString() === product._id.toString()
        );
  
        if (itemIndex === -1) {
          return next(new Error(`Product ${product.name} not found in cart.`));
        }
  
        // Update the quantity for the product in the package
        cart.items[itemIndex].quantity = quantity;
      }
    } else {
      return next(new Error("Please provide either a productId or packageId."));
    }
  
    // Recalculate total price based on updated cart items
    cart.totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
  
    await cart.save();
    res.status(200).json({
      message: "Cart updated successfully.",
      cart,
    });
  };
  
  
  export const removeFromCart = async (req, res, next) => {
  const { productId, packageId } = req.body;
  const userId = req.user._id;

  // Find the user's cart
  const cart = await Cart.findOne({ userId });
  if (!cart) {
    return next(new Error("Cart not found."));
  }

  // If removing a regular product
  if (productId) {
    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return next(new Error("Product not found in cart."));
    }

    // Remove the product from the cart
    cart.items.splice(itemIndex, 1);
  }
  
  // If removing a package, remove each product within the package
  if (packageId) {
    const packageToRemove = await Package.findById(packageId).populate("products");
    if (!packageToRemove) {
      return next(new Error("Package not found."));
    }

    // Loop through all products in the package and remove them from the cart
    for (let product of packageToRemove.products) {
      const itemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === product._id.toString()
      );

      if (itemIndex === -1) {
        return next(new Error(`Product ${product.name} not found in cart.`));
      }

      // Remove the product from the cart
      cart.items.splice(itemIndex, 1);
    }
  }

  // Recalculate total price after removal
  cart.totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

  await cart.save();

  res.status(200).json({
    message: "Item(s) removed from cart successfully.",
    cart,
  });
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
  