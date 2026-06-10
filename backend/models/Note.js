const mongoose = require('mongoose');

const subTopicSchema = new mongoose.Schema({
  heading: { type: String, default: '' },
  content: { type: String, default: '' },
  example: { type: String, default: '' },
});

const sectionSchema = new mongoose.Schema({
  heading: { type: String, default: '' },
  content: { type: String, default: '' },
  example: { type: String, default: '' },
  subTopics: [subTopicSchema],
});

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    title: { type: String, required: true, trim: true },
    fileType: { type: String, default: 'txt' },
    rawText: { type: String, default: '' },
    summary: { type: String, default: '' },
    sections: [sectionSchema],
    keyTopics: { type: [String], default: [] },
    references: { type: [String], default: [] },
    courseLevel: { type: String, default: 'Year 1' },
    fileName: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);