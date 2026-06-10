const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'essay', 'structural'], required: true },
  options: { type: [String], default: [] },
  correctAnswer: { type: String, default: '' },
  marks: { type: Number, default: 2 },
  isAntiCramming: { type: Boolean, default: false },
});

const quizSchema = new mongoose.Schema(
  {
    noteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questions: [questionSchema],
    totalMarks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);