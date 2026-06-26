import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
  FaArrowLeft, FaCheck, FaSpinner,
  FaLock, FaShieldAlt, FaExclamationTriangle
} from 'react-icons/fa';
import { getToken } from '../services/authService';
import API from '../services/api';

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '2,000',
    priceNum: 2000,
    period: '/month',
    color: 'from-blue-500 to-primary',
    features: [
      'Unlimited note uploads',
      '50+ AI quiz questions per note',
      'Full AI summarization',
      'Exam countdown planner',
      'Study groups access',
      'Math equation solver',
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '18,000',
    priceNum: 18000,
    period: '/year',
    badge: 'Save 25%',
    color: 'from-purple-500 to-primary',
    features: [
      'Everything in Monthly',
      '3 months free',
      'Advanced analytics',
      'Offline mode priority',
      'Early access features',
      'VIP support',
    ],
  },
];

function StepIndicator({ step }) {
  const { t } = useTranslation();
  const steps = [t('choosePlan'), t('payNow'), 'Done'];
  return (
    <div className="bg-white border-b border-gray-100 px-4 py-3">
      <div className="max-w-lg mx-auto flex items-center">
        {steps.map((label, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step > i + 1 ? 'bg-green-500 text-white'
                  : step === i + 1 ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step > i + 1 ? <FaCheck /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${
                step === i + 1 ? 'text-primary' : 'text-gray-400'
              }`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${step > i + 1 ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Step1({ selectedPlan, setSelectedPlan, setStep }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800">{t('choosePlan')}</h2>
        <p className="text-gray-500 text-sm mt-1">{t('allPricesFCFA')}</p>
      </div>

      {/* Free Plan Summary */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-700">{t('currentFreePlan')}</h3>
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">FREE</span>
        </div>
        <div className="space-y-1">
          {[
            { text: '5 uploads per 6 hours', locked: false },
            { text: '5 quiz questions per note', locked: false },
            { text: 'Basic AI summary', locked: false },
            { text: 'Math Solver', locked: true },
            { text: 'Unlimited uploads', locked: true },
            { text: '50+ quiz questions', locked: true },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {f.locked
                ? <FaLock className="text-gray-300 text-xs flex-shrink-0" />
                : <FaCheck className="text-green-500 text-xs flex-shrink-0" />
              }
              <span className={f.locked ? 'text-gray-400 line-through' : 'text-gray-600'}>
                {f.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pro Plans */}
      {PLANS.map(plan => (
        <div
          key={plan.id}
          onClick={() => setSelectedPlan(plan.id)}
          className={`rounded-2xl border-2 cursor-pointer transition overflow-hidden relative ${
            selectedPlan === plan.id
              ? 'border-primary shadow-lg'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          {plan.badge && (
            <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
              {plan.badge}
            </div>
          )}
          <div className={`bg-gradient-to-r ${plan.color} p-4 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{plan.name} Plan</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black">{plan.price}</span>
                  <span className="text-sm opacity-80">FCFA{plan.period}</span>
                </div>
              </div>
              <div className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center ${
                selectedPlan === plan.id ? 'bg-white' : 'bg-transparent'
              }`}>
                {selectedPlan === plan.id && <FaCheck className="text-primary text-sm" />}
              </div>
            </div>
          </div>
          <div className="p-4 bg-white">
            <div className="grid grid-cols-2 gap-1">
              {plan.features.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <FaCheck className="text-green-500 flex-shrink-0 text-xs" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={() => setStep(2)}
        className="w-full bg-primary hover:bg-secondary text-white font-bold py-4 rounded-2xl transition text-lg shadow-lg"
      >
        {t('continueToPay')}
      </button>
      <p className="text-center text-xs text-gray-400">{t('cancelAnytime')}</p>
    </div>
  );
}

function Step2({ selectedPlan, selectedMethod, setSelectedMethod, phone, setPhone, loading, error, setError, handlePayment, setStep }) {
  const { t } = useTranslation();
  const plan = PLANS.find(p => p.id === selectedPlan);

  return (
    <div className="space-y-4">

      {/* Amount Banner */}
      <div className="bg-primary rounded-2xl p-4 text-white text-center">
        <p className="text-blue-100 text-sm">{t('totalAmount')}</p>
        <p className="text-3xl font-black">{plan.price} FCFA</p>
        <p className="text-blue-100 text-sm">
          {selectedPlan === 'monthly' ? t('perMonth') : t('perYear')}
        </p>
      </div>

      {/* Balance Error */}
      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="text-red-500 text-xl flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-700 text-sm mb-1">{t('insufficientBalance')}</p>
              <p className="text-red-600 text-sm">{error}</p>
              <div className="mt-3 space-y-1">
                <p className="text-red-500 text-xs font-bold">{t('howToTopUp')}</p>
                {selectedMethod === 'mtn' ? (
                  <ul className="text-xs text-red-500 space-y-0.5">
                    <li>• Dial *126# on your MTN phone</li>
                    <li>• Select Deposit Money</li>
                    <li>• Go to any MTN MoMo agent</li>
                    <li>• Top up at least {plan.price} FCFA then try again</li>
                  </ul>
                ) : (
                  <ul className="text-xs text-red-500 space-y-0.5">
                    <li>• Dial #144# on your Orange phone</li>
                    <li>• Select Recharge Orange Money</li>
                    <li>• Go to any Orange Money agent</li>
                    <li>• Top up at least {plan.price} FCFA then try again</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MTN Button */}
<button
  onClick={() => { setSelectedMethod('mtn'); setError(null); }}
  className={`w-full rounded-2xl border-2 transition overflow-hidden ${
    selectedMethod === 'mtn'
      ? 'border-yellow-400 shadow-lg'
      : 'border-gray-200 bg-white hover:border-yellow-300'
  }`}
>
  <div className="flex items-center gap-4 p-4">
    <div
      className="w-16 h-16 rounded-xl flex-shrink-0 flex flex-col items-center justify-center"
      style={{ backgroundColor: '#FFCC00' }}
    >
      <div
        className="rounded-full flex items-center justify-center px-2 py-1"
        style={{ backgroundColor: '#005B99', width: 52, height: 28 }}
      >
        <span
          className="font-black text-white tracking-widest"
          style={{ fontSize: 13, letterSpacing: 2 }}
        >
          MTN
        </span>
      </div>
      <span
        className="font-bold mt-0.5"
        style={{ fontSize: 8, color: '#005B99', letterSpacing: 1 }}
      >
        MOBILE MONEY
      </span>
    </div>
    <div className="flex-1 text-left">
      <p className="font-bold text-gray-800">MTN Mobile Money</p>
      <p className="text-gray-500 text-sm">Pay with your MTN number</p>
      <p className="text-xs font-medium mt-0.5" style={{ color: '#FFCC00' }}>
        ✅ Available 24/7 • Instant
      </p>
    </div>
    <div
      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
        selectedMethod === 'mtn'
          ? 'border-yellow-400 bg-yellow-400'
          : 'border-gray-300'
      }`}
    >
      {selectedMethod === 'mtn' && (
        <FaCheck className="text-white text-xs" />
      )}
    </div>
  </div>
</button>

{/* Orange Money Button */}
<button
  onClick={() => { setSelectedMethod('orange'); setError(null); }}
  className={`w-full rounded-2xl border-2 transition overflow-hidden ${
    selectedMethod === 'orange'
      ? 'border-orange-400 shadow-lg'
      : 'border-gray-200 bg-white hover:border-orange-300'
  }`}
>
  <div className="flex items-center gap-4 p-4">
    <div
      className="w-16 h-16 rounded-xl flex-shrink-0 flex flex-col items-center justify-center"
      style={{ backgroundColor: '#FF6600' }}
    >
      <span
        className="font-black text-white"
        style={{ fontSize: 18, letterSpacing: -0.5 }}
      >
        orange
      </span>
      <span
        className="font-semibold text-white"
        style={{ fontSize: 8, letterSpacing: 1, marginTop: 1 }}
      >
        MONEY
      </span>
    </div>
    <div className="flex-1 text-left">
      <p className="font-bold text-gray-800">Orange Money</p>
      <p className="text-gray-500 text-sm">Pay with your Orange number</p>
      <p
        className="text-xs font-medium mt-0.5"
        style={{ color: '#FF6600' }}
      >
        ✅ Available 24/7 • Instant
      </p>
    </div>
    <div
      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
        selectedMethod === 'orange'
          ? 'border-orange-400 bg-orange-400'
          : 'border-gray-300'
      }`}
    >
      {selectedMethod === 'orange' && (
        <FaCheck className="text-white text-xs" />
      )}
    </div>
  </div>
</button>
      {/* Phone */}
      {selectedMethod && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Enter your {selectedMethod === 'mtn' ? 'MTN' : 'Orange'} phone number
          </label>
          <div className="flex gap-2">
            <div className="bg-gray-100 px-3 py-3 rounded-xl font-bold text-gray-700 text-sm flex items-center flex-shrink-0">
              🇨🇲 +237
            </div>
            <input
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 9)); setError(null); }}
              placeholder="6XX XXX XXX"
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 transition text-lg font-mono tracking-wider"
            />
          </div>
        </div>
      )}

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Plan</span>
          <span className="font-bold">{plan.name} Plan</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Method</span>
          <span className="font-bold">
            {selectedMethod === 'mtn' ? '📱 MTN MoMo' : selectedMethod === 'orange' ? '🟠 Orange Money' : '—'}
          </span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between">
          <span className="font-bold text-gray-700">Total</span>
          <span className="font-black text-primary text-xl">{plan.price} FCFA</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button onClick={() => setStep(1)} className="px-5 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition flex-shrink-0">
          ← Back
        </button>
        <button
          onClick={handlePayment}
          disabled={loading || !selectedMethod || !phone || phone.length < 9}
          className="flex-1 bg-primary hover:bg-secondary text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 text-base"
        >
          {loading
            ? <><FaSpinner className="animate-spin" /> {t('processing')}</>
            : `${t('payNow')} ${plan.price} FCFA`
          }
        </button>
      </div>

      <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <FaLock className="text-green-500" />
          <span>{t('securePayment')}</span>
        </div>
        <div className="flex items-center gap-1">
          <FaShieldAlt className="text-green-500" />
          <span>{t('dataProtected')}</span>
        </div>
      </div>
    </div>
  );
}

