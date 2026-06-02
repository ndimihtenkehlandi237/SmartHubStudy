import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
  FaArrowLeft, FaSpinner, FaCheckCircle,
  FaTimesCircle, FaClock, FaTrophy, FaFire
} from 'react-icons/fa';
import { getToken } from '../services/authService';
import API from '../services/api';

function Quiz() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const noteId = new URLSearchParams(location.search).get('noteId');

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const generateQuiz = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.post(
        '/api/quiz/generate',
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
  }, [noteId, navigate]);

  useEffect(() => {
    if (noteId) {
      generateQuiz();
    } else {
      toast.error('No note selected');
      navigate('/notes');
    }
  }, [noteId, navigate, generateQuiz]);

  useEffect(() => {
    if (quiz && timeLeft === null) {
      setTimeLeft(quiz.questions.length * 60);
    }
  }, [quiz, timeLeft]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || result) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, result]);

  const formatTime = seconds => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleAnswer = value => {
    const updated = [...answers];
    updated[currentQuestion] = value;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await API.post(
        '/api/quiz/submit',
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

  const getScoreColor = pct => {
    if (pct >= 90) return 'text-green-600';
    if (pct >= 70) return 'text-blue-600';
    if (pct >= 50) return 'text-yellow-600';
    return 'text-red-500';
  };

  const getScoreBg = pct => {
    if (pct >= 90) return 'bg-green-50 border-green-200';
    if (pct >= 70) return 'bg-blue-50 border-blue-200';
    if (pct >= 50) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  // ── LOADING ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <FaSpinner className="animate-spin text-primary text-5xl mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800">{t('generatingQuiz')}</h2>
          <p className="text-gray-500 mt-2 text-sm">{t('aiCreating')}</p>
        </div>
      </div>
    );
  }

  // ── RESULTS ──
  if (result) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/notes')}
            className="text-gray-500 hover:text-primary transition"
          >
            <FaArrowLeft className="text-xl" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">{t('quizResults')}</h1>
        </div>

        <div className="p-4 space-y-4 max-w-2xl mx-auto">

          {/* Score Card */}
          <div className={`bg-white rounded-2xl p-6 shadow-sm border-2 text-center ${getScoreBg(result.percentage)}`}>
            <FaTrophy className={`text-5xl mx-auto mb-3 ${getScoreColor(result.percentage)}`} />
            <h2 className={`text-5xl font-black mb-1 ${getScoreColor(result.percentage)}`}>
              {result.percentage}%
            </h2>
            <p className="text-gray-600 font-medium">
              {result.score} / {result.totalMarks} {t('marksLabel')}
            </p>
            <p className="text-gray-600 mt-2 text-sm">{result.feedback}</p>
            <div className={`mt-3 inline-block px-4 py-1.5 rounded-full text-sm font-bold ${
              result.understood
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {result.understood ? t('topicUnderstood') : t('needsMoreStudy')}
            </div>
          </div>

          {/* Answer Review */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg mb-4">{t('answerReview')}</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {result.answers.map((ans, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border text-sm ${
                    ans.isCorrect
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {ans.isCorrect
                      ? <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                      : <FaTimesCircle className="text-red-500 mt-0.5 flex-shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-xs mb-1">
                        {t('questionLabel')}{i + 1}: {ans.question}
                      </p>
                      <p className="text-xs text-gray-600 mb-0.5">
                        <span className="font-semibold">{t('yourAnswer')}:</span>{' '}
                        {ans.studentAnswer || t('noAnswer')}
                      </p>
                      {!ans.isCorrect && (
                        <p className="text-xs text-green-700 mb-0.5">
                          <span className="font-semibold">{t('correctAnswer')}:</span>{' '}
                          {ans.correctAnswer}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {ans.earnedMarks}/{ans.totalMarks} {t('marksLabel')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-3 pb-6">
            <button
              onClick={() => navigate('/notes')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-xl transition text-sm"
            >
              {t('backToNotes')}
            </button>
            <button
              onClick={() => navigate('/results')}
              className="bg-primary hover:bg-secondary text-white font-bold py-3 rounded-xl transition text-sm"
            >
              {t('allResults')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── QUIZ ──
  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const answered = answers.filter(a => a !== '').length;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/notes')}
            className="text-gray-500 hover:text-primary transition"
          >
            <FaArrowLeft />
          </button>
          <div>
            <p className="font-bold text-gray-800 text-sm">
              {t('questionLabel')}{currentQuestion + 1}/{quiz.questions.length}
            </p>
            <p className="text-gray-400 text-xs">
              {answered} {t('answeredLabel')}
            </p>
          </div>
        </div>
        {timeLeft !== null && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-sm ${
            timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
          }`}>
            <FaClock className="text-xs" />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-gray-200">
        <div
          className="h-1.5 bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="flex-1 p-4 flex flex-col max-w-2xl mx-auto w-full">

        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
              question.type === 'mcq'
                ? 'bg-blue-100 text-blue-700'
                : question.type === 'essay'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-orange-100 text-orange-700'
            }`}>
              {question.type === 'mcq'
                ? t('multipleChoice')
                : question.type === 'essay'
                ? t('essayType')
                : t('structuralType')}
            </span>
            <span className="text-xs text-gray-400">
              {question.marks} {t('marksLabel')}
            </span>
            {question.isAntiCramming && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                🧠 Deep Understanding
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-gray-800 leading-relaxed">
            {question.question}
          </h2>
        </div>

        {/* MCQ Options */}
        {question.type === 'mcq' && (
          <div className="space-y-2 mb-4">
            {question.options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(option)}
                className={`w-full text-left p-4 rounded-xl border-2 transition font-medium text-sm ${
                  answers[currentQuestion] === option
                    ? 'border-primary bg-blue-50 text-primary'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-primary'
                }`}
              >
                <span className={`inline-flex w-7 h-7 rounded-full border-2 items-center justify-center text-xs mr-3 flex-shrink-0 ${
                  answers[currentQuestion] === option
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-300 text-gray-500'
                }`}>
                  {String.fromCharCode(65 + i)}
                </span>
                {option}
              </button>
            ))}
          </div>
        )}

        {/* Essay / Structural */}
        {(question.type === 'essay' || question.type === 'structural') && (
          <div className="mb-4 flex-1">
            <textarea
              value={answers[currentQuestion]}
              onChange={e => handleAnswer(e.target.value)}
              placeholder={
                question.type === 'essay'
                  ? t('writeAnswer')
                  : t('writeSteps')
              }
              className="w-full h-40 md:h-48 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 resize-none text-sm bg-white"
            />
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-3 mt-auto">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl transition disabled:opacity-40 text-sm flex-shrink-0"
          >
            {t('prevButton')}
          </button>

          {/* Dot indicators */}
          <div className="hidden sm:flex gap-1 flex-1 justify-center overflow-x-auto">
            {quiz.questions.slice(0, 20).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQuestion(i)}
                className={`w-2.5 h-2.5 rounded-full transition flex-shrink-0 ${
                  i === currentQuestion
                    ? 'bg-primary'
                    : answers[i]
                    ? 'bg-green-400'
                    : 'bg-gray-300'
                }`}
              />
            ))}
            {quiz.questions.length > 20 && (
              <span className="text-xs text-gray-400">...</span>
            )}
          </div>

          {/* Mobile progress */}
          <div className="sm:hidden flex-1 text-center">
            <p className="text-xs text-gray-500 font-medium">
              {answered}/{quiz.questions.length} {t('answeredLabel')}
            </p>
          </div>

          {currentQuestion < quiz.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              className="px-4 py-3 bg-primary text-white font-bold rounded-xl hover:bg-secondary transition text-sm flex-shrink-0"
            >
              {t('nextButton')}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition flex items-center gap-2 text-sm flex-shrink-0"
            >
              {submitting
                ? <FaSpinner className="animate-spin" />
                : <FaFire />
              }
              {submitting ? t('submittingQuiz') : t('submitQuiz')}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

export default Quiz;