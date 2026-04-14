const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  priceUnit: { type: String, required: true, default: 'hr' },
  iconName: { type: String, default: 'Tractor' },
  colorClass: { type: String, default: 'text-emerald-400' },
  rating: { type: Number, default: 0 },
  location: { type: String, required: true },
  mobileNumber: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Service', serviceSchema);
