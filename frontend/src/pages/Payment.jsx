import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaCheck, FaSpinner, FaLock, FaShieldAlt } from 'react-icons/fa';
import { getToken } from '../services/authService';
import API from '../services/api';

function Payment() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly',
      price: '2,000',
      period: '/month',
      features: [
        'Unlimited note uploads',
        '50+ AI quiz questions',
        'Full AI summarization',
        'Exam countdown planner',
        'Study groups',
        'Math solver',
      ]
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: '18,000',
      period: '/year',
      badge: 'Save 25%',
      features: [
        'Everything in Monthly',
        '3 months free',
        'Advanced analytics',
        'Offline mode priority',
        'Early access features',
        'VIP support',
      ]
    }
  ];

  const handlePayment = async () => {
    if (!phone) { toast.error('Please enter your phone number'); return; }
    if (phone.length < 9) { toast.error('Please enter a valid 9-digit number'); return; }
    if (!selectedMethod) { toast.error('Please select a payment method'); return; }
    setLoading(true);
    try {
      await API.post(`/api/payment/${selectedMethod}`,
        { phone, plan: selectedPlan },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setStep(3);
    } catch (error) {
      toast.error('Payment initiation failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-white shadow-sm px-4 md:px-8 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-primary transition">
          <FaArrowLeft className="text-xl" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Upgrade to Pro ⭐</h1>
          <p className="text-gray-500 text-sm">Pay with Mobile Money — No card needed</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 md:p-8 space-y-4">

        {/* STEP 1 — Choose Plan */}
        {step === 1 && (
          <>
            <p className="text-center text-gray-600 font-medium">Choose your plan</p>

            <div className="grid grid-cols-2 gap-3">
              {plans.map(plan => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`rounded-2xl p-4 border-2 cursor-pointer transition relative ${
                    selectedPlan === plan.id
                      ? 'border-primary bg-blue-50 shadow-lg'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {plan.badge}
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-800">{plan.name}</h3>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPlan === plan.id ? 'border-primary bg-primary' : 'border-gray-300'
                    }`}>
                      {selectedPlan === plan.id && <FaCheck className="text-white text-xs" />}
                    </div>
                  </div>
                  <p className="text-primary font-black text-xl">{plan.price}</p>
                  <p className="text-gray-400 text-xs">FCFA{plan.period}</p>
                  <ul className="mt-3 space-y-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1 text-xs text-gray-600">
                        <FaCheck className="text-green-500 flex-shrink-0 text-xs" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-primary hover:bg-secondary text-white font-bold py-4 rounded-2xl transition text-lg shadow-lg"
            >
              Continue →
            </button>
          </>
        )}

        {/* STEP 2 — Payment Method */}
        {step === 2 && (
          <>
            <div className="text-center">
              <p className="font-bold text-gray-800 text-lg">
                {selectedPlan === 'monthly' ? '2,000' : '18,000'} FCFA
                <span className="text-gray-400 text-sm font-normal ml-1">
                  {selectedPlan === 'monthly' ? '/month' : '/year'}
                </span>
              </p>
              <p className="text-gray-500 text-sm">Select your payment method</p>
            </div>

            {/* MTN Mobile Money */}
            <button
              onClick={() => setSelectedMethod('mtn')}
              className={`w-full rounded-2xl border-2 transition overflow-hidden ${
                selectedMethod === 'mtn' ? 'border-yellow-400 shadow-lg' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-4 p-4">
                {/* MTN Logo */}
                <div className="w-16 h-16 rounded-xl flex-shrink-0 flex flex-col items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #FFCC00 0%, #FF9900 100%)' }}>
                  <p className="font-black text-blue-900 text-lg leading-none tracking-wider">MTN</p>
                  <p className="text-blue-900 text-xs font-bold leading-none">MoMo</p>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-gray-800">MTN Mobile Money</p>
                  <p className="text-gray-500 text-sm">Pay with your MTN number</p>
                  <p className="text-yellow-600 text-xs font-medium mt-0.5">Available 24/7 • Instant</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedMethod === 'mtn' ? 'border-yellow-400 bg-yellow-400' : 'border-gray-300'
                }`}>
                  {selectedMethod === 'mtn' && <FaCheck className="text-white text-xs" />}
                </div>
              </div>
            </button>

            {/* Orange Money */}
            <button
              onClick={() => setSelectedMethod('orange')}
              className={`w-full rounded-2xl border-2 transition overflow-hidden ${
                selectedMethod === 'orange' ? 'border-orange-400 shadow-lg' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-4 p-4">
                {/* Orange Logo */}
                <div className="w-16 h-16 rounded-xl flex-shrink-0 flex flex-col items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #FF6600 0%, #FF4500 100%)' }}>
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full" style={{ background: '#FF6600' }} />
                  </div>
                  <p className="text-white text-xs font-bold leading-none mt-0.5">Orange</p>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-gray-800">Orange Money</p>
                  <p className="text-gray-500 text-sm">Pay with your Orange number</p>
                  <p className="text-orange-600 text-xs font-medium mt-0.5">Available 24/7 • Instant</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedMethod === 'orange' ? 'border-orange-400 bg-orange-400' : 'border-gray-300'
                }`}>
                  {selectedMethod === 'orange' && <FaCheck className="text-white text-xs" />}
                </div>
              </div>
            </button>

            {/* Phone Number */}
            {selectedMethod && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Enter your {selectedMethod === 'mtn' ? 'MTN' : 'Orange'} number
                </label>
                <div className="flex gap-2">
                  <div className="bg-gray-100 px-3 py-3 rounded-xl font-bold text-gray-700 text-sm flex items-center flex-shrink-0">
                    🇨🇲 +237
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    placeholder="6XX XXX XXX"
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 transition text-lg font-mono tracking-wider"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Enter your 9-digit {selectedMethod === 'mtn' ? 'MTN' : 'Orange'} number
                </p>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Plan</span>
                <span className="font-bold">{selectedPlan === 'monthly' ? 'Monthly Plan' : 'Yearly Plan'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Method</span>
                <span className="font-bold">
                  {selectedMethod === 'mtn' ? '📱 MTN MoMo' : selectedMethod === 'orange' ? '🟠 Orange Money' : '—'}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="font-bold text-gray-700">Total</span>
                <span className="font-black text-primary text-xl">
                  {selectedPlan === 'monthly' ? '2,000' : '18,000'} FCFA
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition">
                ← Back
              </button>
              <button
                onClick={handlePayment}
                disabled={loading || !selectedMethod || !phone || phone.length < 9}
                className="flex-1 bg-primary hover:bg-secondary text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading
                  ? <><FaSpinner className="animate-spin" /> Processing...</>
                  : `Pay ${selectedPlan === 'monthly' ? '2,000' : '18,000'} FCFA`
                }
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <FaLock className="text-green-500" />
              <span>Secure payment</span>
              <FaShieldAlt className="text-green-500 ml-2" />
              <span>Your data is protected</span>
            </div>
          </>
        )}

        {/* STEP 3 — Success */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center border border-gray-100">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheck className="text-green-500 text-3xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Initiated! 🎉</h2>
            <p className="text-gray-600 mb-1">
              Request sent to <strong>+237 {phone}</strong>
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Check your phone and approve the {selectedMethod === 'mtn' ? 'MTN Mobile Money' : 'Orange Money'} request to complete payment.
            </p>
            <div className={`rounded-xl p-4 mb-6 ${selectedMethod === 'mtn' ? 'bg-yellow-50 border border-yellow-200' : 'bg-orange-50 border border-orange-200'}`}>
              <p className={`text-sm font-medium ${selectedMethod === 'mtn' ? 'text-yellow-700' : 'text-orange-700'}`}>
                ⏳ Your account will be upgraded to Pro automatically within 5 minutes after payment confirmation.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-primary hover:bg-secondary text-white font-bold py-3 rounded-xl transition"
            >
              Return to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default Payment;