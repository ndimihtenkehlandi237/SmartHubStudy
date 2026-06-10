const Note = require('../models/Note');
const Subject = require('../models/Subject');
const User = require('../models/User');
const axios = require('axios');

// ── GROQ AVAILABLE MODELS (check console.groq.com/docs for current list) ──
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// ── CALL GROQ AI ──
const callGroq = async (messages, maxTokens = 1500) => {
  if (!process.env.GROQ_API_KEY || !process.env.GROQ_API_KEY.startsWith('gsk_')) {
    return null;
  }
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: GROQ_MODEL,
        max_tokens: maxTokens,
        temperature: 0.3,
        messages,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
    return response.data.choices[0].message.content;
  } catch (err) {
    console.error('Groq error:', err.response?.status, err.response?.data?.error?.message || err.message);
    return null;
  }
};

// ── CALL OPENAI ──
const callOpenAI = async (messages, maxTokens = 1500) => {
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.startsWith('sk-')) {
    return null;
  }
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: maxTokens,
      messages,
    });
    return response.choices[0].message.content;
  } catch (err) {
    console.error('OpenAI error:', err.message);
    return null;
  }
};

// ── AI SUMMARY GENERATOR ──
const generateSummary = async (text, title) => {
  const cleanText = text.slice(0, 12000);

  const systemPrompt = `You are an expert academic tutor for university students in Cameroon.
You will receive lecture notes and must produce a COMPREHENSIVE, STRUCTURED academic summary.
Return ONLY valid JSON with NO markdown, NO backticks, NO extra text.
The summary must use numbered headings and subheadings from the actual note content.
For EACH topic include a real-world example that helps the student understand it practically.
Use this EXACT format:
{
  "summary": "2-3 sentence overview of what the entire note covers",
  "sections": [
    {
      "heading": "1. Main Topic Name",
      "content": "Detailed explanation of this topic in 3-5 sentences.",
      "example": "Real world example: [practical example from daily life or industry that illustrates this concept]",
      "subTopics": [
        {
          "heading": "1.1 Sub Topic Name",
          "content": "Detailed explanation of this subtopic in 2-4 sentences.",
          "example": "Real world example: [practical example that illustrates this subtopic]"
        }
      ]
    }
  ],
  "keyTopics": ["topic1","topic2","topic3","topic4","topic5","topic6","topic7","topic8"],
  "references": []
}
Cover ALL major topics and subtopics found in the notes. Minimum 5 main sections.`;

  const userPrompt = `These are university lecture notes titled "${title}".
Produce a comprehensive structured summary with numbered headings and subheadings.
Include real-world examples for every section and subsection.
Cover ALL topics in the notes systematically.

Notes:
${cleanText}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  // 1. Try Groq
  console.log('Trying Groq for summary...');
  const groqRaw = await callGroq(messages, 4000);
  if (groqRaw) {
    try {
      const clean = groqRaw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      if (parsed.summary && parsed.sections) {
        console.log('Groq structured summary generated successfully');
        return parsed;
      }
    } catch (e) {
      console.log('Groq summary JSON parse failed:', e.message);
    }
  }

  // 2. Try OpenAI
  console.log('Trying OpenAI for summary...');
  const openaiRaw = await callOpenAI(messages, 4000);
  if (openaiRaw) {
    try {
      const clean = openaiRaw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      if (parsed.summary && parsed.sections) {
        console.log('OpenAI structured summary generated successfully');
        return parsed;
      }
    } catch (e) {
      console.log('OpenAI summary JSON parse failed:', e.message);
    }
  }

  // 3. Try Anthropic
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: 'claude-haiku-20240307',
        max_tokens: 4000,
        messages: [{ role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }],
      });
      const raw = response.content[0].text;
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      if (parsed.summary && parsed.sections) {
        console.log('Anthropic structured summary generated successfully');
        return parsed;
      }
    } catch (err) {
      console.log('Anthropic failed:', err.message);
    }
  }

  // 4. Smart fallback
  console.log('Using smart fallback for summary');
  const sentences = text.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 40);
  const summary = sentences.slice(0, 3).join('. ').trim() + '.';
  const words = text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(w => w.length > 4);
  const stopWords = new Set([
    'the','and','for','are','but','not','you','all','any','can','had','was',
    'one','our','out','get','has','his','how','its','may','new','now','see',
    'two','who','did','with','that','this','have','from','they','will','been',
    'each','which','their','there','when','more','very','just','also','into',
    'than','then','them','some','only','over','most','other','about','would',
  ]);
  const freq = {};
  words.forEach(w => { if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1; });
  const keyTopics = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

  return {
    summary,
    sections: [
      {
        heading: `1. Overview of ${title}`,
        content: sentences.slice(0, 4).join('. ') + '.',
        example: 'Review your notes for practical examples related to this topic.',
        subTopics: [],
      },
    ],
    keyTopics: keyTopics.length >= 3 ? keyTopics : ['Core Concepts', 'Key Definitions', 'Practical Applications', 'Summary Points'],
    references: [],
  };
};

// ── EXTRACT TEXT FROM BUFFER ──
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
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
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
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword' ||
    (originalname && originalname.endsWith('.docx'))
  ) return 'docx';
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
      message: 'Free plan limit: 5 uploads per 6 hours. Upgrade to Pro for unlimited uploads.',
      code: 'FREE_LIMIT_REACHED',
    };
  }
  return { allowed: true };
};

// ── UPLOAD NOTE ──
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

    const subject = await Subject.findOne({ _id: subjectId, userId: req.user.id });
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const fileType = getFileType(req.file.mimetype, req.file.originalname);
    console.log(`Processing ${fileType} file: ${req.file.originalname}`);

    const rawText = await extractText(req.file.buffer, fileType, req.file.mimetype);
    console.log(`Extracted ${rawText.length} characters`);

    const aiResult = await generateSummary(rawText || title, title);

    const note = await Note.create({
  userId: req.user.id,
  subjectId,
  title: title.trim(),
  fileType,
  rawText: rawText || '',
  summary: aiResult.summary || '',
  sections: aiResult.sections || [],
  keyTopics: aiResult.keyTopics || [],
  references: aiResult.references || [],
  courseLevel: courseLevel || 'Year 1',
  fileName: req.file.originalname,
});

    await Subject.findByIdAndUpdate(subjectId, { $inc: { noteCount: 1 } });

    console.log(`Note created successfully: ${note._id}`);

    return res.status(201).json({
      message: 'Note uploaded and processed successfully!',
      note: { ...note.toObject(), subjectId: subject },
    });
  } catch (error) {
    console.error('Upload note error:', error.message);
    return res.status(500).json({ message: error.message || 'Failed to upload note' });
  }
};

// ── GET ALL NOTES ──
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

// ── GET SINGLE NOTE ──
const getNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user.id })
      .populate('subjectId', 'name')
      .lean();
    if (!note) return res.status(404).json({ message: 'Note not found' });
    return res.status(200).json({ note });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch note' });
  }
};

// ── DELETE NOTE ──
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    await Subject.findByIdAndUpdate(note.subjectId, { $inc: { noteCount: -1 } });
    return res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete note' });
  }
};

// ── GET ALL SUBJECTS ──
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ subjects });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch subjects' });
  }
};

// ── CREATE SUBJECT ──
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
    if (existing) return res.status(400).json({ message: 'Subject already exists' });

    const subject = await Subject.create({
      userId: req.user.id,
      name: name.trim(),
      noteCount: 0,
    });
    return res.status(201).json({ message: 'Subject created successfully!', subject });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create subject' });
  }
};

module.exports = { uploadNote, getNotes, getNote, deleteNote, getSubjects, createSubject };