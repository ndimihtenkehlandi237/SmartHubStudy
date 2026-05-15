const mongoose = require('mongoose');

const examCountdownSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  examName: { type: String, required: true, trim: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  examDate: { type: Date, required: true },
  studyPlan: { type: String, default: '' },
  notifyEnabled: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('ExamCountdown', examCountdownSchema);