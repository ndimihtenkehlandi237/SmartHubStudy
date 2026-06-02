import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
  FaArrowLeft, FaTrophy, FaChartBar,
  FaCheckCircle, FaTimesCircle, FaFire, FaStar
} from 'react-icons/fa';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { getToken } from '../services/authService';
import API from '../services/api';

function Results() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    avgScore: 0,
    understood: 0,
  });
  const [selectedResult, setSelectedResult] = useState(null);

  const fetchResults = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [resultsRes, statsRes] = await Promise.all([
        API.get('/api/quiz/results', { headers }),
        API.get('/api/quiz/results/stats', { headers }),
      ]);
      setResults(resultsRes.data.results || []);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to load results');
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

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

  const getScoreGradient = pct => {
    if (pct >= 90) return 'from-green-500 to-emerald-600';
    if (pct >= 70) return 'from-blue-500 to-primary';
    if (pct >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-red-600';
  };

  const chartData = results
    .slice()
    .reverse()
    .slice(-10)
    .map((r, i) => ({
      name: `Q${i + 1}`,
      score: r.percentage,
    }));

  // ── DETAIL VIEW ──
  if (selectedResult) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow-sm px-4 md:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => setSelectedResult(null)}
            className="text-gray-500 hover:text-primary transition"
          >
            <FaArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {t('quizResults')}
            </h1>
            <p className="text-gray-500 text-sm truncate max-w-xs">
              {selectedResult.noteId?.title || 'Unknown Note'}
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-4">

          {/* Score Card */}
          <div className={`bg-white rounded-2xl p-6 shadow-sm border-2 text-center ${getScoreBg(selectedResult.percentage)}`}>
            <FaTrophy className={`text-5xl mx-auto mb-3 ${getScoreColor(selectedResult.percentage)}`} />
            <h2 className={`text-5xl font-black mb-1 ${getScoreColor(selectedResult.percentage)}`}>
              {selectedResult.percentage}%
            </h2>
            <p className="text-gray-600 font-medium">
              {selectedResult.score} / {selectedResult.totalMarks} {t('marksLabel')}
            </p>
            <p className="text-gray-600 mt-2 text-sm">{selectedResult.feedback}</p>
            <div className={`mt-3 inline-block px-4 py-1.5 rounded-full text-sm font-bold ${
              selectedResult.understood
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {selectedResult.understood ? t('topicUnderstood') : t('needsMoreStudy')}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {new Date(selectedResult.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Answer Review */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg mb-4">
              {t('answerReview')}
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedResult.answers.map((ans, i) => (
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

          <button
            onClick={() => navigate('/notes')}
            className="w-full bg-primary hover:bg-secondary text-white font-bold py-3 rounded-xl transition"
          >
            {t('backToNotes')}
          </button>

        </div>
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-white shadow-sm px-4 md:px-8 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-500 hover:text-primary transition"
        >
          <FaArrowLeft className="text-xl" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{t('myResultsTitle')}</h1>
          <p className="text-gray-500 text-sm">
            {results.length} quizzes completed
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center border border-gray-100">
            <FaTrophy className="text-2xl text-yellow-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-800">{stats.totalQuizzes}</p>
            <p className="text-gray-500 text-xs">{t('quizzesDone')}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center border border-gray-100">
            <FaChartBar className="text-2xl text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-800">{stats.avgScore}%</p>
            <p className="text-gray-500 text-xs">{t('averageScore')}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center border border-gray-100">
            <FaStar className="text-2xl text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-800">{stats.understood}</p>
            <p className="text-gray-500 text-xs">Understood</p>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 1 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
              <FaChartBar className="text-primary" />
              {t('performanceTrend')}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip
                  formatter={v => [`${v}%`, t('scoreLabel')]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#2563EB"
                  strokeWidth={3}
                  fill="url(#scoreGrad)"
                  dot={{ fill: '#2563EB', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Results List */}
        {results.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center border border-gray-100">
            <FaTrophy className="text-6xl text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">
              {t('noResultsYet')}
            </h3>
            <p className="text-gray-400 mb-6">{t('takeFirstQuiz')}</p>
            <button
              onClick={() => navigate('/notes')}
              className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-secondary transition"
            >
              Go to My Notes
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map(result => (
              <div
                key={result._id}
                onClick={() => setSelectedResult(result)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-primary transition"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getScoreGradient(result.percentage)} flex items-center justify-center flex-shrink-0`}>
                    <p className="text-white font-black text-sm">
                      {result.percentage}%
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">
                      {result.noteId?.title || 'Unknown Note'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {result.score}/{result.totalMarks} {t('marksLabel')} •{' '}
                      {new Date(result.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs mt-1">
                      {result.understood ? (
                        <span className="text-green-600 font-medium flex items-center gap-1">
                          <FaCheckCircle className="text-xs" />
                          {t('topicUnderstood')}
                        </span>
                      ) : (
                        <span className="text-red-500 font-medium flex items-center gap-1">
                          <FaFire className="text-xs" />
                          {t('needsMoreStudy')}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-gray-300 flex-shrink-0 text-lg">›</div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default Results;