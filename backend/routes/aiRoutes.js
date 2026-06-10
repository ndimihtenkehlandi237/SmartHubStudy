const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/authMiddleware');

// ── WORKING GROQ MODELS (as of June 2026) ──
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// ── CALL GROQ ──
const callGroq = async (messages, maxTokens = 800) => {
  if (!process.env.GROQ_API_KEY || !process.env.GROQ_API_KEY.startsWith('gsk_')) {
    return null;
  }
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: GROQ_MODEL,
        max_tokens: maxTokens,
        temperature: 0.4,
        messages,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 25000,
      }
    );
    return response.data.choices[0].message.content;
  } catch (err) {
    console.error('Groq AI failed:', err.response?.status, err.response?.data?.error?.message || err.message);
    return null;
  }
};

// ── CALL OPENAI ──
const callOpenAI = async (messages, maxTokens = 800) => {
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
    console.error('OpenAI AI failed:', err.message);
    return null;
  }
};

// ── GENERAL AI CALL (tries Groq then OpenAI) ──
const callAI = async (messages, maxTokens = 800) => {
  const groqResult = await callGroq(messages, maxTokens);
  if (groqResult) return groqResult;
  const openaiResult = await callOpenAI(messages, maxTokens);
  if (openaiResult) return openaiResult;
  return null;
};

// ══════════════════════════════════════════════════
// POST /api/ai/explain-topic
// Explain a specific key topic from uploaded notes
// ══════════════════════════════════════════════════
router.post('/explain-topic', protect, async (req, res) => {
  try {
    const { topic, noteTitle, noteContent } = req.body;

    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    const messages = [
      {
        role: 'system',
        content: `You are an expert academic tutor for university students in Cameroon.
Explain key topics from lecture notes in a clear, detailed and student-friendly way.
Write between 120 and 200 words.
Structure your answer as: Definition → Key points → How it works or applies → Memory tip.
Do NOT use markdown headers or bullet points — write in clear paragraphs.`,
      },
      {
        role: 'user',
        content: `The student is studying "${noteTitle}" and wants to understand: "${topic}".

Here is the relevant note content for context:
${noteContent || 'No content available — explain the topic based on your knowledge.'}

Please explain "${topic}" clearly and thoroughly based on the notes above.
End your explanation with: "💡 Tip: [one memorable tip for remembering this concept]"`,
      },
    ];

    const explanation = await callAI(messages, 500);

    if (!explanation) {
      return res.status(200).json({
        explanation: `${topic} is an important concept covered in "${noteTitle}". ` +
          `This topic deals with fundamental principles that are essential for understanding the subject matter. ` +
          `To master this topic, review the relevant sections in your notes carefully and pay attention to any ` +
          `definitions, formulas or examples that relate to ${topic}. ` +
          `Practice applying the concept by answering the quiz questions generated from your notes. ` +
          `💡 Tip: Try explaining this concept out loud in your own words — if you can teach it, you understand it.`,
      });
    }

    console.log(`Topic explained successfully: ${topic}`);
    return res.status(200).json({ explanation });

  } catch (error) {
    console.error('Explain topic error:', error.message);
    return res.status(500).json({ message: 'Failed to explain topic' });
  }
});

// ══════════════════════════════════════════════════
// POST /api/ai/solve-math
// Solve a math equation step by step (Pro only)
// ══════════════════════════════════════════════════
router.post('/solve-math', protect, async (req, res) => {
  try {
    const { equation } = req.body;

    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user || user.plan !== 'pro') {
      return res.status(403).json({
        message: 'Math Solver is a Pro feature. Upgrade to access it.',
        code: 'PRO_REQUIRED',
      });
    }

    if (!equation || !equation.trim()) {
      return res.status(400).json({ message: 'Equation is required' });
    }

    const messages = [
      {
        role: 'system',
        content: `You are an expert mathematics tutor for university students.
Solve the given equation step by step clearly.
Return ONLY valid JSON with NO markdown and NO backticks:
{
  "equation": "the original equation as given",
  "steps": [
    { "step": 1, "explanation": "what we do in this step", "result": "mathematical result of this step" },
    { "step": 2, "explanation": "what we do in this step", "result": "mathematical result of this step" }
  ],
  "finalAnswer": "the final simplified answer",
  "explanation": "one sentence explaining what type of mathematical problem this is"
}`,
      },
      {
        role: 'user',
        content: `Solve this step by step: ${equation}`,
      },
    ];

    const raw = await callAI(messages, 1000);

    if (!raw) {
      return res.status(503).json({
        message: 'AI is currently unavailable. Please try again in a moment.',
      });
    }

    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    console.log(`Math solved: ${equation}`);
    return res.status(200).json({ result });

  } catch (error) {
    console.error('Math solver error:', error.message);
    return res.status(500).json({
      message: 'Failed to solve equation. Please check the format and try again.',
    });
  }
});

// ══════════════════════════════════════════════════
// POST /api/ai/chat
// General AI study help chat
// ══════════════════════════════════════════════════
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, noteTitle, noteContent } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const messages = [
      {
        role: 'system',
        content: `You are a helpful academic AI tutor for university students in Cameroon.
Help students understand their lecture notes and answer academic questions clearly.
Be concise and student-friendly. Maximum 150 words per response.`,
      },
      {
        role: 'user',
        content: noteContent
          ? `Context from my notes on "${noteTitle}":\n${noteContent.slice(0, 2000)}\n\nMy question: ${message}`
          : message,
      },
    ];

    const reply = await callAI(messages, 400);

    return res.status(200).json({
      reply: reply || 'I am unable to process your question right now. Please try again in a moment.',
    });

  } catch (error) {
    console.error('AI chat error:', error.message);
    return res.status(500).json({ message: 'Failed to get AI response' });
  }
});

// ══════════════════════════════════════════════════
// POST /api/ai/study-plan
// Generate a study plan for an upcoming exam
// ══════════════════════════════════════════════════
router.post('/study-plan', protect, async (req, res) => {
  try {
    const { examName, examDate, subject, topics } = req.body;

    if (!examName || !examDate) {
      return res.status(400).json({ message: 'Exam name and date are required' });
    }

    const daysLeft = Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24));

    const messages = [
      {
        role: 'system',
        content: `You are an academic study coach for university students in Cameroon.
Create practical, realistic day-by-day study plans students can actually follow.
Be specific with daily tasks and time allocations. Write in a friendly, motivating tone.`,
      },
      {
        role: 'user',
        content: `Create a study plan:
Exam: ${examName}
Subject: ${subject || 'General'}
Days remaining: ${daysLeft}
Key topics: ${topics || 'All course topics'}

Give me a practical day-by-day schedule. Maximum 200 words.`,
      },
    ];

    const plan = await callAI(messages, 600);

    return res.status(200).json({
      plan: plan ||
        `Study Plan for ${examName} (${daysLeft} days remaining):\n\n` +
        `Day 1-2: Review all notes and identify weak areas\n` +
        `Day 3-4: Focus on most difficult topics\n` +
        `Day 5-6: Practice with Smart Hub Study quiz questions daily\n` +
        `Final day: Light review and good rest before exam\n\n` +
        `💡 Tip: Use Smart Hub Study to generate quizzes from each topic!`,
    });

  } catch (error) {
    console.error('Study plan error:', error.message);
    return res.status(500).json({ message: 'Failed to generate study plan' });
  }
});

module.exports = router;