const Note = require('../models/Note');
const Subject = require('../models/Subject');
const User = require('../models/User');

// ── AI SUMMARY GENERATOR ──
const generateSummary = async (text, title) => {
  const cleanText = text.slice(0, 3000);

  // Try OpenAI first
  if (
    process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY !== 'your_key_here' &&
    process.env.OPENAI_API_KEY.startsWith('sk-')
  ) {
    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 600,
        messages: [
          {
            role: 'system',
            content:
              'You are an academic assistant for university students in Cameroon. ' +
              'Read the lecture notes and return ONLY valid JSON with this exact format: ' +
              '{"summary": "3-4 sentence summary", "keyTopics": ["topic1","topic2","topic3","topic4","topic5"], "references": []}',
          },
          { role: 'user', content: cleanText },
        ],
      });
      const raw = response.choices[0].message.content;
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      console.log('OpenAI summary generated successfully');
      return parsed;
    } catch (err) {
      console.log('OpenAI failed, trying Anthropic:', err.message);
    }
  }

  // Try Anthropic Claude as fallback
  if (
    process.env.ANTHROPIC_API_KEY &&
    process.env.ANTHROPIC_API_KEY !== 'your_key_here' &&
    process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')
  ) {
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      const response = await anthropic.messages.create({
        model: 'claude-haiku-20240307',
        max_tokens: 600,
        messages: [
          {
            role: 'user',
            content:
              'Read these lecture notes and return ONLY valid JSON: ' +
              '{"summary": "3-4 sentence summary", "keyTopics": ["topic1","topic2","topic3","topic4","topic5"], "references": []} ' +
              'Notes: ' +
              cleanText,
          },
        ],
      });
      const raw = response.content[0].text;
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      console.log('Anthropic summary generated successfully');
      return parsed;
    } catch (err) {
      console.log('Anthropic failed, using smart fallback:', err.message);
    }
  }

  // Smart fallback — works with NO API key
  console.log('Using smart fallback for summary');

  const sentences = text
    .split(/[.!?]/)
    .map(s => s.trim())
    .filter(s => s.length > 30);

  const summary =
    sentences.slice(0, 3).join('. ').trim() + '.' ||
    `This note covers important content about ${title}. Review the material carefully to understand the key concepts and their applications in your course.`;

  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4);

  const stopWords = new Set([
    'the','and','for','are','but','not','you','all','any','can',
    'had','her','was','one','our','out','day','get','has','him',
    'his','how','its','may','new','now','old','see','two','way',
    'who','did','with','that','this','have','from','they','will',
    'been','each','which','their','there','when','more','very',
    'just','also','into','than','then','them','some','such','only',
    'over','most','other','about','would','these','those','could',
    'should','after','before','being','every','where','what','your',
    'were','said','here','does','made','make','like','time','know',
    'take','come','good','much','both','well','long','down','even',
    'back','still','such','life','give','many','most','tell','keep',
  ]);

  const freq = {};
  words.forEach(w => {
    if (!stopWords.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  });

  const keyTopics = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

  return {
    summary:
      summary ||
      `This note titled "${title}" covers key academic content. Study the material thoroughly and use the quiz feature to test your understanding.`,
    keyTopics:
      keyTopics.length >= 3
        ? keyTopics
        : [
            'Core Concepts',
            'Theoretical Framework',
            'Key Definitions',
            'Practical Applications',
            'Summary Points',
          ],
    references: [],
  };
};

// ── EXTRACT TEXT FROM BUFFER (Memory — works on Render) ──
const extractText = async (buffer, fileType, mimetype) => {
  try {
    if (mimetype === 'application/pdf' || fileType === 'pdf') {
      try {
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        return data.text || '';
      } catch (err) {
        console.error('PDF parse error:', err.message);
        return '';
      }
    }

    if (
      mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/msword' ||
      fileType === 'docx'
    ) {
      try {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        return result.value || '';
      } catch (err) {
        console.error('DOCX parse error:', err.message);
        return '';
      }
    }

    if (mimetype === 'text/plain' || fileType === 'txt') {
      return buffer.toString('utf8');
    }

    if (mimetype.startsWith('image/') || fileType === 'image') {
      return 'Image note uploaded. AI summary generated from title context.';
    }

    return '';
  } catch (error) {
    console.error('Text extraction error:', error.message);
    return '';
  }
};

// ── GET FILE TYPE ──
const getFileType = (mimetype, originalname) => {
  if (mimetype === 'application/pdf') return 'pdf';
  if (
    mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword' ||
    (originalname && originalname.endsWith('.docx'))
  )
    return 'docx';
  if (mimetype === 'text/plain') return 'txt';
  if (mimetype.startsWith('image/')) return 'image';
  return 'txt';
};

