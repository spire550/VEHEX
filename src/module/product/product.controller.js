import Car from "../../../DB/models/user/Car.model.js";
import Category from "../../../DB/models/user/Category.model.js";
import Package from "../../../DB/models/user/Package.model.js";
import Product from "../../../DB/models/user/Product.model.js";
import cloudinaryConnection from "../utils/cloudinary.js";

export const addProduct = async (req, res, next) => {
  const {
    name,
    description,
    price,
    category,
    carEngine,
    carDetails,
    isForSpecificCar,
  } = req.body;

  // Only admin can add products
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "You are not authorized to add products." });
  }

  // Validate that either carEngine or carDetails is provided if isForSpecificCar is true
  if (isForSpecificCar && !(carEngine || (carDetails && carDetails.model))) {
    return res.status(400).json({
      message:
        "You must specify carEngine or carDetails for specific car products.",
    });
  }

  // Upload image to Cloudinary if an image is provided
  if (!req.files?.length) {
    return next({ cause: 400, message: "Images are required" });
  }

  const carImage = [];

  // Parallel Cloudinary upload using Promise.all
  const uploadPromises = req.files.map((file) => {
    return cloudinaryConnection().uploader.upload(file.path, {
      folder: `products`,
    });
  });
  const uploadedImages = await Promise.all(uploadPromises);

  uploadedImages.forEach(({ secure_url, public_id }) => {
    carImage.push({ secure_url, public_id });
  });

  // Check if the category exists
  const existingCategory = await Category.findById(category);
  if (!existingCategory) {
    return res.status(400).json({ message: "Category not found." });
  }

  // Create new product
  const newProduct = await Product.create({
    name,
    description,
    price,
    category,
    carEngine: isForSpecificCar ? carEngine : null,
    carDetails: isForSpecificCar ? carDetails : null,
    isForSpecificCar,
    image: carImage, // Store the image URL in the database
  });

  res
    .status(201)
    .json({ message: "Product added successfully", product: newProduct });
};

export const getProducts = async (req, res) => {
  const { carEngine, model, warranty, year, brand, keywords } = req.query;

  let filter = {};

  // Filter by car engine number
  if (carEngine) {
    filter.carEngine = carEngine;
  }

  // Filter by car model
  if (model) {
    filter["carDetails.model"] = model;
  }

  // Filter by warranty status (true or false)
  if (warranty !== undefined) {
    filter["carDetails.warranty"] = warranty === "true";
  }

  // Filter by car year
  if (year) {
    filter["carDetails.year"] = year;
  }

  // Filter by car brand
  if (brand) {
    filter["carDetails.agency"] = brand;
  }

  // Filter by keywords (search across multiple fields like model or description)
  if (keywords) {
    filter["$text"] = { $search: keywords }; // Assuming you have a text index on relevant fields
  }

  // Fetch products based on the filter
  const products = await Product.find(filter);

  // Fetch packages if warranty is true
  let packages = [];
  if (warranty === "true") {
    packages = await Package.find().populate("products"); // Assuming "warranty" field exists in Package
  }

  // Return both products and packages
  return res.status(200).json({ products, packages });
};

// لو عايز المنتجات ب or يعني مش لازم كل حاجة تتحقق
/* export const getProductsForUser = async (req, res) => {
    const userId = req.user._id; // Get the logged-in user's ID from the token
  
    // Fetch the user's cars
    const userCars = await Car.find({ userId });
  
    // If the user has no cars, return an empty array
    if (!userCars || userCars.length === 0) {
      return res.status(404).json({ message: "No cars found for this user." });
    }
  
    // Build filter based on the user's cars
    const filters = [];
    userCars.forEach((car) => {
      if (car.engineNumber) {
        filters.push({ carEngine: car.engineNumber }); // Filter products by engine number
      }
      if (car.carDetails?.model) {
        filters.push({
          "carDetails.model": car.carDetails.model, // Filter products by car model
        });
      }
      if (car.carDetails?.warranty !== undefined) {
        filters.push({
          "carDetails.warranty": car.carDetails.warranty, // Filter products by warranty status
        });
      }
    });
  
    // Fetch products related to the user's cars
    const products = await Product.find({
      $or: filters, // Use $or to match any of the filters
    });
  
    if (products.length === 0) {
      return res.status(404).json({ message: "No products found for your cars." });
    }
  
    // Return the filtered products
    res.status(200).json({ products });
  }; */

