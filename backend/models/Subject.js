const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  color: { type: String, default: '#1a5276' },
  noteCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);