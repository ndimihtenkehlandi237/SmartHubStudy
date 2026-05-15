import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaArrowLeft, FaTrophy, FaChartBar, FaCheckCircle,
  FaTimesCircle, FaSpinner, FaCalendar
} from 'react-icons/fa';
import { getToken } from '../services/authService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

function Results() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);
  const [stats, setStats] = useState({ totalQuizzes: 0, avgScore: 0, understood: 0 });

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [resultsRes, statsRes] = await Promise.all([
        axios.get('/api/quiz/results', { headers }),
        axios.get('/api/quiz/results/stats', { headers }),
      ]);
      setResults(resultsRes.data.results);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to load results');
    }
    setLoading(false);
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

  const chartData = results.slice(0, 10).reverse().map((r, i) => ({
    name: `Quiz ${i + 1}`,
    score: r.percentage,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <FaSpinner className="animate-spin text-primary text-4xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-white shadow-sm px-8 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-primary transition">
          <FaArrowLeft className="text-xl" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">My Results</h1>
          <p className="text-gray-500 text-sm">{results.length} quizzes completed</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-8 space-y-6">

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center border border-gray-100">
            <FaTrophy className="text-3xl text-yellow-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-gray-800">{stats.totalQuizzes}</p>
            <p className="text-gray-500 text-sm mt-1">Total Quizzes</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center border border-gray-100">
            <FaChartBar className="text-3xl text-blue-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-gray-800">{stats.avgScore}%</p>
            <p className="text-gray-500 text-sm mt-1">Average Score</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center border border-gray-100">
            <FaCheckCircle className="text-3xl text-green-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-gray-800">{stats.understood}</p>
            <p className="text-gray-500 text-sm mt-1">Topics Understood</p>
          </div>
        </div>

        {/* Performance Chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg mb-4">Performance Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#1a5276"
                  strokeWidth={3}
                  dot={{ fill: '#1a5276', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Results List and Detail */}
        {results.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <FaTrophy className="text-6xl text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">No Results Yet</h3>
            <p className="text-gray-400 mb-6">Take a quiz to see your results here</p>
            <button
              onClick={() => navigate('/notes')}
              className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-secondary transition"
            >
              Go to Notes → Take Quiz
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Results List */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-800 text-lg">Quiz History</h3>
              {results.map((result) => (
                <div
                  key={result._id}
                  onClick={() => setSelectedResult(result)}
                  className={`bg-white rounded-2xl p-4 shadow-sm border-2 cursor-pointer transition ${
                    selectedResult?._id === result._id
                      ? 'border-primary'
                      : 'border-transparent hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                        result.percentage >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {result.percentage}%
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">
                          {result.noteId?.title || 'Unknown Note'}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <FaCalendar className="text-xs" />
                          {new Date(result.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-600">
                        {result.score}/{result.totalMarks} marks
                      </p>
                      <span className={`text-xs font-bold ${
                        result.understood ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {result.understood ? '✅ Understood' : '⚠️ Review'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Result Detail */}
            <div>
              {selectedResult ? (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 text-lg">Result Details</h3>

                  {/* Score Card */}
                  <div className={`rounded-2xl p-6 border-2 text-center ${getScoreBg(selectedResult.percentage)}`}>
                    <FaTrophy className={`text-4xl mx-auto mb-2 ${getScoreColor(selectedResult.percentage)}`} />
                    <p className={`text-4xl font-bold ${getScoreColor(selectedResult.percentage)}`}>
                      {selectedResult.percentage}%
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      {selectedResult.score} / {selectedResult.totalMarks} marks
                    </p>
                    <p className="text-gray-700 mt-2 font-medium text-sm">{selectedResult.feedback}</p>
                    <div className={`mt-3 inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      selectedResult.understood
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedResult.understood ? '✅ Topic Understood!' : '⚠️ Needs More Study'}
                    </div>
                  </div>

                  {/* Answer Breakdown */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm max-h-96 overflow-y-auto">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm">Answer Breakdown</h4>
                    <div className="space-y-2">
                      {selectedResult.answers.map((ans, i) => (
                        <div key={i} className={`p-3 rounded-xl text-xs border ${
                          ans.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-start gap-2">
                            {ans.isCorrect
                              ? <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                              : <FaTimesCircle className="text-red-500 mt-0.5 flex-shrink-0" />
                            }
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 mb-1">Q{i + 1}: {ans.question}</p>
                              <p className="text-gray-600">
                                <span className="font-semibold">Your answer:</span> {ans.studentAnswer || 'No answer'}
                              </p>
                              {!ans.isCorrect && (
                                <p className="text-green-700 mt-0.5">
                                  <span className="font-semibold">Correct:</span> {ans.correctAnswer}
                                </p>
                              )}
                              <p className="text-gray-400 mt-0.5">
                                {ans.earnedMarks}/{ans.totalMarks} marks
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 shadow-sm text-center border border-gray-100">
                  <FaChartBar className="text-5xl text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Select a result to view details</p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default Results;