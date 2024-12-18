import Category from "../../../DB/models/user/Category.model.js";
import Product from "../../../DB/models/user/Product.model.js";

// Create a new category
export const createCategory = async (req, res) => {
  const { name, description } = req.body;

  if (!req.user || req.user.role !== "admin") {
    return next(new Error("You are not authorized to delete products."));
  }

  // Check if category with the same name already exists
  /* const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    return res.status(400).json({ message: "Category already exists." });
  } */

  // Create new category
  const newCategory = await Category.create({ name, description });

  res
    .status(201)
    .json({ message: "Category created successfully", category: newCategory });
};

// Get all categories
export const getAllCategories = async (req, res) => {
  const categories = await Category.find();

  if (categories.length === 0) {
    return res.status(404).json({ message: "No categories found." });
  }

  res.status(200).json({ categories });
};

// Update a category
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!req.user || req.user.role !== "admin") {
    return next(new Error("You are not authorized to delete products."));
  }

  // Find the category by id and update it
  const updatedCategory = await Category.findByIdAndUpdate(
    id,
    { name, description },
    { new: true }
  );

  if (!updatedCategory) {
    return res.status(404).json({ message: "Category not found." });
  }

  res.status(200).json({
    message: "Category updated successfully",
    category: updatedCategory,
  });
};

// Delete a category
export const deleteCategory = async (req, res, next) => {
  const { categoryId } = req.params;

  // Check if category exists
  const category = await Category.findById(categoryId);
  if (!category) {
    return next(new Error("Category not found."));
  }

  // Delete all products in this category
  await Product.deleteMany({ category: categoryId });

  // Delete the category
  await Category.findByIdAndDelete(categoryId);

  res.status(200).json({ message: "Category and its products deleted successfully." });
};


export const getCatById = async (req, res) => {
  const { catId } = req.params;

  // Find the car by ID
  const cat = await Category.findById(catId);

  if (!cat) {
    return res.status(404).json({ message: "Category not found." });
  }

  res.status(200).json({ cat });
};