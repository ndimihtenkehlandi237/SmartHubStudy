const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderName: { type: String, required: true },
  text: { type: String, default: '' },
  type: {
    type: String,
    enum: ['text', 'voice'],
    default: 'text',
  },
  voiceUrl: { type: String, default: '' },
  duration: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);