function Step3({ phone, selectedMethod }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const color = selectedMethod === 'mtn' ? '#FFCC00' : '#FF6600';

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm text-center border border-gray-100">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: color }}>
        <FaCheck className="text-white text-3xl" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('paymentInitiated')}</h2>
      <p className="text-gray-600 mb-1">
        {t('requestSentTo')} <strong>+237 {phone}</strong>
      </p>
      <p className="text-gray-500 text-sm mb-6">{t('checkPhone')}</p>

      <div className={`rounded-xl p-4 mb-4 ${
        selectedMethod === 'mtn' ? 'bg-yellow-50 border border-yellow-200' : 'bg-orange-50 border border-orange-200'
      }`}>
        <p className={`text-sm font-medium ${selectedMethod === 'mtn' ? 'text-yellow-700' : 'text-orange-700'}`}>
          ⏳ Your account will upgrade to Pro automatically within 5 minutes.
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
        <p className="text-xs font-bold text-gray-700">{t('whatHappensNext')}</p>
        {[t('approvePayment'), t('receiveConfirmation'), t('accountUpgrades')].map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs">
              {i + 1}
            </span>
            {step}
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/dashboard')}
        className="w-full bg-primary hover:bg-secondary text-white font-bold py-3 rounded-xl transition"
      >
        {t('returnToDashboard')}
      </button>
    </div>
  );
}

