const mongoose = require('mongoose');

const tryOnSchema = new mongoose.Schema({
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
  status: { 
    type: String, 
    enum: ['pending', 'ordered', 'out_for_delivery', 'delivered'], 
    default: 'pending' 
  },
  measurements: {
    chest: { type: Number },
    waist: { type: Number },
    hip: { type: Number },
    preferred_color: { type: String }
  },
  delivery_address: { type: String },
  phone: { type: String },
  estimated_delivery: { type: Date },
  feedback: { 
    type: String, 
    enum: ['perfect', 'alterations', 'return', null],
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('TryOn', tryOnSchema);