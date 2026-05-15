const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  university: { type: String, required: true, trim: true },
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  language: { type: String, enum: ['en', 'fr'], default: 'en' },
  studyStreak: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  badges: { type: Array, default: [] },
  lastStudyDate: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);