function Payment() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);
  const [paymentReference, setPaymentReference] = useState(null);

  // When student clicks Pay
const handlePayment = async () => {
  try {
    setLoading(true);
    setError(null);

    const res = await API.post(
      '/api/payment/initiate',
      {
        phone: phone,
        network: selectedMethod, // 'mtn' or 'orange'
        plan: selectedPlan,      // 'monthly' or 'yearly'
      },
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );

    setPaymentReference(res.data.reference);
    setStep(3);
    toast.success('Payment prompt sent to your phone!');

  } catch (err) {
    setError(err.response?.data?.message || 'Payment failed. Try again.');
  }
  setLoading(false);
};

// When student clicks "I have approved"
const handleVerify = async () => {
  try {
    setLoading(true);
    const res = await API.get(
      `/api/payment/verify/${paymentReference}`,
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );

    if (res.data.status === 'complete') {
      toast.success('You are now Pro!');
      navigate('/dashboard');
    } else {
      setError('Payment not yet confirmed. Please approve on your phone first.');
    }
  } catch (err) {
    setError('Could not verify. Try again in a moment.');
  }
  setLoading(false);
};
  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-white shadow-sm px-4 md:px-8 py-4 flex items-center gap-4">
        <button
          onClick={() => step === 1 ? navigate(-1) : setStep(step - 1)}
          className="text-gray-500 hover:text-primary transition"
        >
          <FaArrowLeft className="text-xl" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{t('upgradeToPro')}</h1>
          <p className="text-gray-500 text-sm">{t('noCardNeeded')}</p>
        </div>
      </div>

      {step < 3 && <StepIndicator step={step} />}

      <div className="max-w-lg mx-auto p-4 md:p-8">
        {step === 1 && (
          <Step1
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
            setStep={setStep}
          />
        )}
        {step === 2 && (
          <Step2
            selectedPlan={selectedPlan}
            selectedMethod={selectedMethod}
            setSelectedMethod={setSelectedMethod}
            phone={phone}
            setPhone={setPhone}
            loading={loading}
            error={error}
            setError={setError}
            handlePayment={handlePayment}
            setStep={setStep}
          />
        )}
        {step === 3 && (
          <Step3 phone={phone} selectedMethod={selectedMethod} onVerify={handleVerify} loading={loading} error={error} />
        )}
      </div>
    </div>
  );
}

export default Payment;