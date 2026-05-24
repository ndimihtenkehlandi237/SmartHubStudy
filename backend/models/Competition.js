const mongoose = require('mongoose');

const competitionSchema = new mongoose.Schema({
  weekStart: { type: Date, required: true },
  weekEnd: { type: Date, required: true },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed'],
    default: 'upcoming',
  },
  type: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free',
  },
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fullName: { type: String },
    university: { type: String },
    points: { type: Number, default: 0 },
    quizzesPlayed: { type: Number, default: 0 },
    avgScore: { type: Number, default: 0 },
    lastPlayed: { type: Date },
    hasPlayedToday: { type: Boolean, default: false },
    daysPlayed: { type: Number, default: 0 },
    rewarded: { type: Boolean, default: false },
  }],
  winners: [{
    rank: Number,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fullName: String,
    points: Number,
    reward: String,
    rewardType: String,
  }],
}, { timestamps: true });

module.exports = mongoose.model('Competition', competitionSchema);