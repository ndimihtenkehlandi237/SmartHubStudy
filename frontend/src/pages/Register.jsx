import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaEnvelope, FaLock, FaUser, FaUniversity, FaBookOpen, FaEye, FaEyeSlash } from 'react-icons/fa';
import { registerUser } from '../services/authService';

function Register() {
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters!');
      return;
    }
    setLoading(true);
    try {
      await registerUser(formData);
      toast.success('Account created successfully! Welcome 🎉');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        <div className="text-center mb-6">
          <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <FaBookOpen className="text-primary text-4xl" />
          </div>
          <h1 className="text-4xl font-bold text-white">Smart Hub Study</h1>
          <p className="text-blue-100 mt-2">Join students studying smarter in Cameroon</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Create Account</h2>
          <p className="text-gray-500 text-sm mb-6">Fill in your details to get started</p>

          <form onSubmit={handleRegister} className="space-y-4">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Ndimih Tenkeh Landi"
                  required
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. landi@gmail.com"
                  required
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">University Name</label>
              <div className="relative">
                <FaUniversity className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  placeholder="e.g. Vishi Higher Institute"
                  required
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
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
              className="w-full bg-primary hover:bg-secondary text-white font-bold py-3 rounded-xl transition duration-300 text-lg shadow-lg mt-2"
            >
              {loading ? 'Creating Account...' : 'Create Account →'}
            </button>

          </form>

          <p className="text-center text-gray-600 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/" className="text-secondary font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>

        <p className="text-center text-blue-100 text-xs mt-6">
          Built for University Students in Cameroon 🇨🇲
        </p>
      </div>
    </div>
  );
}

export default Register;