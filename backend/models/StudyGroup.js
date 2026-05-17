const mongoose = require('mongoose');

const studyGroupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  sharedNotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Note' }],
  inviteCode: { type: String, unique: true },
}, { timestamps: true });

module.exports = mongoose.model('StudyGroup', studyGroupSchema);