export const getProductsForUser = async (req, res) => {
  const userId = req.user._id; // Get the logged-in user's ID from the token

  // Fetch the user's cars
  const userCars = await Car.find({ userId });

  // If the user has no cars, return an empty array
  if (!userCars || userCars.length === 0) {
    return res.status(404).json({ message: "No cars found for this user." });
  }

  // Create filters for both engine number and car details
  const filters = [];

  // Loop through each user's cars to apply the correct filter
  userCars.forEach((car) => {
    if (car.engineNumber) {
      // If car has an engine number, filter by engine number
      filters.push({ carEngine: car.engineNumber }); // Exact match for carEngine
    }

    if (
      car.carDetails?.model &&
      car.carDetails?.year &&
      car.carDetails?.agency
    ) {
      // If car has model, year, agency, and warranty, filter by these exact details
      filters.push({
        "carDetails.model": car.carDetails.model,
        "carDetails.year": car.carDetails.year,
        "carDetails.agency": car.carDetails.agency,
        "carDetails.warranty": car.carDetails.warranty,
      });
    }
  });

  // If no filters are present, return no products found
  if (filters.length === 0) {
    return res
      .status(404)
      .json({ message: "No products found for your cars." });
  }

  // Fetch products that match all the car details or engine number exactly
  const products = await Product.find({
    $or: filters, // Match any of the car filters (exact matching)
  });

  // If no products found, return an error
  if (products.length === 0) {
    return res
      .status(404)
      .json({ message: "No products found for your cars." });
  }

  // Return the filtered products
  res.status(200).json({ products });
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

export const deleteProduct = async (req, res, next) => {
  const { productId } = req.params;

  // Ensure user is an admin
  if (!req.user || req.user.role !== "admin") {
    return next(new Error("You are not authorized to delete products."));
  }

  // Find and delete the product
  const deletedProduct = await Product.findByIdAndDelete(productId);

  // If product is not found
  if (!deletedProduct) {
    return next(new Error("Product not found."));
  }

  res.status(200).json({
    message: "Product deleted successfully",
    product: deletedProduct,
  });
};

/*   export const getProductsForSelectedCar = async (req, res, next) => {
    const userId = req.user._id;
    const { carId } = req.params;
  
    try {
      // Find the car the user selected
      const car = await Car.findOne({ _id: carId, userId });
      if (!car) {
        return next(new Error("Car not found or does not belong to the user"));
      }
  
      console.log("Car found:", car); // Debugging car details
  
      // Initialize query
      let query = {};
  
      // Check if the car was registered with car details
      if (car.carDetails && car.carDetails.model && car.carDetails.year && car.carDetails.agency && car.carDetails.warranty) {
        // Filter by model, year, agency, and warranty if carDetails are present
        query = {
          carDetails: {
            model: car.carDetails.model,
            year: car.carDetails.year,
            agency: car.carDetails.agency,
            warranty: car.carDetails.warranty
          },
          isForSpecificCar: true, // Only include products specific to this car
        };
      } else if (car.engineNumber) {
        // Filter by engine number if the car was registered with engine number
        query = {
          carEngine: car.engineNumber, // Match carEngine with engineNumber
          isForSpecificCar: true, // Only include products specific to this car
        };
      } else {
        // If the car has neither engine number nor detailed info, return no products
        return res.status(400).json({ message: "Car registration is incomplete. Please provide engine number or car details." });
      }
  
      console.log("Product Query:", query); // Debugging the query
  
      // Fetch products related to the selected car
      const products = await Product.find(query);
  
      if (!products || products.length === 0) {
        return res.status(404).json({ message: "No products found for this car." });
      }
  
      res.status(200).json({
        message: "Products fetched successfully.",
        products,
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      return next(error);
    }
}; */

/////// shwo also while false
export const getProductsForSelectedCar = async (req, res, next) => {
  const userId = req.user._id;
  const { carId } = req.params;

  // Find the car the user selected
  const car = await Car.findOne({ _id: carId, userId }).populate(
    "carDetails.model"
  );
  if (!car) {
    return next(new Error("Car not found or does not belong to the user"));
  }

  // Build the product query based on the car details
  let query = {};

  // If the car has detailed info (model, year, agency)
  if (car.carDetails && car.carDetails.model) {
    query["carDetails.model"] = car.carDetails.model;
    query["carDetails.year"] = car.carDetails.year;
    query["carDetails.agency"] = car.carDetails.agency;
  }

  // If the car was registered using the engine number, filter by engine number
  else if (car.engineNumber) {
    // Strictly match carEngine (ensuring that it exists and is not null or undefined)
    query["carEngine"] = { $eq: car.engineNumber };
  }

  // Fetch products related to the selected car
  const products = await Product.find(query);

  if (!products || products.length === 0) {
    return res.status(404).json({ message: "No products found for this car." });
  }

  res.status(200).json({
    message: "Products fetched successfully.",
    products,
  });
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