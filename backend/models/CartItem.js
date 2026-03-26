const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  product_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  quantity: { type: Number, required: true, min: 1, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('CartItem', cartItemSchema);