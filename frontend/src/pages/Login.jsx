import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaEnvelope, FaLock, FaBookOpen, FaEye, FaEyeSlash
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { loginUser, isLoggedIn } from '../services/authService';

function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginUser(email, password);
      toast.success('Login successful! Welcome back 🎉');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <FaBookOpen className="text-primary text-4xl" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            {t('appName')}
          </h1>
          <p className="text-blue-100 mt-2 text-sm">{t('appTagline')}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            {t('welcomeBack')}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {t('signInToContinue')}
          </p>

          <form onSubmit={handleLogin} className="space-y-5">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('emailAddress')}
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="landi@gmail.com"
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
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
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

            <div className="text-right">
              <button
                type="button"
                className="text-sm text-secondary hover:underline font-medium"
              >
                {t('forgotPassword')}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-secondary text-white font-bold py-3 rounded-xl transition duration-300 text-lg shadow-lg disabled:opacity-70"
            >
              {loading ? t('signingIn') : `${t('signIn')} →`}
            </button>

          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t-2 border-gray-100" />
            <span className="px-4 text-gray-400 text-sm font-medium">or</span>
            <div className="flex-1 border-t-2 border-gray-100" />
          </div>

          <p className="text-center text-gray-600 text-sm">
            {t('noAccount')}{' '}
            <Link
              to="/register"
              className="text-secondary font-bold hover:underline"
            >
              {t('createAccount')}
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

export default Login;