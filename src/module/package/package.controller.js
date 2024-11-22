import Package from "../../../DB/models/user/Package.model.js";
import Car from "../../../DB/models/user/Car.model.js";
import Product from "../../../DB/models/user/Product.model.js";

export const createPackage = async (req, res, next) => {
  const { name, description, productIds, price, mileage } = req.body;

  // Ensure the user is an admin
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "You are not authorized to create packages." });
  }

  // Validate required fields
  if (
    !name ||
    !productIds ||
    !Array.isArray(productIds) ||
    productIds.length === 0 ||
    !price ||
    !mileage
  ) {
    return res
      .status(400)
      .json({
        message:
          "Invalid data. Name, productIds, price, and mileage are required.",
      });
  }

  // Check if the provided products exist
  const products = await Product.find({ _id: { $in: productIds } });
  if (products.length !== productIds.length) {
    return res.status(400).json({ message: "Some products were not found." });
  }

  // Create the package
  const newPackage = await Package.create({
    name,
    description,
    products: productIds,
    price, // Save the provided price
    mileage,
  });

  res.status(201).json({
    message: "Package created successfully.",
    package: newPackage,
  });
};

export const getPackages = async (req, res) => {
  const packages = await Package.find().populate("products");

  if (!packages || packages.length === 0) {
    return res.status(404).json({ message: "No packages found." });
  }

  res.status(200).json({ packages });
};

export const updatePackage = async (req, res) => {
  const { packageId } = req.params;
  const { name, price, products, description, mileage } = req.body;
  // Ensure the user is an admin
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "You are not authorized to create packages." });
  }

  const packageToUpdate = await Package.findById(packageId);
  if (!packageToUpdate) {
    return res.status(404).json({ message: "Package not found." });
  }

  // Update fields if provided
  if (name) {
    packageToUpdate.name = name; // Update package name
  }
  if (price) {
    packageToUpdate.price = price; // Update package price
  }
  if (products && Array.isArray(products)) {
    packageToUpdate.products = products; // Update associated products
  }
  if (description) {
    packageToUpdate.description = description; // Update description
  }
  if (mileage) {
    packageToUpdate.mileage = mileage; // Update mileage
  }

  await packageToUpdate.save();

  res.status(200).json({
    message: "Package updated successfully.",
    package: packageToUpdate,
  });
};

export const deletePackage = async (req, res) => {
  const { packageId } = req.params;

  // Ensure the user is an admin
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "You are not authorized to create packages." });
  }
  const deletedPackage = await Package.findByIdAndDelete(packageId);
  if (!deletedPackage) {
    return res.status(404).json({ message: "Package not found." });
  }

  res.status(200).json({
    message: "Package deleted successfully.",
    package: deletedPackage,
  });
};

export const getPackageForCar = async (req, res) => {
  const { carId } = req.params; // Car ID from the request parameters

  // Fetch the car and check warranty status
  const car = await Car.findById(carId);
  if (!car) {
    return res.status(404).json({ message: "Car not found." });
  }

  // Ensure the car is under warranty
  if (!car.carDetails?.warranty) {
    return res.status(403).json({ message: "This car is not under warranty." });
  }

  // Retrieve the mileage from the car document
  const mileage = car.mileage; // Assuming mileage is stored in the car document directly

  if (!mileage) {
    return res.status(400).json({ message: "Mileage not found for this car." });
  }

  // Fetch the package for the given mileage
  const packagee = await Package.findOne({ mileage }).populate("products");
  if (!packagee) {
    return res
      .status(404)
      .json({ message: "No package found for this mileage." });
  }

  res.status(200).json({
    message: "Package retrieved successfully.",
    packagee,
  });
};

export const getPackagesForUserCars = async (req, res) => {
  const userId = req.user._id;

  // Fetch all cars for the user under warranty
  const userCars = await Car.find({ userId, "carDetails.warranty": true });
  if (!userCars || userCars.length === 0) {
    return res
      .status(404)
      .json({ message: "No cars under warranty found for this user." });
  }

  const packagesForCars = await Promise.all(
    userCars.map(async (car) => {
      const packages = await Package.find({ mileage: { $lte: car.mileage } })
        .sort({ mileage: -1 }) // Get the closest package
        .populate("products");
      return { carId: car._id, packages };
    })
  );

  res
    .status(200)
    .json({ message: "Packages retrieved successfully.", packagesForCars });
};

export const assignPackageToCar = async (req, res) => {
  const { carId, packageId } = req.body;

  // Fetch the car and validate warranty status
  const car = await Car.findById(carId);
  if (!car) {
    return res.status(404).json({ message: "Car not found." });
  }

  if (!car.carDetails?.warranty) {
    return res.status(403).json({ message: "This car is not under warranty." });
  }

  // Validate the package
  const selectedPackage = await Package.findById(packageId);
  if (!selectedPackage) {
    return res.status(404).json({ message: "Package not found." });
  }

  // Assign the package to the car (if needed, you can update the car document with package info)
  res.status(200).json({
    message: "Package assigned successfully.",
    car,
    package: selectedPackage,
  });
};
