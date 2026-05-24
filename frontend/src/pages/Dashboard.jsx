import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaBookOpen, FaUpload, FaStickyNote, FaQuestionCircle,
  FaChartBar, FaUser, FaBell, FaSignOutAlt, FaFire,
  FaStar, FaTrophy, FaClock, FaSpinner, FaCalculator,
  FaUsers, FaCreditCard, FaLock, FaMedal
} from 'react-icons/fa';
import { getUser, logout, getToken } from '../services/authService';
import API from '../services/api';
import quotes from '../data/quotes';

function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentNotes, setRecentNotes] = useState([]);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [stats, setStats] = useState({
    totalNotes: 0,
    totalQuizzes: 0,
    avgScore: 0,
    studyStreak: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [subjectsRes, notesRes, quizStatsRes] = await Promise.all([
        API.get('/api/notes/subjects', { headers }),
        API.get('/api/notes', { headers }),
        API.get('/api/quiz/results/stats', { headers }),
      ]);
      setSubjects(subjectsRes.data.subjects);
      setRecentNotes(notesRes.data.notes.slice(0, 5));
      const freshUser = getUser();
      setStats({
        totalNotes: notesRes.data.notes.length,
        totalQuizzes: quizStatsRes.data.totalQuizzes,
        avgScore: quizStatsRes.data.avgScore,
        studyStreak: freshUser?.studyStreak || 0,
      });
    } catch (error) {
      console.error('Dashboard fetch error:', error.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const userData = getUser();
    if (!userData) {
      navigate('/');
      return;
    }
    setUser(userData);
    fetchDashboardData();
  }, [navigate, fetchDashboardData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentQuote(prev => (prev + 1) % quotes.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isPro = user?.plan === 'pro';

  const getStreakMessage = () => {
    if (stats.studyStreak === 0) return t('startStreak');
    if (stats.studyStreak === 1) return t('streak1');
    if (stats.studyStreak < 7) return `${stats.studyStreak} ${t('streakFire')}`;
    if (stats.studyStreak < 14) return `${stats.studyStreak} ${t('streakIncredible')}`;
    return `${stats.studyStreak} ${t('streakUnstoppable')}`;
  };

  const subjectColors = [
    'border-blue-500', 'border-green-500', 'border-purple-500',
    'border-orange-500', 'border-red-500', 'border-yellow-500',
  ];

  const menuItems = [
    { id: 'dashboard', icon: <FaChartBar />, label: t('dashboard'), path: '/dashboard', pro: false },
    { id: 'upload', icon: <FaUpload />, label: t('uploadNotes'), path: '/upload', pro: false },
    { id: 'notes', icon: <FaStickyNote />, label: t('myNotes'), path: '/notes', pro: false },
    { id: 'quiz', icon: <FaQuestionCircle />, label: t('takeQuiz'), path: '/notes', pro: false },
    { id: 'results', icon: <FaTrophy />, label: t('myResults'), path: '/results', pro: false },
    { id: 'competition', icon: <FaMedal />, label: t('weeklyCompetition'), path: '/competition', pro: false },
    { id: 'math-solver', icon: <FaCalculator />, label: t('mathSolver'), path: '/math-solver', pro: true },
    { id: 'study-groups', icon: <FaUsers />, label: t('studyGroups'), path: '/study-groups', pro: false },
    { id: 'exam-countdown', icon: <FaClock />, label: t('examCountdown'), path: '/exam-countdown', pro: false },
    { id: 'payment', icon: <FaCreditCard />, label: t('upgradePro'), path: '/payment', pro: false },
    { id: 'profile', icon: <FaUser />, label: t('profile'), path: '/profile', pro: false },
  ];

  const statCards = [
    {
      label: t('notesUploaded'),
      value: stats.totalNotes,
      icon: <FaStickyNote />,
      color: 'bg-blue-500',
      onClick: () => navigate('/notes'),
    },
    {
      label: t('quizzesTaken'),
      value: stats.totalQuizzes,
      icon: <FaQuestionCircle />,
      color: 'bg-green-500',
      onClick: () => navigate('/results'),
    },
    {
      label: t('averageScore'),
      value: `${stats.avgScore}%`,
      icon: <FaChartBar />,
      color: 'bg-purple-500',
      onClick: () => navigate('/results'),
    },
    {
      label: t('studyStreak'),
      value: `${stats.studyStreak} ${stats.studyStreak === 1 ? t('day') : t('days')}`,
      icon: <FaFire />,
      color: stats.studyStreak >= 7
        ? 'bg-orange-500'
        : stats.studyStreak >= 3
        ? 'bg-yellow-500'
        : 'bg-gray-400',
      onClick: null,
    },
  ];

  const mobileActions = [
    { label: t('uploadNotes'), icon: <FaUpload />, path: '/upload', color: 'bg-blue-500', locked: false },
    { label: t('myNotes'), icon: <FaStickyNote />, path: '/notes', color: 'bg-indigo-500', locked: false },
    { label: t('takeQuiz'), icon: <FaQuestionCircle />, path: '/notes', color: 'bg-green-500', locked: false },
    { label: t('myResults'), icon: <FaTrophy />, path: '/results', color: 'bg-orange-500', locked: false },
    { label: t('mathSolver'), icon: <FaCalculator />, path: isPro ? '/math-solver' : '/payment', color: 'bg-purple-500', locked: !isPro },
    { label: t('studyGroups'), icon: <FaUsers />, path: '/study-groups', color: 'bg-pink-500', locked: false },
    { label: t('examCountdown'), icon: <FaClock />, path: '/exam-countdown', color: 'bg-red-500', locked: false },
    { label: t('profile'), icon: <FaUser />, path: '/profile', color: 'bg-gray-500', locked: false },
    { label: t('upgradePro'), icon: <FaCreditCard />, path: '/payment', color: 'bg-yellow-500', locked: false },
  ];
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-primary text-4xl mx-auto mb-3" />
          <p className="text-gray-500 text-sm">{t('loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* SIDEBAR Desktop */}
      <div className="hidden md:flex w-64 bg-primary min-h-screen flex-col shadow-2xl fixed left-0 top-0 bottom-0 z-10">

        <div className="p-4 border-b border-blue-700">
          <div className="flex items-center gap-3">
            <div className="bg-white w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0">
              <FaBookOpen className="text-primary text-base" />
            </div>
            <div className="min-w-0">
              <h1 className="text-white font-bold text-sm">{t('appName')}</h1>
              <p className="text-blue-300 text-xs">Student Portal</p>
            </div>
          </div>
        </div>

        <div className="p-3 border-b border-blue-700">
          <div className="flex items-center gap-3">
            <div className="bg-accent w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0">
              <FaUser className="text-white text-sm" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {user?.fullName?.split(' ')[0] || 'Student'}
              </p>
              <p className="text-blue-300 text-xs">
                {isPro ? `⭐ ${t('proPlan')}` : `🆓 ${t('freePlan')}`}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                if (item.pro && !isPro) {
                  navigate('/payment');
                } else {
                  setActiveMenu(item.id);
                  navigate(item.path);
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition duration-200 text-sm font-medium ${
                activeMenu === item.id
                  ? 'bg-white text-primary shadow-lg'
                  : 'text-blue-200 hover:bg-blue-700 hover:text-white'
              } ${item.id === 'payment' ? 'mt-2 border border-yellow-400 border-opacity-40' : ''}`}
            >
              <span className="text-sm flex-shrink-0">{item.icon}</span>
              <span className="truncate flex-1 text-left">{item.label}</span>
              {item.pro && !isPro && (
                <FaLock className="text-yellow-400 text-xs flex-shrink-0" />
              )}
              {item.id === 'payment' && !isPro && (
                <span className="text-xs bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                  PRO
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-blue-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-blue-200 hover:bg-red-600 hover:text-white transition text-sm font-medium"
          >
            <FaSignOutAlt className="flex-shrink-0" />
            {t('signOut')}
          </button>
        </div>
      </div>
      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col md:ml-64">

        {/* Top Bar */}
        <div className="bg-white shadow-sm px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-base md:text-lg font-bold text-gray-800">
              {t('hey')}, {user?.fullName?.split(' ')[0] || 'Student'}! 👋
            </h2>
            <p className="text-gray-500 text-xs">{getStreakMessage()}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 text-gray-500 hover:text-primary transition">
              <FaBell className="text-lg" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button
              onClick={handleLogout}
              className="md:hidden p-2 text-gray-500 hover:text-red-500 transition"
            >
              <FaSignOutAlt className="text-lg" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8 space-y-4 md:space-y-6 pb-8">

          {/* Motivational Banner */}
          <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-4 md:p-6 text-white shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-bold mb-2">
                  🎓 {t('keepPushing')}
                </h3>
                <p className="text-blue-100 text-xs md:text-sm italic leading-relaxed">
                  "{quotes[currentQuote]}"
                </p>
                <div className="flex gap-1 mt-3">
                  {[0, 1, 2, 3, 4].map(i => (
                    <button
                      key={i}
                      onClick={() => setCurrentQuote(i)}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        i === currentQuote % 5
                          ? 'w-5 bg-white'
                          : 'w-1.5 bg-white opacity-40'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0 text-center">
                <FaStar className="text-yellow-300 text-2xl md:text-4xl opacity-60" />
                {stats.studyStreak > 0 && (
                  <div className="mt-1">
                    <p className="text-orange-300 text-base font-black">
                      🔥 {stats.studyStreak}
                    </p>
                    <p className="text-blue-200 text-xs">{t('studyStreak')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statCards.map((stat, i) => (
              <div
                key={i}
                onClick={stat.onClick || undefined}
                className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${
                  stat.onClick
                    ? 'cursor-pointer hover:shadow-md active:scale-95 transition'
                    : ''
                }`}
              >
                <div className={`${stat.color} w-9 h-9 rounded-xl flex items-center justify-center text-white mb-2`}>
                  {stat.icon}
                </div>
                <p className="text-xl md:text-2xl font-bold text-gray-800">
                  {stat.value}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Streak Banner */}
          {stats.studyStreak > 0 && (
            <div className={`rounded-2xl p-4 flex items-center gap-4 ${
              stats.studyStreak >= 7
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                : 'bg-orange-50 border border-orange-200'
            }`}>
              <span className="text-3xl flex-shrink-0">🔥</span>
              <div className="min-w-0">
                <p className={`font-bold text-base ${
                  stats.studyStreak >= 7 ? 'text-white' : 'text-orange-700'
                }`}>
                  {stats.studyStreak} {stats.studyStreak === 1 ? t('day') : t('days')} {t('studyStreak')}!
                </p>
                <p className={`text-sm ${
                  stats.studyStreak >= 7 ? 'text-orange-100' : 'text-orange-500'
                }`}>
                  {stats.studyStreak >= 30
                    ? '👑 Legendary! 30+ days!'
                    : stats.studyStreak >= 14
                    ? '🏆 Amazing! 2 full weeks!'
                    : stats.studyStreak >= 7
                    ? '⭐ Fantastic! One full week!'
                    : `${7 - stats.studyStreak} more days to 7-day badge!`}
                </p>
              </div>
            </div>
          )}

          {/* Upgrade Banner */}
          {!isPro && (
            <div
              onClick={() => navigate('/payment')}
              className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:shadow-lg transition"
            >
              <div className="min-w-0">
                <p className="font-bold text-white text-sm md:text-base">
                  🚀 {t('upgradePro')}
                </p>
                <p className="text-yellow-100 text-xs mt-0.5">
                  {t('unlockFeatures')}
                </p>
              </div>
              <div className="bg-white text-orange-500 font-bold text-xs px-3 py-1.5 rounded-xl flex-shrink-0 ml-3 whitespace-nowrap">
                2,000 FCFA
              </div>
            </div>
          )}

          {/* Mobile Quick Actions */}
          <div className="md:hidden bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">
              {t('quickActions')}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {mobileActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 active:scale-95 transition"
                >
                  <div className={`${action.color} w-10 h-10 rounded-xl flex items-center justify-center shadow-sm relative`}>
                    <span className="text-white text-sm">{action.icon}</span>
                    {action.locked && (
                      <div className="absolute -top-1 -right-1 bg-yellow-400 w-4 h-4 rounded-full flex items-center justify-center">
                        <FaLock style={{ fontSize: 8 }} className="text-yellow-900" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 font-medium text-center leading-tight">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Two Columns */}
          <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* My Subjects */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 text-lg">
                  {t('mySubjects')}
                </h3>
                <button
                  onClick={() => navigate('/upload')}
                  className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-secondary transition"
                >
                  {t('addNotes')}
                </button>
              </div>
              {subjects.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FaBookOpen className="text-3xl mx-auto mb-2 opacity-30" />
                  <p className="text-sm mb-3">{t('noSubjectsYet')}</p>
                  <button
                    onClick={() => navigate('/upload')}
                    className="text-xs bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition"
                  >
                    {t('uploadFirst')}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {subjects.map((sub, i) => (
                    <div
                      key={sub._id}
                      onClick={() => navigate('/notes')}
                      className={`flex items-center justify-between p-3 rounded-xl border-l-4 ${
                        subjectColors[i % subjectColors.length]
                      } bg-gray-50 cursor-pointer hover:bg-gray-100 transition`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FaBookOpen className="text-gray-400 text-sm flex-shrink-0" />
                        <span className="font-medium text-gray-700 text-sm truncate">
                          {sub.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full flex-shrink-0">
                        {sub.noteCount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Quick Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 text-lg mb-4">
                {t('quickActions')}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t('uploadNotes'), icon: <FaUpload />, path: '/upload', color: 'bg-blue-500', bg: 'bg-blue-50 hover:bg-blue-100' },
                  { label: t('takeQuiz'), icon: <FaQuestionCircle />, path: '/notes', color: 'bg-green-500', bg: 'bg-green-50 hover:bg-green-100' },
                  { label: t('examCountdown'), icon: <FaClock />, path: '/exam-countdown', color: 'bg-purple-500', bg: 'bg-purple-50 hover:bg-purple-100' },
                  { label: t('myResults'), icon: <FaTrophy />, path: '/results', color: 'bg-orange-500', bg: 'bg-orange-50 hover:bg-orange-100' },
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(action.path)}
                    className={`flex flex-col items-center gap-2 p-4 ${action.bg} rounded-xl transition group`}
                  >
                    <div className={`${action.color} w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition`}>
                      <span className="text-white">{action.icon}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-700">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Notes */}
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-base md:text-lg">
                {t('recentNotes')}
              </h3>
              <button
                onClick={() => navigate('/notes')}
                className="text-xs text-secondary hover:underline font-medium"
              >
                {t('viewAll')} →
              </button>
            </div>
            {recentNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <FaClock className="text-4xl mb-3 opacity-30" />
                <p className="text-sm text-center">{t('noNotesYet')}</p>
                <button
                  onClick={() => navigate('/upload')}
                  className="mt-4 bg-primary text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-secondary transition"
                >
                  {t('uploadNotesNow')}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentNotes.map(note => (
                  <div
                    key={note._id}
                    onClick={() => navigate('/notes')}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FaStickyNote className="text-white text-xs" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-700 text-sm truncate">
                          {note.title}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {note.subjectId?.name || 'Unknown'} •{' '}
                          {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/quiz?noteId=${note._id}`);
                      }}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200 transition font-medium flex-shrink-0 ml-2"
                    >
                      {t('takeQuiz')} →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default Dashboard;