const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  balance: { type: Number, default: 0 },
  transactions: [{
    type: { type: String, enum: ['earned', 'spent'], default: 'earned' },
    amount: { type: Number },
    reason: { type: String },
    date: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Token', tokenSchema);