import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBookOpen, FaUpload, FaStickyNote, FaQuestionCircle,
  FaChartBar, FaUser, FaBell, FaSignOutAlt, FaFire,
  FaStar, FaTrophy, FaClock, FaSpinner, FaCalculator,
  FaUsers, FaCreditCard
} from 'react-icons/fa';
import { getUser, logout, getToken } from '../services/authService';
import API from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState({
    totalNotes: 0,
    totalQuizzes: 0,
    avgScore: 0,
    studyStreak: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentNotes, setRecentNotes] = useState([]);

  useEffect(() => {
    const userData = getUser();
    if (!userData) {
      navigate('/');
    } else {
      setUser(userData);
      fetchDashboardData();
    }
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [subjectsRes, notesRes, quizStatsRes] = await Promise.all([
        API.get('/api/notes/subjects', { headers }),
        API.get('/api/notes', { headers }),
        API.get('/api/quiz/results/stats', { headers }),
      ]);

      setSubjects(subjectsRes.data.subjects);
      setRecentNotes(notesRes.data.notes.slice(0, 5));
      setStats({
        totalNotes: notesRes.data.notes.length,
        totalQuizzes: quizStatsRes.data.totalQuizzes,
        avgScore: quizStatsRes.data.avgScore,
        studyStreak: getUser()?.studyStreak || 0,
      });
    } catch (error) {
      console.error('Dashboard error:', error.message);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

 const menuItems = [
  { id: 'dashboard', icon: <FaChartBar />, label: 'Dashboard', path: '/dashboard' },
  { id: 'upload', icon: <FaUpload />, label: 'Upload Notes', path: '/upload' },
  { id: 'notes', icon: <FaStickyNote />, label: 'My Notes', path: '/notes' },
  { id: 'quiz', icon: <FaQuestionCircle />, label: 'Take Quiz', path: '/notes' },
  { id: 'results', icon: <FaTrophy />, label: 'My Results', path: '/results' },
  { id: 'math-solver', icon: <FaCalculator />, label: 'Math Solver', path: '/math-solver' },
  { id: 'study-groups', icon: <FaUsers />, label: 'Study Groups', path: '/study-groups' },
  { id: 'exam-countdown', icon: <FaClock />, label: 'Exam Countdown', path: '/exam-countdown' },
  { id: 'payment', icon: <FaCreditCard />, label: 'Upgrade to Pro', path: '/payment' },
  { id: 'profile', icon: <FaUser />, label: 'Profile', path: '/profile' },
];
  const statCards = [
    { label: 'Notes Uploaded', value: stats.totalNotes, icon: <FaStickyNote />, color: 'bg-blue-500', onClick: () => navigate('/notes') },
    { label: 'Quizzes Taken', value: stats.totalQuizzes, icon: <FaQuestionCircle />, color: 'bg-green-500', onClick: () => navigate('/results') },
    { label: 'Average Score', value: `${stats.avgScore}%`, icon: <FaChartBar />, color: 'bg-purple-500', onClick: () => navigate('/results') },
    { label: 'Study Streak', value: `${stats.studyStreak} days`, icon: <FaFire />, color: 'bg-orange-500', onClick: null },
  ];

  const subjectColors = [
    'border-blue-500', 'border-green-500', 'border-purple-500',
    'border-orange-500', 'border-red-500', 'border-yellow-500',
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* SIDEBAR — Hidden on mobile */}
      <div className="hidden md:flex w-64 bg-primary min-h-screen flex-col shadow-2xl fixed left-0 top-0 bottom-0 z-10">

        <div className="p-4 border-b border-blue-700">
          <div className="flex items-center gap-3">
            <div className="bg-white w-9 h-9 rounded-xl flex items-center justify-center">
              <FaBookOpen className="text-primary text-base" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm">Smart Hub Study</h1>
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
                {user?.fullName?.split(' ')[0] || 'Student'}!
              </p>
              <p className="text-blue-300 text-xs capitalize">
                {user?.plan || 'Free'} Plan
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveMenu(item.id); navigate(item.path); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition duration-200 text-sm font-medium ${
                activeMenu === item.id
                  ? 'bg-white text-primary shadow-lg'
                  : 'text-blue-200 hover:bg-blue-700 hover:text-white'
              }`}
            >
              <span className="text-sm flex-shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-blue-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-blue-200 hover:bg-red-600 hover:text-white transition duration-200 text-sm font-medium"
          >
            <FaSignOutAlt className="flex-shrink-0" />
            Sign Out
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col md:ml-64">

        {/* Top Bar */}
        <div className="bg-white shadow-sm px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Dashboard</h2>
            <p className="text-gray-500 text-xs">
              Welcome, {user?.fullName?.split(' ')[0] || 'Student'}! 👋
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 text-gray-500 hover:text-primary transition">
              <FaBell className="text-lg" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button
              onClick={handleLogout}
              className="md:hidden p-2 text-gray-500 hover:text-red-500 transition"
            >
              <FaSignOutAlt className="text-lg" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 md:p-8 space-y-4 md:space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <FaSpinner className="animate-spin text-primary text-4xl" />
            </div>
          ) : (
            <>
              {/* Motivational Banner */}
              <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-4 md:p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-xl font-bold mb-1">
                      🎓 Keep Pushing, {user?.fullName?.split(' ')[0] || 'Student'}!
                    </h3>
                    <p className="text-blue-100 text-xs md:text-sm">
                      "Success is the sum of small efforts repeated day in and day out."
                    </p>
                  </div>
                  <FaStar className="text-yellow-300 text-3xl md:text-5xl opacity-50 flex-shrink-0 ml-2" />
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {statCards.map((stat, i) => (
                  <div
                    key={i}
                    onClick={stat.onClick}
                    className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${stat.onClick ? 'cursor-pointer hover:shadow-md transition' : ''}`}
                  >
                    <div className={`${stat.color} w-9 h-9 rounded-xl flex items-center justify-center text-white mb-2`}>
                      {stat.icon}
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Mobile Quick Actions */}
              <div className="md:hidden bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Upload', icon: <FaUpload />, path: '/upload', color: 'bg-blue-500' },
                    { label: 'Quiz', icon: <FaQuestionCircle />, path: '/notes', color: 'bg-green-500' },
                    { label: 'Results', icon: <FaTrophy />, path: '/results', color: 'bg-orange-500' },
                    { label: 'Math', icon: <FaCalculator />, path: '/math-solver', color: 'bg-purple-500' },
                    { label: 'Groups', icon: <FaUsers />, path: '/study-groups', color: 'bg-pink-500' },
                    { label: 'Countdown', icon: <FaClock />, path: '/exam-countdown', color: 'bg-red-500' },
                    { label: 'Notes', icon: <FaStickyNote />, path: '/notes', color: 'bg-yellow-500' },
                    { label: 'Profile', icon: <FaUser />, path: '/profile', color: 'bg-gray-500' },
                    { label: 'Upgrade', icon: <FaCreditCard />, path: '/payment', color: 'bg-primary' },
                  ].map((action, i) => (
                    <button
                      key={i}
                      onClick={() => navigate(action.path)}
                      className="flex flex-col items-center gap-1 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                    >
                      <div className={`${action.color} w-9 h-9 rounded-xl flex items-center justify-center`}>
                        <span className="text-white text-sm">{action.icon}</span>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop Two Columns */}
              <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Subjects */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-gray-800 text-lg">My Subjects</h3>
                    <button
                      onClick={() => navigate('/upload')}
                      className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-secondary transition"
                    >
                      + Add Notes
                    </button>
                  </div>
                  {subjects.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <FaBookOpen className="text-3xl mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No subjects yet.</p>
                      <button onClick={() => navigate('/upload')} className="mt-3 text-xs bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition">
                        Upload First Note
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {subjects.map((sub, i) => (
                        <div
                          key={sub._id}
                          onClick={() => navigate('/notes')}
                          className={`flex items-center justify-between p-3 rounded-xl border-l-4 ${subjectColors[i % subjectColors.length]} bg-gray-50 cursor-pointer hover:bg-gray-100 transition`}
                        >
                          <div className="flex items-center gap-3">
                            <FaBookOpen className="text-gray-400" />
                            <span className="font-medium text-gray-700 text-sm">{sub.name}</span>
                          </div>
                          <span className="text-xs text-gray-400">{sub.noteCount} notes</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Actions Desktop */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 text-lg mb-5">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => navigate('/upload')} className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition group">
                      <div className="bg-blue-500 w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                        <FaUpload className="text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">Upload Notes</span>
                    </button>
                    <button onClick={() => navigate('/notes')} className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition group">
                      <div className="bg-green-500 w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                        <FaQuestionCircle className="text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">Take Quiz</span>
                    </button>
                    <button onClick={() => navigate('/exam-countdown')} className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition group">
                      <div className="bg-purple-500 w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                        <FaClock className="text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">Exam Countdown</span>
                    </button>
                    <button onClick={() => navigate('/results')} className="flex flex-col items-center gap-2 p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition group">
                      <div className="bg-orange-500 w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                        <FaTrophy className="text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">My Results</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Notes */}
              <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 text-base md:text-lg">Recent Notes</h3>
                  <button onClick={() => navigate('/notes')} className="text-xs text-secondary hover:underline font-medium">
                    View All →
                  </button>
                </div>
                {recentNotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <FaClock className="text-4xl mb-3 opacity-30" />
                    <p className="text-sm">No notes yet. Upload your first note!</p>
                    <button onClick={() => navigate('/upload')} className="mt-4 bg-primary text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-secondary transition">
                      Upload Notes Now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentNotes.map((note) => (
                      <div
                        key={note._id}
                        onClick={() => navigate('/notes')}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FaStickyNote className="text-white text-xs" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-700 text-sm truncate">{note.title}</p>
                            <p className="text-xs text-gray-400 truncate">
                              {note.subjectId?.name || 'Unknown'} • {new Date(note.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/quiz?noteId=${note._id}`); }}
                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200 transition font-medium flex-shrink-0 ml-2"
                        >
                          Quiz →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;