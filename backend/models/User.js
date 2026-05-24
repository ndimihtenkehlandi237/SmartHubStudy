const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  username: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, required: true, minlength: 6 },
  university: { type: String, required: true, trim: true },
  profilePicture: { type: String, default: '' },
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  language: { type: String, enum: ['en', 'fr'], default: 'en' },
  studyStreak: { type: Number, default: 0 },
  lastStreakDate: { type: Date, default: null },
  streakQuizCompletedToday: { type: Boolean, default: false },
  points: { type: Number, default: 0 },
  weeklyPoints: { type: Number, default: 0 },
  badges: { type: Array, default: [] },
  lastStudyDate: { type: Date, default: null },
  tokenBalance: { type: Number, default: 0 },
  extraUploads: { type: Number, default: 0 },
  extraQuizzes: { type: Number, default: 0 },
  currentCompetitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competition',
    default: null,
  },
  discount: { type: Number, default: 0 },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  friendRequests: [{
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    createdAt: { type: Date, default: Date.now },
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  shareLink: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);