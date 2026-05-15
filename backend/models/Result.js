const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  answers: { type: Array, default: [] },
  score: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  understood: { type: Boolean, default: false },
  feedback: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);