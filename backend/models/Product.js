const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  color: { type: String, required: true },
  description: { type: String },
  emoji: { type: String },
  image_url: { type: String, default: null },
  stock_quantity: { type: Number, default: 10 }
});

module.exports = mongoose.model('Product', productSchema);