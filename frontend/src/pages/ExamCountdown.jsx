import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaArrowLeft, FaPlus, FaTrash,
  FaSpinner, FaGraduationCap, FaBell
} from 'react-icons/fa';
import { getToken } from '../services/authService';
import API from '../services/api';

function ExamCountdown() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(new Date());
  const [formData, setFormData] = useState({
    examName: '',
    subjectId: '',
    examDate: '',
    notifyEnabled: true,
  });

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [examsRes, subjectsRes] = await Promise.all([
        API.get('/api/exams', { headers }),
        API.get('/api/notes/subjects', { headers }),
      ]);
      setExams(examsRes.data.exams);
      setSubjects(subjectsRes.data.subjects);
    } catch (error) {
      toast.error('Failed to load exams');
    }
    setLoading(false);
  };

  const getTimeLeft = (examDate) => {
    const diff = new Date(examDate) - now;
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds, expired: false };
  };

  const getUrgencyColor = (days) => {
    if (days <= 3) return 'from-red-500 to-red-700';
    if (days <= 7) return 'from-orange-500 to-orange-700';
    if (days <= 14) return 'from-yellow-500 to-yellow-700';
    return 'from-primary to-secondary';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.examName || !formData.examDate) { toast.error('Please fill in all required fields'); return; }
    if (new Date(formData.examDate) <= new Date()) { toast.error('Exam date must be in the future'); return; }
    setSaving(true);
    try {
      const res = await API.post('/api/exams', formData, { headers: { Authorization: `Bearer ${getToken()}` } });
      setExams([...exams, res.data.exam]);
      setFormData({ examName: '', subjectId: '', examDate: '', notifyEnabled: true });
      setShowForm(false);
      toast.success('Exam countdown added! 🎓');
    } catch (error) {
      toast.error('Failed to add exam');
    }
    setSaving(false);
  };

  const deleteExam = async (id) => {
    if (!window.confirm('Delete this exam countdown?')) return;
    try {
      await API.delete(`/api/exams/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setExams(exams.filter(e => e._id !== id));
      toast.success('Exam deleted');
    } catch (error) {
      toast.error('Failed to delete exam');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><FaSpinner className="animate-spin text-primary text-4xl" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-primary transition">
            <FaArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Exam Countdown</h1>
            <p className="text-gray-500 text-sm">Track your upcoming examinations</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary transition flex items-center gap-2">
          <FaPlus /> Add Exam
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-8 space-y-6">
        {showForm && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg mb-4">Add New Exam</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Exam Name *</label>
                <input
                  type="text"
                  value={formData.examName}
                  onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
                  placeholder="e.g. Data Structures Final Exam"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject (Optional)</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 transition"
                  >
                    <option value="">Select subject</option>
                    {subjects.map(sub => <option key={sub._id} value={sub._id}>{sub.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Exam Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.examDate}
                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 transition"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notify"
                  checked={formData.notifyEnabled}
                  onChange={(e) => setFormData({ ...formData, notifyEnabled: e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor="notify" className="text-sm text-gray-700 font-medium">Enable study reminders for this exam</label>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-secondary text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
                  {saving ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                  {saving ? 'Adding...' : 'Add Exam'}
                </button>
              </div>
            </form>
          </div>
        )}

        {exams.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <FaGraduationCap className="text-6xl text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">No Exams Added Yet</h3>
            <p className="text-gray-400 mb-6">Add your upcoming exams to track countdown timers</p>
            <button onClick={() => setShowForm(true)} className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-secondary transition">
              + Add Your First Exam
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {exams.map(exam => {
              const timeLeft = getTimeLeft(exam.examDate);
              return (
                <div key={exam._id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                  <div className={`bg-gradient-to-r ${getUrgencyColor(timeLeft.days)} p-5 text-white`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{exam.examName}</h3>
                        <p className="text-white text-sm mt-1 flex items-center gap-2">
                          <FaGraduationCap />
                          {exam.subjectId?.name || 'General Exam'} • {new Date(exam.examDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                      <button onClick={() => deleteExam(exam._id)} className="text-white opacity-70 hover:opacity-100 transition p-2">
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  <div className="p-5">
                    {timeLeft.expired ? (
                      <div className="text-center py-4">
                        <p className="text-gray-500 font-semibold">This exam has passed</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-4 gap-3 mb-4">
                          {[
                            { value: timeLeft.days, label: 'Days' },
                            { value: timeLeft.hours, label: 'Hours' },
                            { value: timeLeft.minutes, label: 'Minutes' },
                            { value: timeLeft.seconds, label: 'Seconds' },
                          ].map((item) => (
                            <div key={item.label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                              <p className="text-3xl font-bold text-primary">{String(item.value).padStart(2, '0')}</p>
                              <p className="text-xs text-gray-500 mt-1 font-medium">{item.label}</p>
                            </div>
                          ))}
                        </div>
                        <div className={`text-center text-sm font-semibold py-2 px-4 rounded-xl ${
                          timeLeft.days <= 3 ? 'bg-red-50 text-red-600' :
                          timeLeft.days <= 7 ? 'bg-orange-50 text-orange-600' :
                          timeLeft.days <= 14 ? 'bg-yellow-50 text-yellow-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {timeLeft.days <= 3 ? '🚨 Exam is very close! Study intensively now!' :
                           timeLeft.days <= 7 ? '⚠️ One week left! Increase your study pace!' :
                           timeLeft.days <= 14 ? '📚 Two weeks remaining. Stay consistent!' :
                           '✅ Good amount of time. Study steadily every day!'}
                        </div>
                        {exam.notifyEnabled && (
                          <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                            <FaBell className="text-primary" />
                            Study reminders are enabled for this exam
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ExamCountdown;