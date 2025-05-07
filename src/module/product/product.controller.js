import Category from "../../../DB/models/user/Category.model.js";
import Product from "../../../DB/models/user/Product.model.js";
import cloudinaryConnection from "../utils/cloudinary.js";

export const addProduct = async (req, res, next) => {
  try {
    const {
      sku,
      name,
      description,
      price,
      category,
      size,
      discount,
      color,
      status,
    } = req.body;

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!req.files || !req.files.images?.length) {
      return next({ cause: 400, message: "At least one image is required" });
    }

    const imageUploads = await Promise.all(
      req.files.images.map((file) =>
        cloudinaryConnection().uploader.upload(file.path, {
          folder: "products/images",
        })
      )
    );

    const imageData = imageUploads.map(({ secure_url, public_id }) => ({
      secure_url,
      public_id,
    }));

    let videoData = null;

    if (req.files.video && req.files.video[0]) {
      const uploadedVideo = await cloudinaryConnection().uploader.upload(
        req.files.video[0].path,
        {
          folder: "products/videos",
          resource_type: "video",
        }
      );

      videoData = {
        secure_url: uploadedVideo.secure_url,
        public_id: uploadedVideo.public_id,
      };
    }

    const newProduct = await Product.create({
      sku,
      name,
      description,
      price,
      category,
      size,
      discount,
      color,
      status,
      images: imageData,
      video: videoData,
    });

    res.status(201).json({ message: "Product created", product: newProduct });
  } catch (error) {
    next(error);
  }
};

  


// Get all products in a specific category
export const getProductsByCategory = async (req, res) => {
  const { categoryId } = req.params;

  const products = await Product.find({ category: categoryId });

  if (products.length === 0) {
    return res
      .status(404)
      .json({ message: "No products found in this category." });
  }

  res.status(200).json({ products });
};

export const getAllProducts = async (req, res, next) => {
  // Fetch all products from the database
  const products = await Product.find().populate("category");

  // If no products are found, throw an error
  if (!products || products.length === 0) {
    return next({ cause: 404, message: "No products found." });
  }

  // Return the list of products
  res.status(200).json({
    message: "Products fetched successfully.",
    products,
  });
};

export const getProductById = async (req, res) => {
    const { productId } = req.params;
  
    // Find the car by ID
    const product = await Product.findById(productId);
  
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
  
    res.status(200).json({ product });
  };



  export const updateProduct = async (req, res, next) => {
    const { productId } = req.params;  // Assuming the product ID is in the URL
    const {
      sku,
      name,
      description,
      size,
      discount,
      color,
      category,
      price,
      status,
    } = req.body;
  
    // Only admin can update products
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to update products.' });
    }
  
    try {
      const product = await Product.findById(productId);
  
      if (!product) {
        return res.status(404).json({ message: 'Product not found.' });
      }
  
      // Upload new image if provided
      let productImages = product.images;  // Retain the existing images
      if (req.files?.length) {
        // Upload the new image to Cloudinary
        const uploadPromises = req.files.map((file) => {
          return cloudinaryConnection().uploader.upload(file.path, {
            folder: 'products',
          });
        });
        const uploadedImages = await Promise.all(uploadPromises);
  
        productImages = uploadedImages.map(({ secure_url, public_id }) => ({
          secure_url,
          public_id,
        }));
      }
  
      // Check if the category exists
      const existingCategory = await Category.findById(category);
      if (!existingCategory) {
        return res.status(400).json({ message: 'Category not found.' });
      }
  
      // Update the product in the database
      product.sku = sku || product.sku;
      product.name = name || product.name;
      product.description = description || product.description;
      product.size = size || product.size;
      product.discount = discount || product.discount;
      product.color = color || product.color;
      product.category = category || product.category;
      product.price = price || product.price;
      product.status = status || product.status;
      product.images = productImages;  // Update the images field
  
      const updatedProduct = await product.save();
  
      res.status(200).json({
        message: 'Product updated successfully',
        product: updatedProduct,
      });
    } catch (error) {
      next(error);
    }
  };

  export const deleteProduct = async (req, res, next) => {
    const { productId } = req.params; // Get product ID from URL params
  
    // Only admin can delete products
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to delete products.' });
    }
  
    try {
      // Check if the product exists
      const existingProduct = await Product.findById(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: 'Product not found.' });
      }
  
      // Delete images from Cloudinary if they exist
      if (existingProduct.images?.length) {
        const deletePromises = existingProduct.images.map((image) =>
          cloudinaryConnection().uploader.destroy(image.public_id)
        );
  
        // Wait for all image deletions to finish
        await Promise.all(deletePromises);
      }
  
      // Delete the product from the database
      await Product.findByIdAndDelete(productId); // Use findByIdAndDelete instead of remove
  
      res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  };