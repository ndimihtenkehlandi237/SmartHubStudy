import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
  FaArrowLeft, FaPlus, FaTrash,
  FaSpinner, FaGraduationCap, FaFire, FaBell
} from 'react-icons/fa';
import { getToken } from '../services/authService';
import API from '../services/api';

function ExamCountdown() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [exams, setExams] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(new Date());
  const [formData, setFormData] = useState({
    name: '', date: '', subject: '', notes: '',
  });

  useEffect(() => {
    const ticker = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(ticker);
  }, []);

  const fetchExams = useCallback(async () => {
    try {
      const res = await API.get('/api/exams', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setExams(res.data.exams || []);
    } catch (error) {
      console.error('Fetch exams error:', error.message);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.name || !formData.date) {
      toast.error('Please enter exam name and date');
      return;
    }
    if (new Date(formData.date) <= new Date()) {
      toast.error('Please select a future date');
      return;
    }
    setSaving(true);
    try {
      const res = await API.post('/api/exams', formData, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setExams(prev => [...prev, res.data.exam]);
      setFormData({ name: '', date: '', subject: '', notes: '' });
      setShowForm(false);
      toast.success('Exam added! 🎓');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add exam');
    }
    setSaving(false);
  };

  const deleteExam = async id => {
    if (!window.confirm('Delete this exam?')) return;
    try {
      await API.delete(`/api/exams/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setExams(prev => prev.filter(e => e._id !== id));
      toast.success('Exam deleted');
    } catch (error) {
      toast.error('Failed to delete exam');
    }
  };

  const getCountdown = examDate => {
    const diff = new Date(examDate) - now;
    if (diff <= 0) return null;
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      total: diff,
    };
  };

  const getUrgencyBorder = cd => {
    if (!cd) return 'bg-gray-100 border-gray-300';
    if (cd.days === 0) return 'bg-red-50 border-red-400';
    if (cd.days <= 3) return 'bg-orange-50 border-orange-400';
    if (cd.days <= 7) return 'bg-yellow-50 border-yellow-400';
    return 'bg-green-50 border-green-300';
  };

  const getUrgencyHeader = cd => {
    if (!cd) return 'bg-gray-500';
    if (cd.days === 0) return 'bg-gradient-to-r from-red-500 to-red-600';
    if (cd.days <= 3) return 'bg-gradient-to-r from-orange-500 to-red-500';
    if (cd.days <= 7) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    return 'bg-gradient-to-r from-green-500 to-emerald-600';
  };

  const getUrgencyColor = cd => {
    if (!cd) return 'text-gray-500';
    if (cd.days === 0) return 'text-red-500';
    if (cd.days <= 3) return 'text-orange-500';
    if (cd.days <= 7) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUrgencyMsg = cd => {
    if (!cd) return t('examPassedLabel');
    if (cd.days === 0) return t('todayLabel');
    if (cd.days === 1) return t('tomorrowLabel');
    if (cd.days <= 3) return 'Very soon! Study hard!';
    if (cd.days <= 7) return 'One week left. Keep going!';
    return 'You have time. Stay consistent!';
  };

  const upcoming = exams.filter(e => new Date(e.date) > now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const passed = exams.filter(e => new Date(e.date) <= now);

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-white shadow-sm px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-primary transition">
            <FaArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{t('examCountdownTitle')}</h1>
            <p className="text-gray-500 text-sm">
              {upcoming.length} upcoming
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary transition flex items-center gap-2"
        >
          <FaPlus className="text-xs" /> {t('addExamBtn')}
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-4">

        {/* Add Exam Form */}
        {showForm && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg mb-4">
              📝 {t('addExamBtn')}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('examNameLabel')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Software Engineering Final Exam"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('examDateLabel')} *
                </label>
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Computer Science"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Study Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Topics to focus on..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 transition resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary hover:bg-secondary text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  {saving ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                  {saving ? 'Adding...' : t('addExamBtn')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Empty State */}
        {exams.length === 0 && (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center border border-gray-100">
            <FaGraduationCap className="text-6xl text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">{t('noExamsYet')}</h3>
            <p className="text-gray-400 mb-6">{t('addFirstExam')}</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-secondary transition"
            >
              {t('addExamBtn')}
            </button>
          </div>
        )}

        {/* Upcoming Exams */}
        {upcoming.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide px-1">
              📅 Upcoming ({upcoming.length})
            </h2>
            {upcoming.map(exam => {
              const cd = getCountdown(exam.date);
              return (
                <div
                  key={exam._id}
                  className={`rounded-2xl border-2 overflow-hidden shadow-sm ${getUrgencyBorder(cd)}`}
                >
                  {/* Header */}
                  <div className={`${getUrgencyHeader(cd)} p-4 text-white`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg truncate">{exam.name}</h3>
                        {exam.subject && (
                          <p className="text-white opacity-80 text-sm">📚 {exam.subject}</p>
                        )}
                        <p className="text-white opacity-70 text-xs mt-1">
                          {new Date(exam.date).toLocaleDateString('en-GB', {
                            weekday: 'long', year: 'numeric', month: 'long',
                            day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteExam(exam._id)}
                        className="text-white opacity-70 hover:opacity-100 ml-2 flex-shrink-0 p-1"
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  </div>

                  {/* Countdown */}
                  <div className="p-4">
                    {cd && (
                      <>
                        <p className="text-center text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                          {getUrgencyMsg(cd)}
                        </p>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          {[
                            { value: cd.days, label: t('days') },
                            { value: cd.hours, label: 'Hours' },
                            { value: cd.minutes, label: 'Mins' },
                            { value: cd.seconds, label: 'Secs' },
                          ].map((unit, i) => (
                            <div key={i} className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
                              <p className={`text-2xl md:text-3xl font-black ${getUrgencyColor(cd)}`}>
                                {String(unit.value).padStart(2, '0')}
                              </p>
                              <p className="text-gray-400 text-xs font-medium mt-0.5">
                                {unit.label}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Progress Bar */}
                        {(() => {
                          const created = new Date(exam.createdAt || Date.now() - 86400000);
                          const total = new Date(exam.date) - created;
                          const remaining = new Date(exam.date) - now;
                          const pct = Math.max(0, Math.min(100, ((total - remaining) / total) * 100));
                          return (
                            <div className="mb-3">
                              <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Added</span>
                                <span>{Math.round(pct)}% of time passed</span>
                                <span>Exam Day</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${getUrgencyColor(cd).replace('text-', 'bg-')}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}

                    {exam.notes && (
                      <div className="bg-white rounded-xl p-3 border border-gray-100 mt-2">
                        <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                          <FaBell className="text-primary" /> Study Notes
                        </p>
                        <p className="text-gray-600 text-sm">{exam.notes}</p>
                      </div>
                    )}

                    <button
                      onClick={() => navigate('/notes')}
                      className="w-full mt-3 bg-primary text-white font-bold py-2.5 rounded-xl hover:bg-secondary transition text-sm flex items-center justify-center gap-2"
                    >
                      <FaFire /> Study Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Passed Exams */}
        {passed.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-bold text-gray-400 text-sm uppercase tracking-wide px-1">
              ✅ {t('examPassedLabel')} ({passed.length})
            </h2>
            {passed.map(exam => (
              <div key={exam._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 opacity-60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-gray-400 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FaGraduationCap className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-600 truncate">{exam.name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(exam.date).toLocaleDateString()} — {t('examPassedLabel')}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => deleteExam(exam._id)} className="text-gray-300 hover:text-red-400 transition ml-2 flex-shrink-0">
                    <FaTrash className="text-sm" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default ExamCountdown;