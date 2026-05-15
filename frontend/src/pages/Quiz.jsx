import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaArrowLeft, FaSpinner, FaCheckCircle,
  FaTimesCircle, FaClock, FaTrophy
} from 'react-icons/fa';
import { getToken } from '../services/authService';
import axios from 'axios';

function Quiz() {
  const navigate = useNavigate();
  const location = useLocation();
  const noteId = new URLSearchParams(location.search).get('noteId');

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (noteId) generateQuiz();
    else {
      toast.error('No note selected for quiz');
      navigate('/notes');
    }
  }, [noteId]);

  useEffect(() => {
    if (quiz && timeLeft === null) {
      setTimeLeft(quiz.questions.length * 60);
    }
  }, [quiz]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || result) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, result]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const generateQuiz = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/quiz/generate',
        { noteId },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setQuiz(res.data.quiz);
      setAnswers(new Array(res.data.quiz.questions.length).fill(''));
    } catch (error) {
      toast.error('Failed to generate quiz');
      navigate('/notes');
    }
    setLoading(false);
  };

  const handleAnswer = (value) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post('/api/quiz/submit',
        { quizId: quiz._id, noteId, answers },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setResult(res.data.result);
      toast.success('Quiz submitted! 🎉');
    } catch (error) {
      toast.error('Failed to submit quiz');
    }
    setSubmitting(false);
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (percentage) => {
    if (percentage >= 90) return 'bg-green-50 border-green-200';
    if (percentage >= 70) return 'bg-blue-50 border-blue-200';
    if (percentage >= 50) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-primary text-5xl mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800">Generating Your Quiz...</h2>
          <p className="text-gray-500 mt-2">AI is creating questions from your notes</p>
        </div>
      </div>
    );
  }

  // RESULT SCREEN
  if (result) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow-sm px-8 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/notes')} className="text-gray-500 hover:text-primary transition">
            <FaArrowLeft className="text-xl" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Quiz Results</h1>
        </div>

        <div className="max-w-3xl mx-auto p-8 space-y-6">

          {/* Score Card */}
          <div className={`bg-white rounded-2xl p-8 shadow-sm border-2 text-center ${getScoreBg(result.percentage)}`}>
            <FaTrophy className={`text-6xl mx-auto mb-4 ${getScoreColor(result.percentage)}`} />
            <h2 className="text-4xl font-bold text-gray-800 mb-2">
              {result.percentage}%
            </h2>
            <p className={`text-xl font-semibold mb-2 ${getScoreColor(result.percentage)}`}>
              {result.score} / {result.totalMarks} marks
            </p>
            <p className="text-gray-600 text-lg">{result.feedback}</p>
            <div className={`mt-4 inline-block px-4 py-2 rounded-full text-sm font-bold ${
              result.understood
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {result.understood ? '✅ Topic Understood!' : '⚠️ Needs More Study'}
            </div>
          </div>

          {/* Answer Review */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 text-lg mb-4">Answer Review</h3>
            <div className="space-y-4">
              {result.answers.map((ans, i) => (
                <div key={i} className={`p-4 rounded-xl border ${
                  ans.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {ans.isCorrect
                      ? <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                      : <FaTimesCircle className="text-red-500 mt-1 flex-shrink-0" />
                    }
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm mb-2">
                        Q{i + 1}: {ans.question}
                      </p>
                      <p className="text-xs text-gray-600 mb-1">
                        <span className="font-semibold">Your answer:</span> {ans.studentAnswer || 'No answer'}
                      </p>
                      {!ans.isCorrect && (
                        <p className="text-xs text-green-700">
                          <span className="font-semibold">Correct answer:</span> {ans.correctAnswer}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {ans.earnedMarks}/{ans.totalMarks} marks
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/notes')}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-xl transition"
            >
              Back to Notes
            </button>
            <button
              onClick={() => navigate('/results')}
              className="flex-1 bg-primary hover:bg-secondary text-white font-bold py-3 rounded-xl transition"
            >
              View All Results
            </button>
          </div>

        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-white shadow-sm px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/notes')} className="text-gray-500 hover:text-primary transition">
            <FaArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Quiz Time!</h1>
            <p className="text-gray-500 text-sm">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </p>
          </div>
        </div>
        {timeLeft !== null && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold ${
            timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
          }`}>
            <FaClock />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="h-2 bg-gray-200">
          <div
            className="h-2 bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-8">

        {/* Question Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">

          {/* Question Type Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
              question.type === 'mcq'
                ? 'bg-blue-100 text-blue-700'
                : question.type === 'essay'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-orange-100 text-orange-700'
            }`}>
              {question.type === 'mcq' ? 'Multiple Choice'
                : question.type === 'essay' ? 'Essay'
                : 'Structural'}
            </span>
            <span className="text-xs text-gray-400">{question.marks} marks</span>
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-6 leading-relaxed">
            {question.question}
          </h2>

          {/* MCQ Options */}
          {question.type === 'mcq' && (
            <div className="space-y-3">
              {question.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(option)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition font-medium ${
                    answers[currentQuestion] === option
                      ? 'border-primary bg-blue-50 text-primary'
                      : 'border-gray-200 text-gray-700 hover:border-primary hover:bg-blue-50'
                  }`}
                >
                  <span className="inline-block w-7 h-7 rounded-full border-2 border-current text-center text-sm leading-6 mr-3">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* Essay / Structural */}
          {(question.type === 'essay' || question.type === 'structural') && (
            <textarea
              value={answers[currentQuestion]}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder={
                question.type === 'essay'
                  ? 'Write your essay answer here...'
                  : 'Write your structured answer here step by step...'
              }
              rows={8}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 resize-none"
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-primary transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <div className="flex gap-1">
            {quiz.questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQuestion(i)}
                className={`w-3 h-3 rounded-full transition ${
                  i === currentQuestion
                    ? 'bg-primary'
                    : answers[i]
                    ? 'bg-green-400'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentQuestion < quiz.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-secondary transition"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition flex items-center gap-2"
            >
              {submitting ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

export default Quiz;