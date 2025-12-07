import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    displayPrice: { type: String },
    originalPrice: { type: String },
    image: { type: String, required: true },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    affiliate: { type: String, required: true }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
