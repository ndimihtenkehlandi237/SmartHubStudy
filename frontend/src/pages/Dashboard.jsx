import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaBookOpen, FaUpload, FaStickyNote, FaQuestionCircle,
  FaChartBar, FaUser, FaBell, FaSignOutAlt, FaFire,
  FaStar, FaTrophy, FaClock, FaCalculator,
  FaUsers, FaCreditCard, FaLock, FaMedal
} from 'react-icons/fa';
import { getUser, logout, getToken } from '../services/authService';
import API from '../services/api';
import quotes from '../data/quotes';

function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const storedUser = getUser();
  const isPro = storedUser?.plan === 'pro';

  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [subjects, setSubjects] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [stats, setStats] = useState({
    totalNotes: 0,
    totalQuizzes: 0,
    avgScore: 0,
    studyStreak: storedUser?.studyStreak || 0,
  });
  const [dataLoaded, setDataLoaded] = useState(false);

  const fetchData = useCallback(async () => {
    if (dataLoaded) return;
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [s, n, q] = await Promise.all([
        API.get('/api/notes/subjects', { headers }),
        API.get('/api/notes', { headers }),
        API.get('/api/quiz/results/stats', { headers }),
      ]);
      setSubjects(s.data.subjects || []);
      setRecentNotes((n.data.notes || []).slice(0, 5));
      setStats({
        totalNotes: n.data.notes.length,
        totalQuizzes: q.data.totalQuizzes || 0,
        avgScore: q.data.avgScore || 0,
        studyStreak: getUser()?.studyStreak || 0,
      });
      setDataLoaded(true);
    } catch (e) {
      console.error('Dashboard fetch error:', e.message);
    }
  }, [dataLoaded]);

  useEffect(() => {
    if (!storedUser) { navigate('/'); return; }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setInterval(
      () => setCurrentQuote(p => (p + 1) % quotes.length),
      10000
    );
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const subjectColors = [
    'border-blue-500', 'border-green-500', 'border-purple-500',
    'border-orange-500', 'border-red-500', 'border-yellow-500',
  ];

  const menuItems = [
    { id: 'dashboard', icon: <FaChartBar />, label: t('dashboard'), path: '/dashboard' },
    { id: 'upload', icon: <FaUpload />, label: t('uploadNotes'), path: '/upload' },
    { id: 'notes', icon: <FaStickyNote />, label: t('myNotes'), path: '/notes' },
    { id: 'quiz', icon: <FaQuestionCircle />, label: t('takeQuiz'), path: '/notes' },
    { id: 'results', icon: <FaTrophy />, label: t('myResults'), path: '/results' },
    { id: 'competition', icon: <FaMedal />, label: t('weeklyCompetition'), path: '/competition' },
    { id: 'math', icon: <FaCalculator />, label: t('mathSolver'), path: '/math-solver', pro: true },
    { id: 'groups', icon: <FaUsers />, label: t('studyGroups'), path: '/study-groups' },
    { id: 'countdown', icon: <FaClock />, label: t('examCountdown'), path: '/exam-countdown' },
    { id: 'payment', icon: <FaCreditCard />, label: t('upgradePro'), path: '/payment' },
    { id: 'profile', icon: <FaUser />, label: t('profile'), path: '/profile' },
  ];

  const statCards = [
    {
      label: t('notesUploaded'),
      value: stats.totalNotes,
      icon: <FaStickyNote />,
      color: 'bg-blue-500',
      to: '/notes',
    },
    {
      label: t('quizzesTaken'),
      value: stats.totalQuizzes,
      icon: <FaQuestionCircle />,
      color: 'bg-green-500',
      to: '/results',
    },
    {
      label: t('averageScore'),
      value: `${stats.avgScore}%`,
      icon: <FaChartBar />,
      color: 'bg-purple-500',
      to: '/results',
    },
    {
      label: t('studyStreak'),
      value: `${stats.studyStreak} ${stats.studyStreak === 1 ? t('day') : t('days')}`,
      icon: <FaFire />,
      color: stats.studyStreak >= 7 ? 'bg-orange-500' : 'bg-gray-400',
      to: null,
    },
  ];

  const mobileActions = [
    { label: t('uploadNotes'), icon: <FaUpload />, path: '/upload', color: 'bg-blue-500' },
    { label: t('myNotes'), icon: <FaStickyNote />, path: '/notes', color: 'bg-indigo-500' },
    { label: t('takeQuiz'), icon: <FaQuestionCircle />, path: '/notes', color: 'bg-green-500' },
    { label: t('myResults'), icon: <FaTrophy />, path: '/results', color: 'bg-orange-500' },
    { label: t('mathSolver'), icon: <FaCalculator />, path: isPro ? '/math-solver' : '/payment', color: 'bg-purple-500', locked: !isPro },
    { label: t('studyGroups'), icon: <FaUsers />, path: '/study-groups', color: 'bg-pink-500' },
    { label: t('examCountdown'), icon: <FaClock />, path: '/exam-countdown', color: 'bg-red-500' },
    { label: t('profile'), icon: <FaUser />, path: '/profile', color: 'bg-gray-500' },
    { label: t('upgradePro'), icon: <FaCreditCard />, path: '/payment', color: 'bg-yellow-500' },
  ];

  const getStreakMsg = () => {
    const s = stats.studyStreak;
    if (s === 0) return t('startStreak');
    if (s === 1) return t('streak1');
    if (s < 7) return `${s} ${t('streakFire')}`;
    if (s < 14) return `${s} ${t('streakIncredible')}`;
    return `${s} ${t('streakUnstoppable')}`;
  };

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* SIDEBAR desktop */}
      <aside className="hidden md:flex w-64 bg-primary min-h-screen flex-col shadow-2xl fixed left-0 top-0 bottom-0 z-10">

        <div className="p-4 border-b border-blue-700 flex items-center gap-3">
          <div className="bg-white w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0">
            <FaBookOpen className="text-primary" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Smart Hub Study</p>
            <p className="text-blue-300 text-xs">Student Portal</p>
          </div>
        </div>

        <div className="p-3 border-b border-blue-700 flex items-center gap-3">
          <div className="bg-blue-600 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0">
            <FaUser className="text-white text-sm" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {storedUser?.fullName?.split(' ')[0] || 'Student'}
            </p>
            <p className="text-blue-300 text-xs">
              {isPro ? '⭐ Pro' : '🆓 Free'}
            </p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                if (item.pro && !isPro) navigate('/payment');
                else { setActiveMenu(item.id); navigate(item.path); }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                activeMenu === item.id
                  ? 'bg-white text-primary shadow'
                  : 'text-blue-200 hover:bg-blue-700 hover:text-white'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="truncate flex-1 text-left">{item.label}</span>
              {item.pro && !isPro && <FaLock className="text-yellow-400 text-xs" />}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-blue-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-blue-200 hover:bg-red-600 hover:text-white transition text-sm"
          >
            <FaSignOutAlt />
            {t('signOut')}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col md:ml-64">

        {/* Top bar */}
        <header className="bg-white shadow-sm px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-10">
          <div>
            <p className="font-bold text-gray-800 text-base md:text-lg">
              {t('hey')}, {storedUser?.fullName?.split(' ')[0] || 'Student'}! 👋
            </p>
            <p className="text-gray-500 text-xs">{getStreakMsg()}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 text-gray-500">
              <FaBell className="text-lg" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button
              onClick={handleLogout}
              className="md:hidden p-2 text-gray-500"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-4 pb-8">

          {/* Quote banner */}
          <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-4 md:p-6 text-white shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm md:text-base mb-1">
                  🎓 {t('keepPushing')}
                </p>
                <p className="text-blue-100 text-xs md:text-sm italic">
                  "{quotes[currentQuote]}"
                </p>
                <div className="flex gap-1 mt-3">
                  {[0, 1, 2, 3, 4].map(i => (
                    <button
                      key={i}
                      onClick={() => setCurrentQuote(i)}
                      className={`h-1 rounded-full transition-all ${
                        i === currentQuote % 5
                          ? 'w-5 bg-white'
                          : 'w-1.5 bg-white opacity-40'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-center flex-shrink-0">
                <FaStar className="text-yellow-300 text-3xl opacity-60" />
                {stats.studyStreak > 0 && (
                  <div className="mt-1">
                    <p className="text-orange-300 font-black">
                      🔥{stats.studyStreak}
                    </p>
                    <p className="text-blue-200 text-xs">{t('studyStreak')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statCards.map((s, i) => (
              <div
                key={i}
                onClick={s.to ? () => navigate(s.to) : undefined}
                className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${
                  s.to ? 'cursor-pointer hover:shadow-md transition' : ''
                }`}
              >
                <div className={`${s.color} w-9 h-9 rounded-xl flex items-center justify-center text-white mb-2`}>
                  {s.icon}
                </div>
                <p className="text-xl font-bold text-gray-800">{s.value}</p>
                <p className="text-gray-500 text-xs">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Streak banner */}
          {stats.studyStreak > 0 && (
            <div className={`rounded-2xl p-4 flex items-center gap-3 ${
              stats.studyStreak >= 7
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                : 'bg-orange-50 border border-orange-200'
            }`}>
              <span className="text-2xl">🔥</span>
              <div>
                <p className={`font-bold ${
                  stats.studyStreak >= 7 ? 'text-white' : 'text-orange-700'
                }`}>
                  {stats.studyStreak} {stats.studyStreak === 1 ? t('day') : t('days')} {t('studyStreak')}!
                </p>
                <p className={`text-sm ${
                  stats.studyStreak >= 7 ? 'text-orange-100' : 'text-orange-500'
                }`}>
                  {stats.studyStreak >= 7
                    ? '⭐ Keep it up!'
                    : `${7 - stats.studyStreak} more days to 7-day badge!`}
                </p>
              </div>
            </div>
          )}

          {/* Upgrade banner */}
          {!isPro && (
            <div
              onClick={() => navigate('/payment')}
              className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:shadow-lg transition"
            >
              <div>
                <p className="font-bold text-white">🚀 {t('upgradePro')}</p>
                <p className="text-yellow-100 text-xs mt-0.5">
                  {t('unlockFeatures')}
                </p>
              </div>
              <span className="bg-white text-orange-500 font-bold text-xs px-3 py-1.5 rounded-xl ml-3 flex-shrink-0">
                2,000 FCFA
              </span>
            </div>
          )}

          {/* Mobile quick actions */}
          <div className="md:hidden bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="font-bold text-gray-800 mb-3 text-sm">
              {t('quickActions')}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {mobileActions.map((a, i) => (
                <button
                  key={i}
                  onClick={() => navigate(a.path)}
                  className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-xl active:scale-95 transition"
                >
                  <div className={`${a.color} w-10 h-10 rounded-xl flex items-center justify-center relative`}>
                    <span className="text-white text-sm">{a.icon}</span>
                    {a.locked && (
                      <div className="absolute -top-1 -right-1 bg-yellow-400 w-4 h-4 rounded-full flex items-center justify-center">
                        <FaLock style={{ fontSize: 7 }} className="text-yellow-900" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 font-medium text-center leading-tight">
                    {a.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Desktop 2 columns */}
          <div className="hidden md:grid grid-cols-2 gap-6">

            {/* Subjects */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-gray-800 text-lg">{t('mySubjects')}</p>
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
                  <p className="text-sm">{t('noSubjectsYet')}</p>
                  <button
                    onClick={() => navigate('/upload')}
                    className="mt-3 text-xs bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition"
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
                      <div className="flex items-center gap-2 min-w-0">
                        <FaBookOpen className="text-gray-400 text-sm flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700 truncate">
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

            {/* Quick actions desktop */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="font-bold text-gray-800 text-lg mb-4">
                {t('quickActions')}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t('uploadNotes'), icon: <FaUpload />, path: '/upload', color: 'bg-blue-500', bg: 'bg-blue-50 hover:bg-blue-100' },
                  { label: t('takeQuiz'), icon: <FaQuestionCircle />, path: '/notes', color: 'bg-green-500', bg: 'bg-green-50 hover:bg-green-100' },
                  { label: t('examCountdown'), icon: <FaClock />, path: '/exam-countdown', color: 'bg-purple-500', bg: 'bg-purple-50 hover:bg-purple-100' },
                  { label: t('myResults'), icon: <FaTrophy />, path: '/results', color: 'bg-orange-500', bg: 'bg-orange-50 hover:bg-orange-100' },
                ].map((a, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(a.path)}
                    className={`flex flex-col items-center gap-2 p-4 ${a.bg} rounded-xl transition group`}
                  >
                    <div className={`${a.color} w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition`}>
                      <span className="text-white">{a.icon}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-700">
                      {a.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recent notes */}
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-gray-800 text-base md:text-lg">
                {t('recentNotes')}
              </p>
              <button
                onClick={() => navigate('/notes')}
                className="text-xs text-secondary hover:underline"
              >
                {t('viewAll')} →
              </button>
            </div>
            {recentNotes.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FaClock className="text-4xl mb-3 opacity-30 mx-auto" />
                <p className="text-sm">{t('noNotesYet')}</p>
                <button
                  onClick={() => navigate('/upload')}
                  className="mt-4 bg-primary text-white px-6 py-2 rounded-xl text-sm hover:bg-secondary transition"
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
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition"
                  >
                    <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FaStickyNote className="text-white text-xs" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-700 text-sm truncate">
                        {note.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {note.subjectId?.name} •{' '}
                        {new Date(note.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/quiz?noteId=${note._id}`);
                      }}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200 transition font-medium flex-shrink-0"
                    >
                      Quiz →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}

export default Dashboard;