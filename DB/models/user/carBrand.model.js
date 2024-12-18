import mongoose from "mongoose";

const carBrandSchema = new mongoose.Schema(
  {
    carBrand: {
      type: String,
      required: true,
    },
    carBrandLogo: {
      url: { type: String,required: true },
      publicId: { type: String ,required: true },
      
    },
  },
  {
    timestamps: true,
  }
);

const CarBrand = mongoose.model("CarBrand", carBrandSchema);

export default CarBrand;
