// controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "./../../../DB/models/user/User.model.js";
import tokenModel from "../../../DB/models/token/Token.model.js";

export const registerUser = async (req, res, next) => {
  const { name, email, mobile, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res
      .status(400)
      .json({ message: "User already exists with this email" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    name,
    email,
    mobile,
    password: hashedPassword,
  });

  await newUser.save();

  res.status(201).json({ message: "User registered successfully" });
};

export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  await tokenModel.create({ userId: user._id, token });

  res.status(200).json({ message: "Login successful", token });
};


export const logout = async (req, res, next) => {
  const { token } = req.headers;

  // Check if the token is provided
  if (!token) {
    return res.status(400).json({ message: "Token is required." });
  }

  try {
    // Find the token and check if it's valid
    const tokenRecord = await tokenModel.findOne({ token });

    // If no token is found
    if (!tokenRecord) {
      return res.status(404).json({ message: "Token not found." });
    }

    // If the token is already invalid, return an appropriate message
    if (!tokenRecord.isValid) {
      return res.status(400).json({ message: "User is already logged out." });
    }

    // Mark the token as invalid
    const updatedToken = await tokenModel.findOneAndUpdate(
      { token, isValid: true },
      { isValid: false },
      { new: true }
    );

    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Error during logout:", error);
    return res
      .status(500)
      .json({ message: "An error occurred during logout." });
  }
};
