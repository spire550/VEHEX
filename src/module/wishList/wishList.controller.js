import Wishlist from './../../../DB/models/user/WishList.model.js';
import Product from './../../../DB/models/user/Product.model.js';
import User from './../../../DB/models/user/User.model.js';

// Add product to wishlist
export const addToWishlist = async (req, res, next) => {
  const { productId } = req.body;

  // Check if the user is logged in
  if (!req.user) {
    return res.status(401).json({ message: 'You must be logged in to add products to your wishlist.' });
  }

  try {
    // Check if the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Find the user's wishlist or create one if it doesn't exist
    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = new Wishlist({
        user: req.user._id,
        products: [],
      });
    }

    // Check if the product is already in the wishlist
    const productExists = wishlist.products.some(
      (item) => item.product.toString() === productId
    );

    if (productExists) {
      return res.status(400).json({ message: 'Product is already in the wishlist.' });
    }

    // Add the product to the wishlist
    wishlist.products.push({ product: productId });
    await wishlist.save();

    res.status(200).json({ message: 'Product added to wishlist successfully', wishlist });
  } catch (error) {
    next(error);
  }
};

// Get user's wishlist
export const getWishlist = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'You must be logged in to view your wishlist.' });
  }

  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products.product');
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found.' });
    }

    res.status(200).json({ wishlist });
  } catch (error) {
    next(error);
  }
};

// Remove product from wishlist
export const removeFromWishlist = async (req, res, next) => {
  const { productId } = req.params;

  // Check if the user is logged in
  if (!req.user) {
    return res.status(401).json({ message: 'You must be logged in to remove products from your wishlist.' });
  }

  try {
    // Find the user's wishlist
    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found.' });
    }

    // Find the product in the wishlist
    const productIndex = wishlist.products.findIndex(
      (item) => item.product.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found in wishlist.' });
    }

    // Remove the product from the wishlist
    wishlist.products.splice(productIndex, 1);
    await wishlist.save();

    res.status(200).json({ message: 'Product removed from wishlist successfully', wishlist });
  } catch (error) {
    next(error);
  }
};

