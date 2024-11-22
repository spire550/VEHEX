import Car from "../../../DB/models/user/Car.model.js";
import cloudinaryConnection from "../utils/cloudinary.js";

export const registerCar = async (req, res, next) => {
  const { engineNumber, model, year, agency, warranty, mileage } = req.body;

  // Get the userId from the authenticated user
  const userId = req.user._id;
  // Ensure a file is uploaded
  if (!req.file) {
    return next({ cause: 400, message: "Logo image is required" });
  }

  // Upload the logo to Cloudinary
  const { secure_url: logoUrl, public_id: logoPublicId } =
    await cloudinaryConnection().uploader.upload(req.file.path, {
      folder: `cars`,
    });

  if (engineNumber) {
    // Check if the current user already has a car with this engine number
    const existingCar = await Car.findOne({ engineNumber, userId });
    if (existingCar) {
      return next(
        new Error("You already have a car registered with this engine number.")
      );
    }

    // Create a car with the engine number and mileage
    const newCar = await Car.create({
      engineNumber,
      mileage, // Add mileage here
      userId,
      logo: { url: logoUrl, publicId: logoPublicId }, // Add logo details if needed
    });

    return res.status(201).json({
      message: "Car registered successfully with engine number.",
      car: newCar,
    });
  }

  // If engineNumber is not provided, validate carDetails
  if (model && year && agency) {
    // Create a car with the car details and mileage
    const newCar = await Car.create({
      carDetails: { model, year, agency, warranty },
      mileage, // Add mileage here
      userId,
      logo: { url: logoUrl, publicId: logoPublicId }, // Add logo details
    });

    return res.status(201).json({
      message: "Car registered successfully with car details.",
      car: newCar,
    });
  }

  // If neither engineNumber nor carDetails are provided
  return next(new Error("Either engine number or car details are required."));
};
// Register car by car details
/* export const registerCarByCarDetails = async (req, res) => {
  const { model, year, agency, warranty } = req.body;

  // Get the userId from the decoded token (attached by the auth middleware)
  const userId = req.user._id;

  // Ensure the car details are provided
  if (!model || !year || !agency) {
    return res.status(400).json({
      message: "Model, year, and agency are required to register the car.",
    });
  }

  // Register the car with car details
  const newCar = await Car.create({
    carDetails: { model, year, agency, warranty },
    userId,
  });

  return res.status(201).json({
    message: "Car registered successfully with car details",
    car: newCar,
  });
}; */
/* 
export const registerCarByEngineNumber = async (req, res) => {
  const { engineNumber } = req.body;

  // Get the userId from the decoded token (attached by the auth middleware)
  const userId = req.user._id;

  // Ensure the engine number is provided
  if (!engineNumber) {
    return res.status(400).json({
      message: "Engine number is required to register the car.",
    });
  }

  // Check if a car with this engine number already exists
  const existingCar = await Car.findOne({ engineNumber });
  if (existingCar) {
    return res.status(400).json({
      message: "Car with this engine number already exists.",
    });
  }

  // Register the car with engine number
  const newCar = await Car.create({
    engineNumber,
    userId,
  });

  return res.status(201).json({
    message: "Car registered successfully with engine number",
    car: newCar,
  });
}; */

export const getAllUserCars = async (req, res, next) => {
  const userId = req.user._id; // Get the userId from the decoded token

  // Find all cars for the logged-in user
  const cars = await Car.find({ userId });

  // If no cars are found, pass the error to the global handler
  if (cars.length === 0) {
    return next(new Error("No cars found for this user."));
  }

  // Return the cars if found
  res.status(200).json({
    message: "Cars fetched successfully.",
    cars,
  });
};

export const updateCar = async (req, res, next) => {
  try {
    const { carId } = req.params;
    const updates = req.body;
    const userId = req.user._id;

    // Find the car belonging to the logged-in user
    const car = await Car.findOne({ _id: carId, userId });

    if (!car) {
      return res
        .status(404)
        .json({ message: "Car not found or unauthorized." });
    }

    // Handle engine number updates
    if (updates.engineNumber) {
      // Check if the new engine number is already used by this user for another car
      const existingCar = await Car.findOne({
        engineNumber: updates.engineNumber,
        userId,
      });
      if (existingCar && existingCar._id.toString() !== carId) {
        return res
          .status(400)
          .json({ message: "You already have a car with this engine number." });
      }
      car.engineNumber = updates.engineNumber;
    }

    // Handle car details updates
    if (updates.carDetails) {
      car.carDetails = { ...car.carDetails, ...updates.carDetails };
    }

    // Handle mileage updates
    if (updates.mileage !== undefined) {
      car.mileage = updates.mileage;
    }

    // Handle logo updates
    if (req.files?.length) {
      const logoImage = [];

      // Parallel Cloudinary upload for new logo
      const uploadPromises = req.files.map((file) =>
        cloudinaryConnection().uploader.upload(file.path, {
          folder: "cars/logos",
        })
      );
      const uploadedLogos = await Promise.all(uploadPromises);

      uploadedLogos.forEach(({ secure_url, public_id }) => {
        logoImage.push({ secure_url, public_id });
      });

      car.logo = logoImage[0]; // Assuming only one logo is needed per car
    }

    // Save the updated car
    const updatedCar = await car.save();

    res.status(200).json({
      message: "Car updated successfully.",
      car: updatedCar,
    });
  } catch (error) {
    next(error); // Pass the error to the global error handler
  }
};

export const deleteCarForUser = async (req, res) => {
  const { carId } = req.params;
  const userId = req.user._id; // Retrieved from the auth middleware

  // Find and delete the car, ensuring it belongs to the logged-in user
  const car = await Car.findOneAndDelete({ _id: carId, userId });

  if (!car) {
    throw new Error("Car not found or unauthorized.");
  }

  res.status(200).json({ message: "Car deleted successfully.", car });
};

export const getAllCarsWithFilter = async (req, res, next) => {
  const {
    model,
    year,
    agency,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build query filters
  const filters = {};
  if (model) filters["carDetails.model"] = model;
  if (year) filters["carDetails.year"] = year;
  if (agency) filters["carDetails.agency"] = agency;

  // Pagination options
  const skip = (page - 1) * limit;

  // Fetch cars from database
  const cars = await Car.find(filters)
    .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Count total cars for pagination metadata
  const totalCars = await Car.countDocuments(filters);

  res.status(200).json({
    message: "Cars retrieved successfully.",
    cars,
    pagination: {
      total: totalCars,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalCars / limit),
    },
  });
};

export const getAllCars = async (req, res) => {
  const cars = await Car.find(); // Fetch all cars from the database
  res.status(200).json({
    message: "Cars retrieved successfully.",
    cars,
  });
};

export const deleteCarAdmin = async (req, res) => {
    const { carId } = req.params;
  
    // Check if the logged-in user is an admin (assuming you have this logic in your auth middleware)
    const user = req.user; // Assuming user is added to the request after authentication
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: You do not have permission to delete this car." });
    }
  
    // Find and delete the car
    const deletedCar = await Car.findByIdAndDelete(carId);
  
    if (!deletedCar) {
      return res.status(404).json({ message: "Car not found." });
    }
  
    res.status(200).json({ message: "Car deleted successfully.", car: deletedCar });
  };
  

  export const getCarById = async (req, res) => {
    const { carId } = req.params;
  
    // Find the car by ID
    const car = await Car.findById(carId);
  
    if (!car) {
      return res.status(404).json({ message: "Car not found." });
    }
  
    res.status(200).json({ car });
  };
  