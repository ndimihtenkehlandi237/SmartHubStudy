const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  courseLevel: { type: String, default: '' },
  fileType: { type: String, enum: ['pdf', 'docx', 'text', 'image'], required: true },
  fileUrl: { type: String, default: '' },
  rawText: { type: String, default: '' },
  summary: { type: String, default: '' },
  keyTopics: { type: Array, default: [] },
  references: { type: Array, default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);