// ── CHECK FREE UPLOAD LIMIT ──
const checkUploadLimit = async (userId, isPro) => {
  if (isPro) return { allowed: true };
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const recentCount = await Note.countDocuments({
    userId,
    createdAt: { $gte: sixHoursAgo },
  });
  if (recentCount >= 5) {
    return {
      allowed: false,
      message:
        'Free plan limit: 5 uploads per 6 hours. Upgrade to Pro for unlimited uploads.',
      code: 'FREE_LIMIT_REACHED',
    };
  }
  return { allowed: true };
};

// ══════════════════════════════════════════════════
// UPLOAD NOTE — Uses buffer, no disk needed
// ══════════════════════════════════════════════════
const uploadNote = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, subjectId, courseLevel } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!subjectId) {
      return res.status(400).json({ message: 'Subject is required' });
    }

    const user = await User.findById(req.user.id);
    const isPro = user?.plan === 'pro';

    const limitCheck = await checkUploadLimit(req.user.id, isPro);
    if (!limitCheck.allowed) {
      return res.status(429).json({
        message: limitCheck.message,
        code: limitCheck.code,
      });
    }

    const subject = await Subject.findOne({
      _id: subjectId,
      userId: req.user.id,
    });
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const fileType = getFileType(req.file.mimetype, req.file.originalname);
    console.log(`Processing ${fileType} file: ${req.file.originalname}`);

    // Extract text from buffer — no file path needed
    const rawText = await extractText(
      req.file.buffer,
      fileType,
      req.file.mimetype
    );
    console.log(`Extracted ${rawText.length} characters`);

    // Generate AI summary
    const aiResult = await generateSummary(rawText || title, title);

    // Save note to database
    const note = await Note.create({
      userId: req.user.id,
      subjectId,
      title: title.trim(),
      fileType,
      rawText: rawText || '',
      summary: aiResult.summary,
      keyTopics: aiResult.keyTopics || [],
      references: aiResult.references || [],
      courseLevel: courseLevel || 'Year 1',
      fileName: req.file.originalname,
    });

    // Update subject note count
    await Subject.findByIdAndUpdate(subjectId, { $inc: { noteCount: 1 } });

    console.log(`Note created successfully: ${note._id}`);

    return res.status(201).json({
      message: 'Note uploaded and processed successfully!',
      note: {
        ...note.toObject(),
        subjectId: subject,
      },
    });
  } catch (error) {
    console.error('Upload note error:', error.message);
    return res.status(500).json({
      message: error.message || 'Failed to upload note',
    });
  }
};

// ══════════════════════════════════════════════════
// GET ALL NOTES
// ══════════════════════════════════════════════════
const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id })
      .populate('subjectId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ notes });
  } catch (error) {
    console.error('Get notes error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch notes' });
  }
};

// ══════════════════════════════════════════════════
// GET SINGLE NOTE
// ══════════════════════════════════════════════════
const getNote = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.id,
    })
      .populate('subjectId', 'name')
      .lean();

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    return res.status(200).json({ note });
  } catch (error) {
    console.error('Get note error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch note' });
  }
};

// ══════════════════════════════════════════════════
// DELETE NOTE
// ══════════════════════════════════════════════════
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    await Subject.findByIdAndUpdate(note.subjectId, {
      $inc: { noteCount: -1 },
    });
    return res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error.message);
    return res.status(500).json({ message: 'Failed to delete note' });
  }
};

// ══════════════════════════════════════════════════
// GET ALL SUBJECTS
// ══════════════════════════════════════════════════
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ subjects });
  } catch (error) {
    console.error('Get subjects error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch subjects' });
  }
};

// ══════════════════════════════════════════════════
// CREATE SUBJECT
// ══════════════════════════════════════════════════
const createSubject = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Subject name is required' });
    }

    const existing = await Subject.findOne({
      userId: req.user.id,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });
    if (existing) {
      return res.status(400).json({ message: 'Subject already exists' });
    }

    const subject = await Subject.create({
      userId: req.user.id,
      name: name.trim(),
      noteCount: 0,
    });

    return res.status(201).json({
      message: 'Subject created successfully!',
      subject,
    });
  } catch (error) {
    console.error('Create subject error:', error.message);
    return res.status(500).json({ message: 'Failed to create subject' });
  }
};

module.exports = {
  uploadNote,
  getNotes,
  getNote,
  deleteNote,
  getSubjects,
  createSubject,
};