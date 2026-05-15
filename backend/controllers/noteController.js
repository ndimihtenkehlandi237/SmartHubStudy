const Note = require('../models/Note');
const Subject = require('../models/Subject');
const mammoth = require('mammoth');

// ── EXTRACT TEXT FROM FILE ──
const extractText = async (file) => {
  const mimeType = file.mimetype;

  try {
    if (mimeType === 'application/pdf') {
      const PDFParser = require('pdf2json');
      return new Promise((resolve) => {
        const pdfParser = new PDFParser();
        pdfParser.on('pdfParser_dataReady', (pdfData) => {
          try {
            const text = pdfData.Pages.map(page =>
              page.Texts.map(t => {
                try {
                  return decodeURIComponent(t.R.map(r => r.T).join(''));
                } catch {
                  return t.R.map(r => r.T).join('');
                }
              }).join(' ')
            ).join('\n');
            resolve(text);
          } catch (err) {
            resolve('PDF text extracted with partial success.');
          }
        });
        pdfParser.on('pdfParser_dataError', () => {
          resolve('PDF could not be fully parsed. Please try a TXT file.');
        });
        pdfParser.parseBuffer(file.buffer);
      });
    }

    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value;
    }

    if (mimeType === 'text/plain') {
      return file.buffer.toString('utf-8');
    }

    if (mimeType.startsWith('image/')) {
      return 'Image note uploaded successfully.';
    }

  } catch (err) {
    console.error('Extract error:', err.message);
    return 'Content extraction failed. Please try a TXT file.';
  }

  return '';
};

