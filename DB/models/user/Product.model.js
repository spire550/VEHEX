import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  size: String,
  discount: { type: Number, default: 0 },
  color: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['available', 'out of stock'], default: 'available' },
  images: [
    {
      secure_url: String,
      public_id: String,
    },
  ],
  video: {
    secure_url: String,
    public_id: String,
  },
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
