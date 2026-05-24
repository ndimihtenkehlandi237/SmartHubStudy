const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const Note = require('../models/Note');
const User = require('../models/User');

// ── GENERATE QUESTIONS ──
const generateQuestions = async (text, noteTitle, isPro) => {

  // Free plan — always use placeholders with 5 questions only
  if (!isPro) {
    return generatePlaceholders(noteTitle, 5);
  }

  // Pro plan — try OpenAI first
  if (
    process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY !== 'your_openai_key_here'
  ) {
    try {
      const OpenAI = require('openai');
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 8000,
        messages: [
          {
            role: 'system',
            content: `You are an expert academic tutor creating exam questions
            for university students in Cameroon. Generate questions that test
            deep understanding not memorization.`,
          },
          {
            role: 'user',
            content: `Based on these student notes titled "${noteTitle}",
generate exactly 50 exam questions:
- 25 Multiple Choice Questions (MCQ) with 4 options each
- 15 Essay questions requiring detailed responses
- 10 Structural questions requiring step by step answers

Return ONLY a valid JSON array with exactly 50 items:
[
  {
    "question": "question text",
    "type": "mcq",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "marks": 2
  },
  {
    "question": "essay question",
    "type": "essay",
    "options": [],
    "correctAnswer": "expected answer",
    "marks": 5
  },
  {
    "question": "structural question",
    "type": "structural",
    "options": [],
    "correctAnswer": "step by step answer",
    "marks": 8
  }
]

Notes Title: ${noteTitle}
Notes Content: ${text.slice(0, 12000)}`,
          },
        ],
      });

      const content = response.choices[0].message.content;
      const cleaned = content.replace(/```json|```/g, '').trim();
      const questions = JSON.parse(cleaned);
      console.log(`OpenAI generated ${questions.length} questions`);
      return questions;
    } catch (error) {
      console.error('OpenAI quiz error:', error.message);
    }
  }

  // Pro plan — try Claude as fallback
  if (
    process.env.ANTHROPIC_API_KEY &&
    process.env.ANTHROPIC_API_KEY !== 'your_claude_api_key_here'
  ) {
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: `Generate 50 exam questions from notes titled "${noteTitle}".
25 MCQ, 15 Essay, 10 Structural.
Return ONLY a JSON array.
Notes: ${text.slice(0, 12000)}`,
          },
        ],
      });

      const content = message.content[0].text;
      const cleaned = content.replace(/```json|```/g, '').trim();
      const questions = JSON.parse(cleaned);
      console.log(`Claude generated ${questions.length} questions`);
      return questions;
    } catch (error) {
      console.error('Claude quiz error:', error.message);
    }
  }

  // Pro plan but no API key — use 50 placeholders
  return generatePlaceholders(noteTitle, 50);
};

