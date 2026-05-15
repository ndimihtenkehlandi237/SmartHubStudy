const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'essay', 'structural'], required: true },
  options: { type: Array, default: [] },
  correctAnswer: { type: String, required: true },
  marks: { type: Number, default: 1 },
});

const quizSchema = new mongoose.Schema({
  noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questions: [questionSchema],
  totalMarks: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);