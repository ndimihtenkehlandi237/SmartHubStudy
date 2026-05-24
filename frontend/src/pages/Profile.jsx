import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaArrowLeft, FaUser, FaEnvelope, FaUniversity,
  FaTrophy, FaFire, FaStar, FaSignOutAlt,
  FaGlobe, FaSpinner, FaEdit, FaSave, FaLock,
  FaUserPlus, FaSearch, FaQrcode, FaLink,
  FaCamera, FaCheck, FaEye, FaEyeSlash
} from 'react-icons/fa';
import { getUser, getToken, logout } from '../services/authService';
import { useTranslation } from 'react-i18next';
import API from '../services/api';

function Profile() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef(null);

  // Get user once at mount
  const [currentUser, setCurrentUser] = useState(() => getUser());

  const [stats, setStats] = useState({
    totalQuizzes: 0,
    avgScore: 0,
    understood: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Edit states
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    fullName: currentUser?.fullName || '',
    username: currentUser?.username || '',
    university: currentUser?.university || '',
  });

  // Password states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    newP: false,
    confirm: false,
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Language
  const [language, setLanguage] = useState(
    currentUser?.language || localStorage.getItem('language') || 'en'
  );

  // Friends
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState([]);
  const [showQR, setShowQR] = useState(false);

  // Profile picture
  const [uploadingPic, setUploadingPic] = useState(false);

  const isFrench = language === 'fr';

  // ── FETCH STATS ──
  const fetchStats = useCallback(async () => {
    try {
      const res = await API.get('/api/quiz/results/stats', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setStats(res.data);
    } catch (error) {
      console.error('Stats error:', error.message);
    }
  }, []);

  // ── FETCH FRIEND SUGGESTIONS ──
  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await API.get('/api/auth/suggestions', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setSuggestions(res.data.suggestions || []);
    } catch (error) {
      console.error('Suggestions error:', error.message);
    }
  }, []);

  // ── MOUNT EFFECT ──
  useEffect(() => {
    const userData = getUser();
    if (!userData) {
      navigate('/');
      return;
    }
    setCurrentUser(userData);

    const loadData = async () => {
      await Promise.all([fetchStats(), fetchSuggestions()]);
      setLoading(false);
    };

    loadData();
  }, [navigate, fetchStats, fetchSuggestions]);

  // ── SAVE PROFILE ──
  const handleSaveProfile = async () => {
    if (!editData.fullName || !editData.university) {
      toast.error(isFrench ? 'Veuillez remplir tous les champs' : 'Please fill in all fields');
      return;
    }
    setSaving(true);
    try {
      await API.put(
        '/api/auth/profile',
        { ...editData, language },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const updatedUser = { ...currentUser, ...editData, language };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setEditing(false);
      toast.success(isFrench ? 'Profil mis à jour!' : 'Profile updated!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
    setSaving(false);
  };

  // ── CHANGE PASSWORD ──
  const handleChangePassword = async e => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast.error(isFrench ? 'Les mots de passe ne correspondent pas' : 'Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error(isFrench ? 'Minimum 6 caractères' : 'Minimum 6 characters');
      return;
    }
    setChangingPassword(true);
    try {
      await API.put(
        '/api/auth/change-password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast.success(isFrench ? 'Mot de passe changé!' : 'Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      setShowPasswordForm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
    setChangingPassword(false);
  };

  // ── CHANGE LANGUAGE ──
  const handleLanguageChange = async lang => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    i18n.changeLanguage(lang);
    try {
      const updatedUser = { ...currentUser, language: lang };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      await API.put(
        '/api/auth/profile',
        {
          fullName: currentUser.fullName,
          university: currentUser.university,
          language: lang,
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast.success(
        lang === 'fr'
          ? 'Langue changée en Français 🇫🇷'
          : 'Language changed to English 🇬🇧'
      );
    } catch (error) {
      console.error('Language save error:', error.message);
    }
  };

  // ── SEARCH USERS ──
  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await API.get(`/api/auth/search?query=${searchQuery}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setSearchResults(res.data.users || []);
    } catch (error) {
      toast.error('Search failed');
    }
    setSearching(false);
  };

  // ── SEND FRIEND REQUEST ──
  const handleSendFriendRequest = async userId => {
    try {
      await API.post(
        `/api/auth/friend-request/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setSentRequests(prev => [...prev, userId]);
      toast.success(isFrench ? 'Demande envoyée!' : 'Friend request sent!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    }
  };

  // ── UPLOAD PROFILE PICTURE ──
  const handleProfilePicture = async e => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(
        isFrench ? 'Image trop grande. Maximum 2MB' : 'Image too large. Maximum 2MB'
      );
      return;
    }

    setUploadingPic(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      try {
        await API.put(
          '/api/auth/profile',
          {
            fullName: currentUser.fullName,
            university: currentUser.university,
            profilePicture: base64,
          },
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        const updatedUser = { ...currentUser, profilePicture: base64 };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        toast.success(isFrench ? 'Photo mise à jour!' : 'Profile picture updated!');
      } catch (error) {
        toast.error('Failed to upload picture');
      }
      setUploadingPic(false);
    };
    reader.readAsDataURL(file);
  };

  // ── COPY SHARE LINK ──
  const copyShareLink = () => {
    const link = `${window.location.origin}/profile/share/${currentUser?.shareLink}`;
    navigator.clipboard.writeText(link);
    toast.success(isFrench ? 'Lien copié!' : 'Link copied!');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const badges = [
    {
      icon: '🎓',
      name: 'First Upload',
      nameFr: 'Premier téléchargement',
      earned: true,
    },
    {
      icon: '⚡',
      name: 'Quiz Master',
      nameFr: 'Maître du quiz',
      earned: stats.totalQuizzes >= 5,
    },
    {
      icon: '🏆',
      name: 'Top Scorer',
      nameFr: 'Meilleur score',
      earned: stats.avgScore >= 90,
    },
    {
      icon: '🔥',
      name: 'Study Streak',
      nameFr: "Série d'étude",
      earned: (currentUser?.studyStreak || 0) >= 7,
    },
    {
      icon: '🧠',
      name: 'Deep Thinker',
      nameFr: 'Penseur profond',
      earned: stats.understood >= 5,
    },
    {
      icon: '⭐',
      name: 'Star Student',
      nameFr: 'Étudiant vedette',
      earned: stats.totalQuizzes >= 10,
    },
  ];

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
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-500 hover:text-primary transition"
        >
          <FaArrowLeft className="text-xl" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{t('myProfile')}</h1>
          <p className="text-gray-500 text-sm">{t('manageAccount')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-4">
        <div className="max-w-2xl mx-auto flex">
          {[
            { id: 'profile', label: isFrench ? 'Profil' : 'Profile' },
            { id: 'friends', label: isFrench ? 'Amis' : 'Friends' },
            { id: 'security', label: isFrench ? 'Sécurité' : 'Security' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-4">

        {/* ── PROFILE TAB ── */}
        {activeTab === 'profile' && (
          <>
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-secondary h-20 md:h-24" />
              <div className="px-4 md:px-6 pb-6">
                <div className="flex items-end justify-between -mt-8 mb-4">

                  {/* Profile Picture */}
                  <div className="relative">
                    <div className="bg-white rounded-2xl p-1 shadow-lg">
                      {currentUser?.profilePicture ? (
                        <img
                          src={currentUser.profilePicture}
                          alt="Profile"
                          className="w-14 h-14 md:w-16 md:h-16 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="bg-primary w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center">
                          <FaUser className="text-white text-xl md:text-2xl" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPic}
                      className="absolute -bottom-1 -right-1 bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center hover:bg-secondary transition shadow-lg"
                    >
                      {uploadingPic
                        ? <FaSpinner className="animate-spin text-xs" />
                        : <FaCamera className="text-xs" />
                      }
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePicture}
                    />
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => editing ? handleSaveProfile() : setEditing(true)}
                    disabled={saving}
                    className="flex items-center gap-2 bg-primary text-white px-3 py-2 rounded-xl text-xs md:text-sm font-medium hover:bg-secondary transition"
                  >
                    {saving
                      ? <FaSpinner className="animate-spin" />
                      : editing ? <FaSave /> : <FaEdit />
                    }
                    {saving
                      ? (isFrench ? 'Sauvegarde...' : 'Saving...')
                      : editing ? t('saveChanges') : t('editProfile')
                    }
                  </button>
                </div>

                {/* Followers / Following / Friends */}
                <div className="flex gap-4 mb-3">
                  <div className="text-center">
                    <p className="font-bold text-gray-800">
                      {currentUser?.followers || 0}
                    </p>
                    <p className="text-xs text-gray-400">{t('followers')}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-800">
                      {currentUser?.following || 0}
                    </p>
                    <p className="text-xs text-gray-400">{t('following')}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-800">
                      {Array.isArray(currentUser?.friends)
                        ? currentUser.friends.length
                        : 0}
                    </p>
                    <p className="text-xs text-gray-400">{t('friends')}</p>
                  </div>
                </div>

                {/* Edit Form or Display */}
                {editing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        {t('fullName')}
                      </label>
                      <input
                        type="text"
                        value={editData.fullName}
                        onChange={e =>
                          setEditData({ ...editData, fullName: e.target.value })
                        }
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        {t('username')}
                      </label>
                      <input
                        type="text"
                        value={editData.username}
                        onChange={e =>
                          setEditData({
                            ...editData,
                            username: e.target.value
                              .toLowerCase()
                              .replace(/\s/g, ''),
                          })
                        }
                        placeholder={t('usernamePlaceholder')}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 text-sm font-mono"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {isFrench
                          ? "Le nom d'utilisateur doit être unique"
                          : 'Username must be unique across the platform'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        {t('university')}
                      </label>
                      <input
                        type="text"
                        value={editData.university}
                        onChange={e =>
                          setEditData({
                            ...editData,
                            university: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 text-sm"
                      />
                    </div>
                    <button
                      onClick={() => setEditing(false)}
                      className="text-sm text-gray-400 hover:text-gray-600"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                      {currentUser?.fullName}
                    </h2>
                    {currentUser?.username && (
                      <p className="text-primary font-mono text-sm mt-0.5">
                        @{currentUser.username}
                      </p>
                    )}
                    <div className="space-y-1 mt-2">
                      <p className="flex items-center gap-2 text-gray-500 text-sm">
                        <FaEnvelope className="text-primary flex-shrink-0" />
                        <span className="truncate">{currentUser?.email}</span>
                      </p>
                      <p className="flex items-center gap-2 text-gray-500 text-sm">
                        <FaUniversity className="text-primary flex-shrink-0" />
                        <span className="truncate">{currentUser?.university}</span>
                      </p>
                    </div>
                    <div className="mt-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        currentUser?.plan === 'pro'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {currentUser?.plan === 'pro'
                          ? `⭐ ${t('proPlan')}`
                          : `🆓 ${t('freePlan')}`
                        }
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
                <p className="text-2xl font-bold text-gray-800">
                  {stats.totalQuizzes}
                </p>
                <p className="text-gray-500 text-xs">{t('quizzesDone')}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm text-center border border-gray-100">
                <FaFire className="text-2xl text-orange-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-800">
                  {currentUser?.studyStreak || 0}
                </p>
                <p className="text-gray-500 text-xs">{t('dayStreak')}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm text-center border border-gray-100">
                <FaStar className="text-2xl text-blue-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-800">
                  {currentUser?.points || 0}
                </p>
                <p className="text-gray-500 text-xs">{t('pointsEarned')}</p>
              </div>
            </div>

            {/* Language */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
                <FaGlobe className="text-primary" />
                {t('languagePreference')}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`p-4 rounded-xl border-2 font-medium transition flex items-center justify-center gap-2 ${
                    language === 'en'
                      ? 'border-primary bg-blue-50 text-primary'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  🇬🇧 English
                  {language === 'en' && <FaCheck className="text-xs" />}
                </button>
                <button
                  onClick={() => handleLanguageChange('fr')}
                  className={`p-4 rounded-xl border-2 font-medium transition flex items-center justify-center gap-2 ${
                    language === 'fr'
                      ? 'border-primary bg-blue-50 text-primary'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  🇫🇷 Français
                  {language === 'fr' && <FaCheck className="text-xs" />}
                </button>
              </div>
            </div>

            {/* Badges */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 text-base mb-4">
                🏅 {t('achievementBadges')}
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {badges.map((badge, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl text-center border-2 ${
                      badge.earned
                        ? 'border-yellow-300 bg-yellow-50'
                        : 'border-gray-100 bg-gray-50 opacity-50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{badge.icon}</div>
                    <p className="font-bold text-gray-800 text-xs">
                      {isFrench ? badge.nameFr : badge.name}
                    </p>
                    {badge.earned && (
                      <span className="text-xs text-yellow-600">✅</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Upgrade Banner */}
            {currentUser?.plan !== 'pro' && (
              <div
                onClick={() => navigate('/payment')}
                className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-5 text-white shadow-lg cursor-pointer"
              >
                <h3 className="font-bold text-lg mb-1">
                  ⭐ {isFrench ? 'Passer au Pro' : 'Upgrade to Pro'}
                </h3>
                <p className="text-blue-100 text-sm mb-3">
                  {isFrench
                    ? "Notes illimitées, résumés IA et 50+ questions par note."
                    : 'Unlimited notes, AI summaries, and 50+ quiz questions per note.'
                  }
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white text-primary font-bold py-2 rounded-xl text-sm text-center">
                    📱 MTN MoMo
                  </div>
                  <div className="bg-white text-primary font-bold py-2 rounded-xl text-sm text-center">
                    🟠 Orange Money
                  </div>
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
          </>
        )}

        {/* ── FRIENDS TAB ── */}
        {activeTab === 'friends' && (
          <div className="space-y-4">

            {/* Share Profile */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <FaLink className="text-primary" />
                {t('shareProfile')}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={copyShareLink}
                  className="flex items-center justify-center gap-2 bg-primary text-white font-medium py-3 rounded-xl hover:bg-secondary transition text-sm"
                >
                  <FaLink /> {t('copyLink')}
                </button>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-200 transition text-sm"
                >
                  <FaQrcode /> QR Code
                </button>
              </div>
              {showQR && (
                <div className="mt-4 text-center">
                  <div className="bg-gray-50 rounded-xl p-4 inline-block">
                    <div className="w-32 h-32 bg-gray-200 rounded-xl flex items-center justify-center mx-auto">
                      <FaQrcode className="text-5xl text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      @{currentUser?.username}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Search Users */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <FaSearch className="text-primary" />
                {t('findFriends')}
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearchUsers()}
                  placeholder={t('searchByUsername')}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 text-sm"
                />
                <button
                  onClick={handleSearchUsers}
                  disabled={searching}
                  className="bg-primary text-white px-4 py-3 rounded-xl hover:bg-secondary transition"
                >
                  {searching
                    ? <FaSpinner className="animate-spin" />
                    : <FaSearch />
                  }
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-4 space-y-3">
                  {searchResults.map(u => (
                    <div
                      key={u._id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {u.fullName?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 text-sm truncate">
                          {u.fullName}
                        </p>
                        {u.username && (
                          <p className="text-xs text-primary">@{u.username}</p>
                        )}
                        <p className="text-xs text-gray-400 truncate">
                          {u.university}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSendFriendRequest(u._id)}
                        disabled={sentRequests.includes(u._id)}
                        className={`flex-shrink-0 text-xs font-bold px-3 py-2 rounded-xl transition ${
                          sentRequests.includes(u._id)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-primary text-white hover:bg-secondary'
                        }`}
                      >
                        {sentRequests.includes(u._id) ? (
                          <span className="flex items-center gap-1">
                            <FaCheck /> {t('requestSent')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <FaUserPlus /> {t('sendRequest')}
                          </span>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Friend Suggestions */}
            {suggestions.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-3">
                  👥 {t('friendSuggestions')}
                </h3>
                <div className="space-y-3">
                  {suggestions.map(u => (
                    <div
                      key={u._id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {u.fullName?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 text-sm truncate">
                          {u.fullName}
                        </p>
                        {u.username && (
                          <p className="text-xs text-primary">@{u.username}</p>
                        )}
                        <p className="text-xs text-gray-400">{u.university}</p>
                      </div>
                      <button
                        onClick={() => handleSendFriendRequest(u._id)}
                        disabled={sentRequests.includes(u._id)}
                        className={`flex-shrink-0 px-3 py-2 rounded-xl transition text-xs font-bold ${
                          sentRequests.includes(u._id)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-700 hover:bg-primary hover:text-white'
                        }`}
                      >
                        {sentRequests.includes(u._id)
                          ? '✅'
                          : <FaUserPlus />
                        }
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── SECURITY TAB ── */}
        {activeTab === 'security' && (
          <div className="space-y-4">

            {/* Change Password */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                  <FaLock className="text-primary" />
                  {t('changePassword')}
                </h3>
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="text-xs text-secondary hover:underline"
                >
                  {showPasswordForm
                    ? t('cancel')
                    : (isFrench ? 'Modifier' : 'Change')
                  }
                </button>
              </div>

              {showPasswordForm ? (
                <form onSubmit={handleChangePassword} className="space-y-4">

                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('currentPassword')}
                    </label>
                    <div className="relative">
                      <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={e =>
                          setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value,
                          })
                        }
                        required
                        className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords(p => ({
                            ...p,
                            current: !p.current,
                          }))
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('newPassword')}
                    </label>
                    <div className="relative">
                      <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPasswords.newP ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={e =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        required
                        minLength={6}
                        className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords(p => ({ ...p, newP: !p.newP }))
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPasswords.newP ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>

                    {/* Password strength */}
                    {passwordData.newPassword && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4].map(level => (
                            <div
                              key={level}
                              className={`h-1.5 flex-1 rounded-full ${
                                passwordData.newPassword.length >= level * 3
                                  ? level <= 1 ? 'bg-red-400'
                                    : level <= 2 ? 'bg-yellow-400'
                                    : level <= 3 ? 'bg-blue-400'
                                    : 'bg-green-400'
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs ${
                          passwordData.newPassword.length < 6 ? 'text-red-500'
                            : passwordData.newPassword.length < 9 ? 'text-yellow-500'
                            : 'text-green-500'
                        }`}>
                          {passwordData.newPassword.length < 6
                            ? (isFrench ? 'Trop court' : 'Too short')
                            : passwordData.newPassword.length < 9
                            ? (isFrench ? 'Moyen' : 'Medium')
                            : (isFrench ? 'Fort ✅' : 'Strong ✅')
                          }
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('confirmNewPassword')}
                    </label>
                    <div className="relative">
                      <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmNewPassword}
                        onChange={e =>
                          setPasswordData({
                            ...passwordData,
                            confirmNewPassword: e.target.value,
                          })
                        }
                        required
                        className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords(p => ({
                            ...p,
                            confirm: !p.confirm,
                          }))
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>

                    {/* Match indicator */}
                    {passwordData.confirmNewPassword && (
                      <p className={`text-xs mt-1 ${
                        passwordData.newPassword === passwordData.confirmNewPassword
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}>
                        {passwordData.newPassword === passwordData.confirmNewPassword
                          ? (isFrench ? '✅ Mots de passe identiques' : '✅ Passwords match')
                          : (isFrench ? '❌ Ne correspondent pas' : '❌ Do not match')
                        }
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="w-full bg-primary hover:bg-secondary text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    {changingPassword
                      ? <FaSpinner className="animate-spin" />
                      : <FaLock />
                    }
                    {changingPassword
                      ? (isFrench ? 'Mise à jour...' : 'Updating...')
                      : t('updatePassword')
                    }
                  </button>

                </form>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <FaLock className="text-gray-400 text-2xl mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    {isFrench
                      ? 'Votre mot de passe est sécurisé avec le chiffrement bcrypt.'
                      : 'Your password is secured with bcrypt encryption.'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Account Security Info */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 text-base mb-3">
                🛡️ {isFrench ? 'Sécurité du compte' : 'Account Security'}
              </h3>
              <div className="space-y-3">
                {[
                  {
                    icon: '✅',
                    label: isFrench ? 'Email vérifié' : 'Email verified',
                    value: currentUser?.email,
                  },
                  {
                    icon: '🔒',
                    label: isFrench ? 'Mot de passe chiffré' : 'Password encrypted',
                    value: 'bcrypt 10 rounds',
                  },
                  {
                    icon: '🎫',
                    label: isFrench ? 'Session sécurisée' : 'Secure session',
                    value: 'JWT 7 days',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-gray-500 flex-1">{item.label}</span>
                    <span className="text-gray-700 font-medium text-xs truncate max-w-32">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default Profile;