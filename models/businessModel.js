const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
    
  category: {
    type: String,
    enum: [
      'Funeral Homes',
      'Cemeteries',
      'Headstones',
      'Attorneys',
      'Memorial Consulting',
      'Life Insurance',
    ],
    required: true,
  },
  businessName: { type: String, required: true },
  businessImage: { type: String }, // Store image URL or file path
  address: { type: String, required: true },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  description: { type: String, required: true },
});

const Business = mongoose.model('Business', businessSchema);

module.exports = Business;
