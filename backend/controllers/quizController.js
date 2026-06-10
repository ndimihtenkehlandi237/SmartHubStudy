const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const Note = require('../models/Note');
const User = require('../models/User');

// ── ANTI-CRAMMING: Rephrase questions ──
const rephraseQuestion = (question) => {
  const rephrasings = {
    'What is': ['Define', 'Explain what is meant by', 'How would you describe'],
    'Which of the following': ['Select the correct answer:', 'Identify the option that best describes', 'Choose the most accurate statement:'],
    'How does': ['In what way does', 'Describe how', 'Explain the manner in which'],
    'Why is': ['What is the reason that', 'Explain why', 'Provide a justification for why'],
    'What are': ['List and explain', 'Identify', 'Name the key'],
    'Describe': ['Elaborate on', 'Provide a detailed explanation of', 'Discuss'],
    'Explain': ['Describe in your own words', 'Provide an account of', 'Detail'],
  };
  let rephrased = question;
  for (const [original, alternatives] of Object.entries(rephrasings)) {
    if (question.startsWith(original)) {
      const random = alternatives[Math.floor(Math.random() * alternatives.length)];
      rephrased = question.replace(original, random);
      break;
    }
  }
  return rephrased;
};

// ── ANTI-CRAMMING: Generate variant ──
const generateAntiCrammingVariant = (originalQuestion) => {
  const prefixes = [
    'In your own words, ',
    'Without looking at your notes, ',
    'Based on your understanding, ',
    'Thinking critically, ',
    'Applying what you have learned, ',
  ];
  const suffixes = [
    ' Explain your reasoning.',
    ' Give a specific example.',
    ' Why is this important?',
    ' How does this apply in practice?',
    ' What would happen if this was different?',
  ];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${prefix}${originalQuestion.toLowerCase()}${suffix}`;
};

// ── ANTI-CRAMMING POST-PROCESSING ──
const processAntiCramming = (questions) => {
  return questions.map((q, i) => {
    if (i % 4 === 3 && q.type !== 'mcq') {
      return { ...q, question: generateAntiCrammingVariant(q.question), isAntiCramming: true };
    }
    if (i % 6 === 5 && q.type === 'mcq') {
      return { ...q, question: rephraseQuestion(q.question), isAntiCramming: true };
    }
    return q;
  });
};

// ── GENERATE QUESTIONS WITH AI ──
const generateQuestions = async (text, noteTitle, isPro) => {
  const questionCount = isPro ? 50 : 5;

  // Limit text size to avoid 413 errors on all AI providers
  const noteText = text ? text.slice(0, 3000) : noteTitle;

  const systemPrompt = `You are an expert academic quiz creator for university students in Cameroon.
Generate exam questions directly from the provided lecture notes.
Base the questions on the ACTUAL CONTENT of the notes.
Return ONLY a valid JSON array with NO markdown, NO backticks, NO extra text.
Each item must have: question (string), type (string), options (array), correctAnswer (string), marks (number).
Types allowed: "mcq" with 4 options and 2 marks, "essay" with empty options and 5 marks, "structural" with empty options and 8 marks.`;

  const userPrompt = isPro
    ? `Generate exactly 50 exam questions from these lecture notes titled "${noteTitle}".
25 MCQ (type mcq, 4 options, 2 marks each)
15 Essay (type essay, empty options array, 5 marks each)
10 Structural (type structural, empty options array, 8 marks each)
Base ALL questions on the actual content below.
Notes: ${noteText}`
    : `Generate exactly 5 exam questions from these lecture notes titled "${noteTitle}".
3 MCQ (type mcq, 4 options, 2 marks each)
1 Essay (type essay, empty options array, 5 marks)
1 Structural (type structural, empty options array, 8 marks)
Base ALL questions on the actual content below.
Notes: ${noteText}`;

  // ── 1. TRY GROQ (completely free) ──
  if (
    process.env.GROQ_API_KEY &&
    process.env.GROQ_API_KEY.startsWith('gsk_')
  ) {
    try {
      const axios = require('axios');
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          max_tokens: 4000,
          temperature: 0.3,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );
      const raw = response.data.choices[0].message.content;
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      const questions = Array.isArray(parsed) ? parsed : parsed.questions;
      console.log(`Groq quiz generated: ${questions.length} questions`);
      return questions;
    } catch (err) {
      console.log('Groq quiz failed, trying DeepSeek:', err.message);
    }
  }

  // ── 3. TRY OPENAI ──
  if (
    process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY.startsWith('sk-')
  ) {
    try {
      const OpenAI = require('openai');
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 4000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });
      const content = response.choices[0].message.content;
      const cleaned = content.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      const questions = Array.isArray(parsed) ? parsed : parsed.questions;
      console.log(`OpenAI quiz generated: ${questions.length} questions`);
      return questions;
    } catch (error) {
      console.error('OpenAI quiz error:', error.message);
    }
  }

  // ── 4. TRY ANTHROPIC ──
  if (
    process.env.ANTHROPIC_API_KEY &&
    process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')
  ) {
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const message = await client.messages.create({
        model: 'claude-haiku-20240307',
        max_tokens: 4000,
        messages: [{ role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }],
      });
      const content = message.content[0].text;
      const cleaned = content.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      const questions = Array.isArray(parsed) ? parsed : parsed.questions;
      console.log(`Anthropic quiz generated: ${questions.length} questions`);
      return questions;
    } catch (error) {
      console.error('Anthropic quiz error:', error.message);
    }
  }

  // ── 5. SMART FALLBACK ──
  console.log('Using placeholder questions — no AI key working');
  return generatePlaceholders(noteTitle, questionCount);
};

// ── PLACEHOLDER QUESTIONS GENERATOR ──
const generatePlaceholders = (noteTitle, count) => {
  const all = [];

  const mcqData = [
    { q: `What is the main topic of "${noteTitle}"?`, opts: ['A detailed academic study', 'A personal diary', 'A fiction story', 'A recipe book'], ans: 'A detailed academic study' },
    { q: 'Which study method produces the best long-term retention?', opts: ['Active recall through testing', 'Passive re-reading', 'Last minute cramming', 'Highlighting only'], ans: 'Active recall through testing' },
    { q: 'Understanding a concept deeply is better than memorizing it.', opts: ['Strongly Agree', 'Disagree', 'Neutral', 'Strongly Disagree'], ans: 'Strongly Agree' },
    { q: 'What does Smart Hub Study help students do?', opts: ['Study smarter using AI', 'Play games online', 'Watch movies', 'Browse social media'], ans: 'Study smarter using AI' },
    { q: 'Which payment methods are supported by Smart Hub Study?', opts: ['MTN MoMo and Orange Money', 'PayPal only', 'Bitcoin only', 'Cash only'], ans: 'MTN MoMo and Orange Money' },
    { q: 'What is a Progressive Web Application?', opts: ['A web app that works offline', 'A programming language', 'A database type', 'An operating system'], ans: 'A web app that works offline' },
    { q: 'Which database is used by Smart Hub Study?', opts: ['MongoDB', 'MySQL', 'Oracle', 'Microsoft Access'], ans: 'MongoDB' },
    { q: 'What does OCR stand for?', opts: ['Optical Character Recognition', 'Online Course Registration', 'Open Content Repository', 'Organised Reading'], ans: 'Optical Character Recognition' },
    { q: 'How are passwords stored in the database?', opts: ['Encrypted with bcrypt', 'In plain text', 'As images', 'Not stored'], ans: 'Encrypted with bcrypt' },
    { q: 'What does the study streak feature track?', opts: ['Consecutive days of study', 'Notes deleted', 'Internet speed', 'Login attempts'], ans: 'Consecutive days of study' },
    { q: 'Which frontend framework is used?', opts: ['React.js', 'Angular', 'Vue.js', 'Svelte'], ans: 'React.js' },
    { q: 'What does JWT stand for?', opts: ['JSON Web Token', 'Java Web Technology', 'JavaScript Wrapper Tool', 'Joint Web Transfer'], ans: 'JSON Web Token' },
    { q: `Which best describes "${noteTitle}"?`, opts: ['Academic study material', 'Entertainment content', 'Advertisement', 'Social media post'], ans: 'Academic study material' },
    { q: 'What is the recommended approach when studying notes?', opts: ['Deep understanding', 'Surface memorization', 'Speed reading only', 'Skipping difficult parts'], ans: 'Deep understanding' },
    { q: 'What is the main challenge students in Cameroon face?', opts: ['Information overload and poor organization', 'Too many apps', 'Too much electricity', 'Too fast internet'], ans: 'Information overload and poor organization' },
  ];

  const essayTopics = [
    'main concepts and their academic significance',
    'practical real-world applications of the key ideas',
    'how this topic relates to everyday life in Cameroon',
    'the challenges discussed and their proposed solutions',
    'the most important lesson learned from this note',
    'how you would explain this topic to a classmate',
    'the relationship between the different concepts covered',
    'how understanding this topic helps your future career',
    'the limitations or disadvantages mentioned in the content',
    'how technology is changing this field of study',
    'the historical background of the main topic',
    'future developments expected in this area',
    'how this topic connects to other subjects you study',
    'the ethical considerations related to this topic',
    'your personal reflection on what you learned',
  ];

  const structuralTopics = [
    'the step-by-step process described in the note',
    'how to implement the main concept from start to finish',
    'the sequence of events or logical steps outlined',
    'the cause and effect relationships discussed',
    'how to solve a problem using the methods described',
    'the framework or model presented in the notes',
    'how the system or process works from input to output',
    'the methodology for achieving the main goal',
    'the procedure for applying the key concept practically',
    'the logical flow of arguments in the note',
  ];

  let mcqCount, essayCount, structuralCount;
  if (count === 5) {
    mcqCount = 3; essayCount = 1; structuralCount = 1;
  } else {
    mcqCount = 25; essayCount = 15; structuralCount = 10;
  }

  for (let i = 0; i < mcqCount; i++) {
    const item = mcqData[i % mcqData.length];
    all.push({ question: item.q, type: 'mcq', options: item.opts, correctAnswer: item.ans, marks: 2 });
  }
  for (let i = 0; i < essayCount; i++) {
    const topic = essayTopics[i % essayTopics.length];
    all.push({
      question: `Write a detailed essay discussing the ${topic} covered in "${noteTitle}". Use specific examples.`,
      type: 'essay', options: [],
      correctAnswer: `A comprehensive essay covering ${topic} with examples and critical analysis.`,
      marks: 5,
    });
  }
  for (let i = 0; i < structuralCount; i++) {
    const topic = structuralTopics[i % structuralTopics.length];
    all.push({
      question: `Using numbered headings, outline ${topic} as presented in "${noteTitle}".`,
      type: 'structural', options: [],
      correctAnswer: `A well-structured numbered answer covering ${topic} systematically.`,
      marks: 8,
    });
  }

  return all;
};

// ── GENERATE QUIZ ──
const generateQuiz = async (req, res) => {
  try {
    const { noteId } = req.body;
    if (!noteId) return res.status(400).json({ message: 'Note ID is required' });

    const note = await Note.findOne({ _id: noteId, userId: req.user.id });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    const user = await User.findById(req.user.id);
    const isPro = user?.plan === 'pro';

    await Quiz.findOneAndDelete({ noteId, userId: req.user.id });

    let questions = await generateQuestions(note.rawText || note.title, note.title, isPro);

// Sanitize — make sure every question has all required fields
questions = questions.map(q => ({
  question: q.question || 'Question not available',
  type: ['mcq', 'essay', 'structural'].includes(q.type) ? q.type : 'mcq',
  options: Array.isArray(q.options) ? q.options : [],
  correctAnswer: q.correctAnswer || q.answer || q.correct_answer || '',
  marks: q.marks || (q.type === 'essay' ? 5 : q.type === 'structural' ? 8 : 2),
  isAntiCramming: false,
}));

// Enforce correct question count
const targetCount = isPro ? 50 : 5;
if (questions.length > targetCount) {
  questions = questions.slice(0, targetCount);
}
if (questions.length < targetCount) {
  const extras = generatePlaceholders(note.title, targetCount)
    .slice(questions.length);
  questions = [...questions, ...extras];
}

if (isPro) {
  questions = processAntiCramming(questions);
}

const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const quiz = await Quiz.create({
      noteId,
      userId: req.user.id,
      questions,
      totalMarks,
    });

    console.log(`Quiz created: ${questions.length} questions, isPro: ${isPro}`);

    res.status(201).json({
      message: `Quiz generated with ${questions.length} questions!`,
      quiz,
      isPro,
    });
  } catch (error) {
    console.error('Generate quiz error:', error.message);
    res.status(500).json({ message: 'Failed to generate quiz. Please try again.' });
  }
};

// ── SUBMIT QUIZ ──
const submitQuiz = async (req, res) => {
  try {
    const { quizId, noteId, answers } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    let score = 0;
    const gradedAnswers = [];

    quiz.questions.forEach((question, index) => {
      const studentAnswer = answers[index] || '';
      let isCorrect = false;
      let earnedMarks = 0;

      if (question.type === 'mcq') {
        isCorrect = studentAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
        earnedMarks = isCorrect ? question.marks : 0;
      } else {
        if (studentAnswer.trim().length > 30) {
          earnedMarks = Math.floor(question.marks * 0.6);
          isCorrect = true;
        } else if (studentAnswer.trim().length > 10) {
          earnedMarks = Math.floor(question.marks * 0.3);
          isCorrect = false;
        }
      }

      score += earnedMarks;
      gradedAnswers.push({
        question: question.question,
        type: question.type,
        studentAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        earnedMarks,
        totalMarks: question.marks,
      });
    });

    const percentage = Math.round((score / quiz.totalMarks) * 100);
    const understood = percentage >= 70;

    let feedback = '';
    if (percentage >= 90) feedback = '🏆 Excellent! You have completely mastered this topic!';
    else if (percentage >= 70) feedback = '✅ Good job! You understand this topic well!';
    else if (percentage >= 50) feedback = '⚠️ Fair attempt. Review weak areas and try again.';
    else if (percentage >= 30) feedback = '📚 You need more study. Review the notes carefully.';
    else feedback = '❌ This topic needs serious attention. Restudy before your exam.';

    const result = await Result.create({
      userId: req.user.id,
      quizId,
      noteId,
      answers: gradedAnswers,
      score,
      totalMarks: quiz.totalMarks,
      percentage,
      understood,
      feedback,
    });

    // ── UPDATE STREAK ──
    const userDoc = await User.findById(req.user.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastStreak = userDoc.lastStreakDate ? new Date(userDoc.lastStreakDate) : null;
    if (lastStreak) lastStreak.setHours(0, 0, 0, 0);

    let newStreak = userDoc.studyStreak || 0;
    if (!lastStreak) {
      newStreak = 1;
    } else if (lastStreak.getTime() === today.getTime()) {
      newStreak = userDoc.studyStreak;
    } else if (lastStreak.getTime() === yesterday.getTime()) {
      newStreak = userDoc.studyStreak + 1;
    } else {
      newStreak = 1;
    }

    const newBadges = [...(userDoc.badges || [])];
    if (newStreak >= 3 && !newBadges.includes('streak_3')) newBadges.push('streak_3');
    if (newStreak >= 7 && !newBadges.includes('streak_7')) newBadges.push('streak_7');
    if (newStreak >= 14 && !newBadges.includes('streak_14')) newBadges.push('streak_14');
    if (newStreak >= 30 && !newBadges.includes('streak_30')) newBadges.push('streak_30');
    if (percentage >= 90 && !newBadges.includes('top_scorer')) newBadges.push('top_scorer');

    const pointsEarned = Math.floor(score / 10) + (understood ? 10 : 0);

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { points: pointsEarned },
      lastStudyDate: new Date(),
      lastStreakDate: today,
      streakQuizCompletedToday: true,
      studyStreak: newStreak,
      badges: newBadges,
    });

    if (userDoc.currentCompetitionId) {
      const { updateScore } = require('./competitionController');
      await updateScore(userDoc.currentCompetitionId, req.user.id, pointsEarned, percentage);
    }

    res.status(201).json({
      message: 'Quiz submitted successfully!',
      result,
      streak: newStreak,
      pointsEarned,
      streakUpdated: true,
    });
  } catch (error) {
    console.error('Submit quiz error:', error.message);
    res.status(500).json({ message: 'Failed to submit quiz.' });
  }
};

// ── GET ALL RESULTS ──
const getResults = async (req, res) => {
  try {
    const results = await Result.find({ userId: req.user.id })
      .populate('noteId', 'title')
      .sort({ createdAt: -1 });
    res.status(200).json({ results });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET SINGLE RESULT ──
const getResult = async (req, res) => {
  try {
    const result = await Result.findOne({ _id: req.params.id, userId: req.user.id })
      .populate('noteId', 'title');
    if (!result) return res.status(404).json({ message: 'Result not found' });
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET STATS ──
const getStats = async (req, res) => {
  try {
    const results = await Result.find({ userId: req.user.id });
    const totalQuizzes = results.length;
    const avgScore = totalQuizzes > 0
      ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / totalQuizzes)
      : 0;
    const understood = results.filter(r => r.understood).length;
    res.status(200).json({ totalQuizzes, avgScore, understood });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { generateQuiz, submitQuiz, getResults, getResult, getStats };