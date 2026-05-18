import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaArrowLeft, FaUser, FaEnvelope, FaUniversity,
  FaTrophy, FaFire, FaStar, FaSignOutAlt,
  FaGlobe, FaSpinner, FaEdit, FaSave
} from 'react-icons/fa';
import { getUser, getToken, logout } from '../services/authService';
import { useTranslation } from 'react-i18next';
import API from '../services/api';

function Profile() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalQuizzes: 0, avgScore: 0, understood: 0 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [language, setLanguage] = useState('en');
  const [editData, setEditData] = useState({ fullName: '', university: '' });

  useEffect(() => {
    const userData = getUser();
    if (!userData) { navigate('/'); return; }
    setUser(userData);
    setLanguage(userData.language || localStorage.getItem('language') || 'en');
    setEditData({ fullName: userData.fullName, university: userData.university });
    fetchStats();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const res = await API.get('/api/quiz/results/stats', {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setStats(res.data);
    } catch (error) {
      console.error('Stats error');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editData.fullName || !editData.university) {
      toast.error('Please fill in all fields');
      return;
    }
    setSaving(true);
    try {
      await API.put('/api/auth/profile',
        { fullName: editData.fullName, university: editData.university, language },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const updatedUser = { ...user, ...editData, language };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    }
    setSaving(false);
  };

  const changeLanguage = async (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    i18n.changeLanguage(lang);

    try {
      await API.put('/api/auth/profile',
        { fullName: user.fullName, university: user.university, language: lang },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const updatedUser = { ...user, language: lang };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success(lang === 'fr' ? 'Langue changée en Français! 🇫🇷' : 'Language changed to English! 🇬🇧');
    } catch (error) {
      console.error('Language save error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const badges = [
    { icon: '🎓', name: 'First Upload', nameFr: 'Premier téléchargement', desc: 'Uploaded your first note', descFr: 'Téléchargé votre première note', earned: true },
    { icon: '⚡', name: 'Quiz Master', nameFr: 'Maître du quiz', desc: 'Completed 5 quizzes', descFr: '5 quiz complétés', earned: stats.totalQuizzes >= 5 },
    { icon: '🏆', name: 'Top Scorer', nameFr: 'Meilleur score', desc: 'Scored 90%+ average', descFr: 'Moyenne de 90%+', earned: stats.avgScore >= 90 },
    { icon: '🔥', name: 'Study Streak', nameFr: "Série d'étude", desc: '7 days study streak', descFr: "7 jours d'étude consécutifs", earned: (user?.studyStreak || 0) >= 7 },
    { icon: '🧠', name: 'Deep Thinker', nameFr: 'Penseur profond', desc: 'Understood 5 topics', descFr: '5 sujets compris', earned: stats.understood >= 5 },
    { icon: '⭐', name: 'Star Student', nameFr: 'Étudiant vedette', desc: 'Completed 10 quizzes', descFr: '10 quiz complétés', earned: stats.totalQuizzes >= 10 },
  ];

  const isFrench = language === 'fr';

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
      <div className="bg-white shadow-sm px-4 md:px-8 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-primary transition">
          <FaArrowLeft className="text-xl" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            {isFrench ? 'Mon Profil' : 'My Profile'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isFrench ? 'Gérer votre compte' : 'Manage your account settings'}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-4 md:space-y-6">

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-secondary h-20 md:h-24" />
          <div className="px-4 md:px-6 pb-6">
            <div className="flex items-end justify-between -mt-8 md:-mt-10 mb-4">
              <div className="bg-white rounded-2xl p-1 shadow-lg">
                <div className="bg-primary w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center">
                  <FaUser className="text-white text-xl md:text-2xl" />
                </div>
              </div>
              <button
                onClick={() => editing ? handleSave() : setEditing(true)}
                disabled={saving}
                className="flex items-center gap-2 bg-primary text-white px-3 py-2 rounded-xl text-xs md:text-sm font-medium hover:bg-secondary transition"
              >
                {saving ? <FaSpinner className="animate-spin" /> : editing ? <FaSave /> : <FaEdit />}
                {saving
                  ? (isFrench ? 'Sauvegarde...' : 'Saving...')
                  : editing
                  ? (isFrench ? 'Sauvegarder' : 'Save Changes')
                  : (isFrench ? 'Modifier' : 'Edit Profile')
                }
              </button>
            </div>

            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    {isFrench ? 'Nom complet' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    value={editData.fullName}
                    onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    {isFrench ? "Université" : 'University'}
                  </label>
                  <input
                    type="text"
                    value={editData.university}
                    onChange={(e) => setEditData({ ...editData, university: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 text-sm"
                  />
                </div>
                <button onClick={() => setEditing(false)} className="text-sm text-gray-500 hover:text-gray-700">
                  {isFrench ? 'Annuler' : 'Cancel'}
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">{user?.fullName}</h2>
                <div className="space-y-1 mt-2">
                  <p className="flex items-center gap-2 text-gray-500 text-sm">
                    <FaEnvelope className="text-primary flex-shrink-0" />
                    <span className="truncate">{user?.email}</span>
                  </p>
                  <p className="flex items-center gap-2 text-gray-500 text-sm">
                    <FaUniversity className="text-primary flex-shrink-0" />
                    <span className="truncate">{user?.university}</span>
                  </p>
                </div>
                <div className="mt-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    user?.plan === 'pro'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {user?.plan === 'pro' ? '⭐ Pro Plan' : `🆓 ${isFrench ? 'Plan Gratuit' : 'Free Plan'}`}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center border border-gray-100">
            <FaTrophy className="text-2xl text-yellow-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-800">{stats.totalQuizzes}</p>
            <p className="text-gray-500 text-xs">{isFrench ? 'Quiz faits' : 'Quizzes Done'}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center border border-gray-100">
            <FaFire className="text-2xl text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-800">{user?.studyStreak || 0}</p>
            <p className="text-gray-500 text-xs">{isFrench ? 'Jours consécutifs' : 'Day Streak'}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center border border-gray-100">
            <FaStar className="text-2xl text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-800">{user?.points || 0}</p>
            <p className="text-gray-500 text-xs">{isFrench ? 'Points gagnés' : 'Points Earned'}</p>
          </div>
        </div>

        {/* Language */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
            <FaGlobe className="text-primary" />
            {isFrench ? 'Langue préférée' : 'Language Preference'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => changeLanguage('en')}
              className={`p-4 rounded-xl border-2 font-medium transition flex items-center justify-center gap-2 ${
                language === 'en'
                  ? 'border-primary bg-blue-50 text-primary'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              🇬🇧 English
              {language === 'en' && <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">Active</span>}
            </button>
            <button
              onClick={() => changeLanguage('fr')}
              className={`p-4 rounded-xl border-2 font-medium transition flex items-center justify-center gap-2 ${
                language === 'fr'
                  ? 'border-primary bg-blue-50 text-primary'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              🇫🇷 Français
              {language === 'fr' && <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">Actif</span>}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            {isFrench
              ? 'La langue change instantanément sans recharger la page'
              : 'Language changes instantly without reloading the page'
            }
          </p>
        </div>

        {/* Badges */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 text-base mb-4">
            🏅 {isFrench ? 'Badges de réussite' : 'Achievement Badges'}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {badges.map((badge, i) => (
              <div key={i} className={`p-3 rounded-xl text-center border-2 transition ${
                badge.earned
                  ? 'border-yellow-300 bg-yellow-50'
                  : 'border-gray-100 bg-gray-50 opacity-50'
              }`}>
                <div className="text-2xl mb-1">{badge.icon}</div>
                <p className="font-bold text-gray-800 text-xs">
                  {isFrench ? badge.nameFr : badge.name}
                </p>
                <p className="text-gray-500 text-xs mt-0.5 leading-tight">
                  {isFrench ? badge.descFr : badge.desc}
                </p>
                {badge.earned && (
                  <span className="inline-block mt-1 text-xs text-yellow-600 font-bold">✅</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade Banner */}
        {user?.plan !== 'pro' && (
          <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-5 text-white shadow-lg">
            <h3 className="font-bold text-lg mb-1">
              ⭐ {isFrench ? 'Passer au Pro' : 'Upgrade to Pro'}
            </h3>
            <p className="text-blue-100 text-sm mb-4">
              {isFrench
                ? 'Notes illimitées, résumés IA et 50+ questions de quiz par note.'
                : 'Unlimited notes, AI summaries, and 50+ quiz questions per note.'
              }
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/payment')}
                className="bg-white text-primary font-bold py-3 rounded-xl hover:bg-blue-50 transition text-sm"
              >
                📱 MTN MoMo
              </button>
              <button
                onClick={() => navigate('/payment')}
                className="bg-white text-primary font-bold py-3 rounded-xl hover:bg-blue-50 transition text-sm"
              >
                🟠 Orange Money
              </button>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-red-200 text-red-500 font-bold py-4 rounded-2xl hover:bg-red-50 transition mb-6"
        >
          <FaSignOutAlt />
          {isFrench ? 'Se déconnecter' : 'Sign Out'}
        </button>

      </div>
    </div>
  );
}

export default Profile;