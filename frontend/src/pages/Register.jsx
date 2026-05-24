import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaEnvelope, FaLock, FaUser, FaUniversity,
  FaBookOpen, FaEye, FaEyeSlash, FaGlobe
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { registerUser, isLoggedIn } from '../services/authService';

function Register() {
  const { t, i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(
    localStorage.getItem('language') || 'en'
  );
  const [langChosen, setLangChosen] = useState(
    !!localStorage.getItem('language')
  );
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    university: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn()) navigate('/dashboard');
  }, [navigate]);

  const handleLanguageSelect = lang => {
    setSelectedLang(lang);
    localStorage.setItem('language', lang);
    i18n.changeLanguage(lang);
    setLangChosen(true);
  };

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async e => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error(
        selectedLang === 'fr'
          ? 'Les mots de passe ne correspondent pas!'
          : 'Passwords do not match!'
      );
      return;
    }
    if (formData.password.length < 6) {
      toast.error(
        selectedLang === 'fr'
          ? 'Le mot de passe doit contenir au moins 6 caractères!'
          : 'Password must be at least 6 characters!'
      );
      return;
    }
    setLoading(true);
    try {
      await registerUser({ ...formData, language: selectedLang });
      toast.success(
        selectedLang === 'fr'
          ? 'Compte créé avec succès! 🎉'
          : 'Account created successfully! 🎉'
      );
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed.');
    }
    setLoading(false);
  };

  if (!langChosen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center px-4">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FaBookOpen className="text-primary text-4xl" />
            </div>
            <h1 className="text-3xl font-bold text-white">Smart Hub Study</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <FaGlobe className="text-primary text-4xl mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-gray-800">
                Choose your language
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Choisissez votre langue
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleLanguageSelect('en')}
                className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-gray-200 hover:border-primary hover:bg-blue-50 transition text-left"
              >
                <span className="text-4xl">🇬🇧</span>
                <div>
                  <p className="font-bold text-gray-800 text-lg">English</p>
                  <p className="text-gray-400 text-sm">Continue in English</p>
                </div>
              </button>

              <button
                onClick={() => handleLanguageSelect('fr')}
                className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-gray-200 hover:border-primary hover:bg-blue-50 transition text-left"
              >
                <span className="text-4xl">🇫🇷</span>
                <div>
                  <p className="font-bold text-gray-800 text-lg">Français</p>
                  <p className="text-gray-400 text-sm">
                    Continuer en Français
                  </p>
                </div>
              </button>
            </div>
          </div>

          <p className="text-center text-blue-100 text-xs mt-6">
            Smart Hub Study 🇨🇲
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        <div className="text-center mb-6">
          <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <FaBookOpen className="text-primary text-4xl" />
          </div>
          <h1 className="text-3xl font-bold text-white">{t('appName')}</h1>
          <p className="text-blue-100 mt-2 text-sm">{t('appTagline')}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8">

          <div className="flex justify-end mb-4">
            <button
              onClick={() => setLangChosen(false)}
              className="flex items-center gap-2 text-xs text-gray-400 hover:text-primary transition"
            >
              <FaGlobe />
              {t('changeLanguage')}
            </button>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            {t('createYourAccount')}
          </h2>
          <p className="text-gray-500 text-sm mb-5">{t('fillDetails')}</p>

          <form onSubmit={handleRegister} className="space-y-4">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('fullName')}
              </label>
              <div className="relative">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Ndimih Tenkeh Landi"
                  required
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('emailAddress')}
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="landi@gmail.com"
                  required
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('university')}
              </label>
              <div className="relative">
                <FaUniversity className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  placeholder={
                    selectedLang === 'fr'
                      ? 'Institut Supérieur Vishi'
                      : 'Vishi Higher Institute'
                  }
                  required
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('password')}
              </label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={
                    selectedLang === 'fr'
                      ? 'Minimum 6 caractères'
                      : 'Minimum 6 characters'
                  }
                  required
                  className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-secondary transition"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('confirmPassword')}
              </label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder={
                    selectedLang === 'fr'
                      ? 'Répétez votre mot de passe'
                      : 'Repeat your password'
                  }
                  required
                  className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-secondary transition"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-secondary text-white font-bold py-3 rounded-xl transition duration-300 text-lg shadow-lg disabled:opacity-70 mt-2"
            >
              {loading ? t('creatingAccount') : `${t('createAccount')} →`}
            </button>

          </form>

          <p className="text-center text-gray-600 text-sm mt-6">
            {t('alreadyHaveAccount')}{' '}
            <Link to="/" className="text-secondary font-bold hover:underline">
              {t('signIn')}
            </Link>
          </p>
        </div>

        <p className="text-center text-blue-100 text-xs mt-6">
          {t('builtForCameroon')}
        </p>
      </div>
    </div>
  );
}

export default Register;