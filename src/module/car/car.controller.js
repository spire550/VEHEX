import Car from "../../../DB/models/user/Car.model.js";


// Register car by car details
export const registerCarByCarDetails = async (req, res) => {
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
};


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
  };

  export const getAllCars = async (req, res, next) => {
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