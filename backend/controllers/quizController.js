const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const Note = require('../models/Note');
const User = require('../models/User');

// ── GENERATE 50+ QUESTIONS ──
const generateQuestions = async (text, noteTitle) => {

  // Try OpenAI first
  if (process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY !== 'your_openai_key_here') {
    try {
      const OpenAI = require('openai');
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo-16k',
        max_tokens: 8000,
        messages: [
          {
            role: 'system',
            content: `You are an expert academic tutor and examiner creating 
            comprehensive exam questions for university students in Cameroon. 
            Generate questions that test deep understanding not memorization. 
            Ask the same concept in different ways to detect cramming.`
          },
          {
            role: 'user',
            content: `Based on these student notes titled "${noteTitle}", 
generate exactly 50 exam questions:

- 25 Multiple Choice Questions (MCQ) with 4 options each
- 15 Essay questions requiring detailed written responses
- 10 Structural questions requiring step by step answers

Rules:
- All questions must come strictly from the note content
- MCQ options must be plausible and not obvious
- Essay questions must require critical thinking
- Structural questions must require step by step reasoning
- Vary difficulty: 20% easy, 50% medium, 30% hard
- Ask same concepts differently to test true understanding

Return ONLY a valid JSON array with exactly 50 items. No extra text:
[
  {
    "question": "question text here",
    "type": "mcq",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "marks": 2
  },
  {
    "question": "essay question here",
    "type": "essay",
    "options": [],
    "correctAnswer": "detailed expected answer here",
    "marks": 5
  },
  {
    "question": "structural question here",
    "type": "structural",
    "options": [],
    "correctAnswer": "step by step expected answer here",
    "marks": 8
  }
]

Student Notes Title: ${noteTitle}
Student Notes Content:
${text.slice(0, 12000)}`
          }
        ]
      });

      const content = response.choices[0].message.content;
      const cleaned = content.replace(/```json|```/g, '').trim();
      const questions = JSON.parse(cleaned);
      console.log(`Generated ${questions.length} questions successfully!`);
      return questions;

    } catch (error) {
      console.error('OpenAI quiz error:', error.message);
    }
  }

  // Try Claude as fallback
  if (process.env.ANTHROPIC_API_KEY &&
    process.env.ANTHROPIC_API_KEY !== 'your_claude_api_key_here') {
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        messages: [{
          role: 'user',
          content: `Based on these student notes titled "${noteTitle}", 
generate exactly 50 exam questions:
- 25 MCQ with 4 options each
- 15 Essay questions
- 10 Structural questions

Return ONLY a valid JSON array with 50 items:
[
  {
    "question": "question text",
    "type": "mcq",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "A",
    "marks": 2
  }
]

Notes Title: ${noteTitle}
Notes Content: ${text.slice(0, 12000)}`
        }]
      });

      const content = message.content[0].text;
      const cleaned = content.replace(/```json|```/g, '').trim();
      const questions = JSON.parse(cleaned);
      console.log(`Generated ${questions.length} questions via Claude!`);
      return questions;

    } catch (error) {
      console.error('Claude quiz error:', error.message);
    }
  }

  // ── PLACEHOLDER 50 QUESTIONS (no API key) ──
  console.log('No API key found. Using placeholder questions.');
  const placeholders = [];

  const mcqData = [
    {
      q: `What is the main topic discussed in "${noteTitle}"?`,
      opts: ['A detailed academic study', 'A personal diary entry', 'A fiction story', 'A recipe book'],
      ans: 'A detailed academic study'
    },
    {
      q: `Which best describes the purpose of "${noteTitle}"?`,
      opts: ['To inform and educate', 'To entertain readers', 'To advertise a product', 'To tell a story'],
      ans: 'To inform and educate'
    },
    {
      q: 'Which study method produces the best long-term retention?',
      opts: ['Active recall through testing', 'Passive re-reading', 'Last minute cramming', 'Highlighting only'],
      ans: 'Active recall through testing'
    },
    {
      q: 'Understanding a concept deeply is better than memorizing it.',
      opts: ['Strongly Agree', 'Disagree', 'Neutral', 'Strongly Disagree'],
      ans: 'Strongly Agree'
    },
    {
      q: `How should a student approach studying "${noteTitle}"?`,
      opts: ['Read and understand key concepts', 'Memorize word for word', 'Skip difficult sections', 'Read only once quickly'],
      ans: 'Read and understand key concepts'
    },
    {
      q: 'What is the recommended frequency for reviewing study notes?',
      opts: ['Regularly with spaced repetition', 'Only the night before exams', 'Once after class only', 'Never — just listen in class'],
      ans: 'Regularly with spaced repetition'
    },
    {
      q: 'Which of the following is NOT an effective study technique?',
      opts: ['Cramming the night before', 'Practice testing yourself', 'Summarizing in your own words', 'Teaching others the material'],
      ans: 'Cramming the night before'
    },
    {
      q: `What format is the note "${noteTitle}" uploaded in?`,
      opts: ['Digital academic note', 'Personal letter', 'News article', 'Social media post'],
      ans: 'Digital academic note'
    },
    {
      q: 'Which cognitive skill is most important for academic success?',
      opts: ['Critical thinking and analysis', 'Memorization only', 'Speed reading', 'Copying notes verbatim'],
      ans: 'Critical thinking and analysis'
    },
    {
      q: 'What does the Smart Hub Study platform help students do?',
      opts: ['Study smarter using AI', 'Play games online', 'Watch movies', 'Browse social media'],
      ans: 'Study smarter using AI'
    },
    {
      q: 'How many question types are available in Smart Hub Study quizzes?',
      opts: ['3 types: MCQ, Essay, Structural', '1 type: MCQ only', '2 types: MCQ and True/False', '5 types'],
      ans: '3 types: MCQ, Essay, Structural'
    },
    {
      q: 'What is the benefit of the anti-cramming engine in this platform?',
      opts: ['It detects surface memorization vs deep understanding', 'It prevents students from studying', 'It only tests MCQ questions', 'It blocks access to notes'],
      ans: 'It detects surface memorization vs deep understanding'
    },
    {
      q: 'Which African countries primarily use Mobile Money for payments?',
      opts: ['Cameroon and other African nations', 'USA and Canada', 'France and Germany', 'China and Japan'],
      ans: 'Cameroon and other African nations'
    },
    {
      q: 'What does OCR stand for in the context of Smart Hub Study?',
      opts: ['Optical Character Recognition', 'Online Course Registration', 'Open Content Repository', 'Organised Curriculum Reading'],
      ans: 'Optical Character Recognition'
    },
    {
      q: 'What is a Progressive Web Application (PWA)?',
      opts: ['A web app that works offline like a native app', 'A programming language', 'A type of database', 'An operating system'],
      ans: 'A web app that works offline like a native app'
    },
    {
      q: 'Which payment methods are supported by Smart Hub Study?',
      opts: ['MTN Mobile Money and Orange Money', 'PayPal and Credit Card only', 'Bitcoin only', 'Cash only'],
      ans: 'MTN Mobile Money and Orange Money'
    },
    {
      q: 'How does AI summarization help students with 500+ page notes?',
      opts: ['Condenses key information into digestible summaries', 'Deletes unnecessary pages', 'Translates notes to another language', 'Prints notes automatically'],
      ans: 'Condenses key information into digestible summaries'
    },
    {
      q: 'What is the purpose of the Exam Countdown feature?',
      opts: ['Track time remaining and generate a study plan', 'Count how many exams you have failed', 'Block access to social media', 'Notify teachers automatically'],
      ans: 'Track time remaining and generate a study plan'
    },
    {
      q: 'Which database is used by Smart Hub Study to store student data?',
      opts: ['MongoDB', 'MySQL', 'Oracle', 'Microsoft Access'],
      ans: 'MongoDB'
    },
    {
      q: 'What programming language is used for Smart Hub Study backend?',
      opts: ['Node.js with Express', 'Python with Django', 'PHP with Laravel', 'Ruby on Rails'],
      ans: 'Node.js with Express'
    },
    {
      q: 'What is the main challenge students in Cameroon face when studying?',
      opts: ['Information overload and poor note organization', 'Too many study apps available', 'Too much electricity supply', 'Too fast internet connection'],
      ans: 'Information overload and poor note organization'
    },
    {
      q: 'What does JWT stand for in web security?',
      opts: ['JSON Web Token', 'Java Web Technology', 'JavaScript Wrapper Tool', 'Joint Web Transfer'],
      ans: 'JSON Web Token'
    },
    {
      q: 'How are passwords stored in the Smart Hub Study database?',
      opts: ['Encrypted using bcrypt hashing', 'In plain text', 'As images', 'They are not stored'],
      ans: 'Encrypted using bcrypt hashing'
    },
    {
      q: 'What does the study streak feature track?',
      opts: ['Consecutive days of study activity', 'Number of notes deleted', 'Internet connection speed', 'Number of login attempts'],
      ans: 'Consecutive days of study activity'
    },
    {
      q: 'Which frontend framework is used to build Smart Hub Study?',
      opts: ['React.js', 'Angular', 'Vue.js', 'Svelte'],
      ans: 'React.js'
    },
  ];

  // Add 25 MCQ questions
  mcqData.forEach((item, i) => {
    placeholders.push({
      question: item.q,
      type: 'mcq',
      options: item.opts,
      correctAnswer: item.ans,
      marks: 2,
    });
  });

  // Add 15 Essay questions
  const essayTopics = [
    'main concepts and their significance',
    'practical applications of the key ideas',
    'how this topic relates to real-world scenarios in Cameroon',
    'the challenges discussed and proposed solutions',
    'the most important lesson learned from this note',
    'how you would explain this topic to a fellow student',
    'the relationship between the different concepts covered',
    'how understanding this topic will help in your career',
    'the limitations or disadvantages mentioned in the content',
    'how technology is changing this field of study',
    'the historical background of the main topic',
    'future developments expected in this area',
    'how this topic connects to other subjects you study',
    'the ethical considerations related to this topic',
    'your personal reflection on what you learned from this note',
  ];

  essayTopics.forEach((topic, i) => {
    placeholders.push({
      question: `Essay Q${i + 1}: Write a detailed essay discussing the ${topic} covered in "${noteTitle}". Support your answer with specific examples from the note.`,
      type: 'essay',
      options: [],
      correctAnswer: `A comprehensive essay covering ${topic} with relevant examples and critical analysis demonstrating deep understanding of the material.`,
      marks: 5,
    });
  });

  // Add 10 Structural questions
  const structuralTopics = [
    'the step-by-step process described in the note',
    'how to implement the main concept described',
    'the sequence of events or steps outlined',
    'the cause and effect relationships discussed',
    'how to solve a problem using the methods described',
    'the framework or model presented in the notes',
    'how the system or process works from start to finish',
    'the methodology described for achieving the main goal',
    'the procedure for applying the key concept practically',
    'the logical flow of arguments presented in the note',
  ];

  structuralTopics.forEach((topic, i) => {
    placeholders.push({
      question: `Structural Q${i + 1}: Using a clear and numbered structure, outline ${topic} as presented in "${noteTitle}". Your answer must be organized with clear headings and sub-points.`,
      type: 'structural',
      options: [],
      correctAnswer: `A well-structured numbered answer with clear headings covering ${topic} as described in the notes, demonstrating systematic understanding.`,
      marks: 8,
    });
  });

  return placeholders;
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

    // Delete existing quiz for this note so fresh questions are generated
    await Quiz.findOneAndDelete({ noteId, userId: req.user.id });

    const questions = await generateQuestions(note.rawText, note.title);
    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

    const quiz = await Quiz.create({
      noteId,
      userId: req.user.id,
      questions,
      totalMarks,
    });

    console.log(`Quiz created with ${questions.length} questions, ${totalMarks} total marks`);

    res.status(201).json({
      message: `Quiz generated with ${questions.length} questions!`,
      quiz,
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
        isCorrect = studentAnswer.trim().toLowerCase() ===
          question.correctAnswer.trim().toLowerCase();
        earnedMarks = isCorrect ? question.marks : 0;
      } else {
        // Essay and structural — award partial marks for meaningful answers
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
    if (percentage >= 90) feedback = '🏆 Excellent! You have mastered this topic completely!';
    else if (percentage >= 70) feedback = '✅ Good job! You understand this topic well. Keep it up!';
    else if (percentage >= 50) feedback = '⚠️ Fair attempt. Review the weak areas and try again.';
    else if (percentage >= 30) feedback = '📚 You need more study. Go back and review the notes carefully.';
    else feedback = '❌ This topic needs serious attention. Restudy thoroughly before your exam.';

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

    // Update user points and last study date
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { points: Math.floor(score / 10) },
      lastStudyDate: new Date(),
    });

    res.status(201).json({
      message: 'Quiz submitted successfully!',
      result,
    });

  } catch (error) {
    console.error('Submit quiz error:', error.message);
    res.status(500).json({ message: 'Failed to submit quiz. Please try again.' });
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
      userId: req.user.id
    }).populate('noteId', 'title');
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

module.exports = {
  generateQuiz,
  submitQuiz,
  getResults,
  getResult,
  getStats,
};