// ── GENERATE AI SUMMARY ──
const generateSummary = async (text, title) => {

  // Try OpenAI
  if (process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY !== 'your_openai_key_here') {
    try {
      const OpenAI = require('openai');
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 2000,
        messages: [
          {
            role: 'system',
            content: 'You are an expert academic tutor helping university students in Cameroon study effectively.'
          },
          {
            role: 'user',
            content: `Analyze these student notes titled "${title}" and provide:
1. A comprehensive summary covering ALL major concepts (minimum 4 paragraphs)
2. The 8 most important key topics
3. 5 academic references related to the content

Return ONLY valid JSON:
{
  "summary": "very detailed summary here covering all major points from the notes",
  "keyTopics": ["topic1", "topic2", "topic3", "topic4", "topic5", "topic6", "topic7", "topic8"],
  "references": ["reference1", "reference2", "reference3", "reference4", "reference5"]
}

Student Notes:
${text.slice(0, 6000)}`
          }
        ]
      });

      const content = response.choices[0].message.content;
      const cleaned = content.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      console.log('OpenAI summary generated successfully!');
      return parsed;

    } catch (error) {
      console.error('OpenAI Error:', error.message);
    }
  }

  // Try Claude
  if (process.env.ANTHROPIC_API_KEY &&
    process.env.ANTHROPIC_API_KEY !== 'your_claude_api_key_here') {
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Analyze these student notes titled "${title}".
Return ONLY valid JSON:
{
  "summary": "detailed summary",
  "keyTopics": ["topic1", "topic2", "topic3", "topic4", "topic5", "topic6", "topic7", "topic8"],
  "references": ["ref1", "ref2", "ref3", "ref4", "ref5"]
}
Notes: ${text.slice(0, 6000)}`
        }]
      });

      const content = message.content[0].text;
      const cleaned = content.replace(/```json|```/g, '').trim();
      console.log('Claude summary generated successfully!');
      return JSON.parse(cleaned);

    } catch (error) {
      console.error('Claude Error:', error.message);
    }
  }

  // Smart placeholder — uses actual note content
  const sentences = text.split('.').filter(s => s.trim().length > 20);
  const firstPart = sentences.slice(0, 5).join('. ');
  const middlePart = sentences.slice(5, 10).join('. ');
  const lastPart = sentences.slice(10, 15).join('. ');

  const words = text.split(' ');
  const keyTopics = [];
  const skipWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'this', 'that', 'these', 'those'];
  const wordCount = {};
  words.forEach(word => {
    const clean = word.toLowerCase().replace(/[^a-z]/g, '');
    if (clean.length > 4 && !skipWords.includes(clean)) {
      wordCount[clean] = (wordCount[clean] || 0) + 1;
    }
  });
  const sorted = Object.entries(wordCount).sort((a, b) => b[1] - a[1]);
  sorted.slice(0, 8).forEach(([word]) => {
    keyTopics.push(word.charAt(0).toUpperCase() + word.slice(1));
  });

  return {
    summary: `This note titled "${title}" covers important academic concepts relevant to university studies.

${firstPart ? firstPart + '.' : 'The note contains foundational concepts that are essential for examination preparation.'}

${middlePart ? middlePart + '.' : 'Students are advised to pay close attention to the key definitions and principles outlined in this material.'}

${lastPart ? lastPart + '.' : 'Understanding these concepts deeply rather than memorizing them will lead to better performance in examinations.'}

To get a full AI-powered summary with detailed analysis, please add your OpenAI or Claude API key to the system configuration.`,
    keyTopics: keyTopics.length >= 5 ? keyTopics : [
      'Core Concepts', 'Key Definitions', 'Important Principles',
      'Practical Applications', 'Exam Topics', 'Theory Fundamentals',
      'Study Focus Areas', 'Critical Knowledge'
    ],
    references: [
      `Academic textbook related to ${title}`,
      `Peer-reviewed journal articles on ${keyTopics[0] || 'this topic'}`,
      `University lecture materials on ${keyTopics[1] || 'related concepts'}`,
      `Online resources: Khan Academy, Coursera on ${keyTopics[2] || 'this subject'}`,
      `Research papers available on Google Scholar for ${title}`,
    ]
  };
};

// ── UPLOAD NOTE ──
const uploadNote = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, subjectId, courseLevel } = req.body;

    if (!title || !subjectId) {
      return res.status(400).json({ message: 'Title and subject are required' });
    }

    const subject = await Subject.findOne({ _id: subjectId, userId: req.user.id });
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    let fileType = 'text';
    if (req.file.mimetype === 'application/pdf') fileType = 'pdf';
    else if (req.file.mimetype.includes('wordprocessingml')) fileType = 'docx';
    else if (req.file.mimetype.startsWith('image/')) fileType = 'image';

    const rawText = await extractText(req.file);
    const aiResult = await generateSummary(rawText, title);

    const note = await Note.create({
      title,
      userId: req.user.id,
      subjectId,
      courseLevel: courseLevel || '',
      fileType,
      fileUrl: '',
      rawText,
      summary: aiResult.summary || '',
      keyTopics: aiResult.keyTopics || [],
      references: aiResult.references || [],
    });

    await Subject.findByIdAndUpdate(subjectId, { $inc: { noteCount: 1 } });

    res.status(201).json({
      message: 'Note uploaded and summarized successfully!',
      note,
    });

  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ message: 'Upload failed. Please try again.' });
  }
};

// ── GET ALL NOTES ──
const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id })
      .populate('subjectId', 'name color')
      .sort({ createdAt: -1 });
    res.status(200).json({ notes });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET SINGLE NOTE ──
const getNote = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('subjectId', 'name color');
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.status(200).json({ note });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET NOTES BY SUBJECT ──
const getNotesBySubject = async (req, res) => {
  try {
    const notes = await Note.find({
      userId: req.user.id,
      subjectId: req.params.subjectId
    }).sort({ createdAt: -1 });
    res.status(200).json({ notes });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── DELETE NOTE ──
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    await Subject.findByIdAndUpdate(note.subjectId, { $inc: { noteCount: -1 } });
    res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── CREATE SUBJECT ──
const createSubject = async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ message: 'Subject name is required' });
    const subject = await Subject.create({
      name,
      userId: req.user.id,
      color: color || '#1a5276'
    });
    res.status(201).json({ message: 'Subject created!', subject });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET ALL SUBJECTS ──
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.status(200).json({ subjects });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── DELETE SUBJECT ──
const deleteSubject = async (req, res) => {
  try {
    await Subject.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    await Note.deleteMany({ subjectId: req.params.id, userId: req.user.id });
    res.status(200).json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  uploadNote,
  getNotes,
  getNote,
  getNotesBySubject,
  deleteNote,
  createSubject,
  getSubjects,
  deleteSubject,
};