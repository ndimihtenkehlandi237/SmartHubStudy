import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaSpinner, FaLock } from 'react-icons/fa';
import { getToken, getUser } from '../services/authService';
import API from '../services/api';

const EXAMPLES = [
  '2x + 5 = 15',
  'x² - 4x + 4 = 0',
  '3x + 2y = 12',
  '∫ x² dx',
  'd/dx (sin(x))',
  'log₂(64)',
  '5!',
  'sin(30°)',
];

const PRO_FEATURES = [
  'Solve any equation step by step',
  'Unlimited note uploads',
  '50+ AI quiz questions per note',
  'Full AI note summarization',
  'Exam study plan generator',
];

function ProLockScreen({ navigate, t }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-primary transition">
          <FaArrowLeft className="text-xl" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{t('mathSolverTitle')}</h1>
          <p className="text-gray-500 text-sm">{t('proFeature')}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-6">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaLock className="text-yellow-500 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('proFeature')}</h2>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">
            {t('mathSolverProMsg')}
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
            <p className="font-bold text-gray-700 text-sm mb-2">{t('getWithPro')}</p>
            {PRO_FEATURES.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-500 flex-shrink-0">✓</span>
                {feature}
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/payment')}
            className="w-full bg-primary hover:bg-secondary text-white font-bold py-3 rounded-xl transition text-base"
          >
            {t('upgradeNowBtn')}
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full mt-3 text-gray-400 hover:text-gray-600 text-sm transition"
          >
            {t('maybeLater')}
          </button>
        </div>
      </div>
    </div>
  );
}

function MathSolver() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = getUser();
  const isPro = user?.plan === 'pro';

  const [equation, setEquation] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  if (!isPro) {
    return <ProLockScreen navigate={navigate} t={t} />;
  }

  const handleSolve = async e => {
    e.preventDefault();
    if (!equation.trim()) { toast.error('Please enter an equation'); return; }
    setLoading(true);
    try {
      const res = await API.post(
        '/api/ai/solve-math',
        { equation },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setResult(res.data.result);
      setHistory(prev => [{ equation, result: res.data.result }, ...prev.slice(0, 4)]);
    } catch (error) {
      const code = error.response?.data?.code;
      if (code === 'PRO_REQUIRED') {
        toast.error('This feature requires Pro.');
        navigate('/payment');
      } else {
        toast.error('Failed to solve. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-white shadow-sm px-4 md:px-8 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-primary transition">
          <FaArrowLeft className="text-xl" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{t('mathSolverTitle')}</h1>
          <p className="text-gray-500 text-sm">{t('stepByStepLabel')}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">

        {/* Input */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg mb-4">{t('enterEquation')}</h3>
          <form onSubmit={handleSolve} className="space-y-4">
            <input
              type="text"
              value={equation}
              onChange={e => setEquation(e.target.value)}
              placeholder="e.g. 2x + 5 = 15 or x² - 4x + 4 = 0"
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 text-lg font-mono transition"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-secondary text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-lg"
            >
              {loading
                ? <><FaSpinner className="animate-spin" /> {t('solvingLabel')}</>
                : t('solveButton')
              }
            </button>
          </form>

          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2 font-medium">{t('tryThese')}</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setEquation(ex)}
                  className="text-xs bg-gray-100 hover:bg-blue-100 hover:text-primary text-gray-600 px-3 py-1.5 rounded-lg transition font-mono"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg mb-4">{t('solutionLabel')}</h3>

            <div className="bg-primary rounded-xl p-4 mb-4 text-center">
              <p className="text-white text-sm font-medium mb-1">{t('equationLabel')}</p>
              <p className="text-white text-2xl font-bold font-mono">{result.equation}</p>
            </div>

            <div className="space-y-3 mb-4">
              <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
                {t('stepsLabel')}
              </h4>
              {result.steps && result.steps.map((step, i) => (
                <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {step.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-600 text-sm mb-1">{step.explanation}</p>
                    <p className="font-mono font-bold text-gray-800 bg-white px-3 py-1 rounded-lg border border-gray-200 inline-block text-sm">
                      {step.result}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4 text-center">
              <p className="text-green-600 text-sm font-bold mb-1">{t('finalAnswer')}</p>
              <p className="text-green-800 text-2xl font-bold font-mono">{result.finalAnswer}</p>
            </div>

            {result.explanation && (
              <div className="mt-4 bg-blue-50 rounded-xl p-4">
                <p className="text-blue-700 text-sm leading-relaxed">
                  <span className="font-bold">💡 </span>{result.explanation}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => { setResult(null); setEquation(''); }}
              className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition"
            >
              {t('solveAnother')}
            </button>
          </div>
        )}

        {/* History */}
        {history.length > 0 && !result && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg mb-4">{t('recentEquations')}</h3>
            <div className="space-y-2">
              {history.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setEquation(item.equation); setResult(item.result); }}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-100 transition"
                >
                  <p className="font-mono text-gray-800 text-sm font-medium">{item.equation}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {t('answerLabel')}: {item.result.finalAnswer}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default MathSolver;