// ── PLACEHOLDER QUESTIONS GENERATOR ──
const generatePlaceholders = (noteTitle, count) => {
  const all = [];

  const mcqData = [
    {
      q: `What is the main topic of "${noteTitle}"?`,
      opts: ['A detailed academic study', 'A personal diary', 'A fiction story', 'A recipe book'],
      ans: 'A detailed academic study',
    },
    {
      q: 'Which study method produces the best long-term retention?',
      opts: ['Active recall through testing', 'Passive re-reading', 'Last minute cramming', 'Highlighting only'],
      ans: 'Active recall through testing',
    },
    {
      q: 'Understanding a concept deeply is better than memorizing it.',
      opts: ['Strongly Agree', 'Disagree', 'Neutral', 'Strongly Disagree'],
      ans: 'Strongly Agree',
    },
    {
      q: 'What does Smart Hub Study help students do?',
      opts: ['Study smarter using AI', 'Play games online', 'Watch movies', 'Browse social media'],
      ans: 'Study smarter using AI',
    },
    {
      q: 'Which payment methods are supported by Smart Hub Study?',
      opts: ['MTN MoMo and Orange Money', 'PayPal only', 'Bitcoin only', 'Cash only'],
      ans: 'MTN MoMo and Orange Money',
    },
    {
      q: 'What is a Progressive Web Application?',
      opts: ['A web app that works offline', 'A programming language', 'A database type', 'An operating system'],
      ans: 'A web app that works offline',
    },
    {
      q: 'Which database is used by Smart Hub Study?',
      opts: ['MongoDB', 'MySQL', 'Oracle', 'Microsoft Access'],
      ans: 'MongoDB',
    },
    {
      q: 'What does OCR stand for?',
      opts: ['Optical Character Recognition', 'Online Course Registration', 'Open Content Repository', 'Organised Reading'],
      ans: 'Optical Character Recognition',
    },
    {
      q: 'How are passwords stored in the database?',
      opts: ['Encrypted with bcrypt', 'In plain text', 'As images', 'Not stored'],
      ans: 'Encrypted with bcrypt',
    },
    {
      q: 'What does the study streak feature track?',
      opts: ['Consecutive days of study', 'Notes deleted', 'Internet speed', 'Login attempts'],
      ans: 'Consecutive days of study',
    },
    {
      q: 'Which frontend framework is used?',
      opts: ['React.js', 'Angular', 'Vue.js', 'Svelte'],
      ans: 'React.js',
    },
    {
      q: 'What does JWT stand for?',
      opts: ['JSON Web Token', 'Java Web Technology', 'JavaScript Wrapper Tool', 'Joint Web Transfer'],
      ans: 'JSON Web Token',
    },
    {
      q: `Which best describes "${noteTitle}"?`,
      opts: ['Academic study material', 'Entertainment content', 'Advertisement', 'Social media post'],
      ans: 'Academic study material',
    },
    {
      q: 'What is the recommended approach when studying notes?',
      opts: ['Deep understanding', 'Surface memorization', 'Speed reading only', 'Skipping difficult parts'],
      ans: 'Deep understanding',
    },
    {
      q: 'What is the main challenge students in Cameroon face?',
      opts: ['Information overload and poor organization', 'Too many apps', 'Too much electricity', 'Too fast internet'],
      ans: 'Information overload and poor organization',
    },
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
    'how this topic connects to other subjects',
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

  // Determine how many of each type to generate
  let mcqCount, essayCount, structuralCount;

  if (count === 5) {
    // Free plan: 3 MCQ, 1 Essay, 1 Structural
    mcqCount = 3;
    essayCount = 1;
    structuralCount = 1;
  } else {
    // Pro plan: 25 MCQ, 15 Essay, 10 Structural
    mcqCount = 25;
    essayCount = 15;
    structuralCount = 10;
  }

  // Add MCQ
  for (let i = 0; i < mcqCount; i++) {
    const item = mcqData[i % mcqData.length];
    all.push({
      question: item.q,
      type: 'mcq',
      options: item.opts,
      correctAnswer: item.ans,
      marks: 2,
    });
  }

  // Add Essay
  for (let i = 0; i < essayCount; i++) {
    const topic = essayTopics[i % essayTopics.length];
    all.push({
      question: `Write a detailed essay discussing the ${topic} covered in "${noteTitle}". Use specific examples.`,
      type: 'essay',
      options: [],
      correctAnswer: `A comprehensive essay covering ${topic} with examples and critical analysis.`,
      marks: 5,
    });
  }

  // Add Structural
  for (let i = 0; i < structuralCount; i++) {
    const topic = structuralTopics[i % structuralTopics.length];
    all.push({
      question: `Using numbered headings, outline ${topic} as presented in "${noteTitle}".`,
      type: 'structural',
      options: [],
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
    if (!noteId) {
      return res.status(400).json({ message: 'Note ID is required' });
    }

    const note = await Note.findOne({ _id: noteId, userId: req.user.id });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check user plan
    const user = await User.findById(req.user.id);
    const isPro = user?.plan === 'pro';

    // Delete existing quiz for fresh generation
    await Quiz.findOneAndDelete({ noteId, userId: req.user.id });

    const questions = await generateQuestions(note.rawText, note.title, isPro);
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
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    let score = 0;
    const gradedAnswers = [];

    quiz.questions.forEach((question, index) => {
      const studentAnswer = answers[index] || '';
      let isCorrect = false;
      let earnedMarks = 0;

      if (question.type === 'mcq') {
        isCorrect =
          studentAnswer.trim().toLowerCase() ===
          question.correctAnswer.trim().toLowerCase();
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

    const lastStreak = userDoc.lastStreakDate
      ? new Date(userDoc.lastStreakDate)
      : null;
    if (lastStreak) lastStreak.setHours(0, 0, 0, 0);

    let newStreak = userDoc.studyStreak || 0;

    if (!lastStreak) {
      newStreak = 1;
    } else if (lastStreak.getTime() === today.getTime()) {
      // Already completed quiz today — keep streak
      newStreak = userDoc.studyStreak;
    } else if (lastStreak.getTime() === yesterday.getTime()) {
      // Completed quiz yesterday — increase streak
      newStreak = userDoc.studyStreak + 1;
    } else {
      // Missed days — reset
      newStreak = 1;
    }

    // Streak badges
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

    // ── UPDATE COMPETITION SCORE ──
    if (userDoc.currentCompetitionId) {
      const { updateScore } = require('./competitionController');
      await updateScore(
        userDoc.currentCompetitionId,
        req.user.id,
        pointsEarned,
        percentage
      );
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
    const result = await Result.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).populate('noteId', 'title');
    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }
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
    const avgScore =
      totalQuizzes > 0
        ? Math.round(
            results.reduce((sum, r) => sum + r.percentage, 0) / totalQuizzes
          )
        : 0;
    const understood = results.filter(r => r.understood).length;
    res.status(200).json({ totalQuizzes, avgScore, understood });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  generateQuiz,
  submitQuiz,
  getResults,
  getResult,
  getStats,
};