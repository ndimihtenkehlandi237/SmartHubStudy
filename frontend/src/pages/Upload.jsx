import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
  FaArrowLeft, FaUpload, FaFilePdf, FaFileWord,
  FaFileAlt, FaImage, FaSpinner, FaPlus, FaCheck,
  FaTimes
} from 'react-icons/fa';
import { getToken, getUser } from '../services/authService';
import API from '../services/api';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/webp',
];

const COURSE_LEVELS = [
  'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5',
  'Masters 1', 'Masters 2', 'PhD',
];

function Upload() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = getUser();
  const fileInputRef = useRef(null);
  const isPro = user?.plan === 'pro';

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [courseLevel, setCourseLevel] = useState('Year 1');
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedNote, setUploadedNote] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);

  const [showNewSubject, setShowNewSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [creatingSubject, setCreatingSubject] = useState(false);

  const FREE_LIMIT = 5;

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await API.get('/api/notes/subjects', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setSubjects(res.data.subjects || []);
    } catch (error) {
      console.error('Fetch subjects error:', error.message);
    }
  }, []);

  const fetchUploadCount = useCallback(async () => {
    try {
      const res = await API.get('/api/notes', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
      const recent = (res.data.notes || []).filter(
        n => new Date(n.createdAt).getTime() >= sixHoursAgo
      );
      setUploadCount(recent.length);
    } catch (error) {
      console.error('Upload count error:', error.message);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
    fetchUploadCount();
  }, [fetchSubjects, fetchUploadCount]);

  const getFileType = file => {
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.includes('word') || file.name.endsWith('.docx')) return 'docx';
    if (file.type === 'text/plain') return 'txt';
    if (file.type.startsWith('image/')) return 'image';
    return 'txt';
  };

  const handleFileSelect = file => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.endsWith('.docx')) {
      toast.error('File type not supported. Use PDF, DOCX, TXT or Image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum 10MB.');
      return;
    }
    setSelectedFile(file);
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
  };

  const handleDrop = e => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const createSubject = async () => {
    if (!newSubjectName.trim()) { toast.error('Please enter a subject name'); return; }
    setCreatingSubject(true);
    try {
      const res = await API.post(
        '/api/notes/subjects',
        { name: newSubjectName.trim() },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setSubjects(prev => [...prev, res.data.subject]);
      setSelectedSubject(res.data.subject._id);
      setNewSubjectName('');
      setShowNewSubject(false);
      toast.success('Subject created!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create subject');
    }
    setCreatingSubject(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) { toast.error('Please select a file'); return; }
    if (!selectedSubject) { toast.error('Please select or create a subject'); return; }
    if (!title.trim()) { toast.error('Please enter a title'); return; }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', title.trim());
    formData.append('subjectId', selectedSubject);
    formData.append('courseLevel', courseLevel);

    try {
      const res = await API.post('/api/notes/upload', formData, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: e => {
          const progress = Math.round((e.loaded * 100) / e.total);
          setUploadProgress(progress);
        },
      });
      setUploadedNote(res.data.note);
      setUploadCount(prev => prev + 1);
      toast.success(t('uploadSuccess'));
    } catch (error) {
      const code = error.response?.data?.code;
      const message = error.response?.data?.message;
      if (code === 'FREE_LIMIT_REACHED') {
        toast.error('Free plan limit reached! Upgrade to Pro for unlimited uploads.');
        navigate('/payment');
      } else {
        toast.error(message || 'Upload failed. Please try again.');
      }
    }
    setUploading(false);
    setUploadProgress(0);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setTitle('');
    setUploadedNote(null);
    setUploadProgress(0);
  };

  const fileType = selectedFile ? getFileType(selectedFile) : null;

  const fileIconMap = {
    pdf: <FaFilePdf className="text-red-500 text-3xl" />,
    docx: <FaFileWord className="text-blue-500 text-3xl" />,
    txt: <FaFileAlt className="text-gray-500 text-3xl" />,
    image: <FaImage className="text-green-500 text-3xl" />,
  };

  // ── SUCCESS SCREEN ──
  if (uploadedNote) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow-sm px-4 md:px-8 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/notes')} className="text-gray-500 hover:text-primary transition">
            <FaArrowLeft className="text-xl" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Upload Successful!</h1>
        </div>

        <div className="max-w-lg mx-auto p-6 space-y-4">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheck className="text-green-500 text-3xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Note Uploaded! 🎉</h2>
            <p className="text-gray-500 mb-1 font-medium">{uploadedNote.title}</p>
            <p className="text-gray-400 text-sm mb-6">
              AI is processing your note. Summary and quiz will be ready shortly.
            </p>

            {uploadedNote.summary && (
              <div className="bg-blue-50 rounded-xl p-4 text-left mb-4">
                <p className="text-xs font-bold text-blue-600 mb-2">🤖 {t('aiSummary')}</p>
                <p className="text-blue-800 text-sm leading-relaxed">{uploadedNote.summary}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/notes')}
                className="bg-primary text-white font-bold py-3 rounded-xl hover:bg-secondary transition text-sm"
              >
                {t('myNotesTitle')}
              </button>
              <button
                onClick={() => navigate(`/quiz?noteId=${uploadedNote._id}`)}
                className="bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition text-sm"
              >
                {t('generateQuiz')} →
              </button>
            </div>

            <button
              onClick={resetForm}
              className="w-full mt-3 text-gray-400 hover:text-gray-600 text-sm transition"
            >
              Upload Another Note
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN UPLOAD SCREEN ──
  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-white shadow-sm px-4 md:px-8 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-primary transition">
          <FaArrowLeft className="text-xl" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{t('uploadNotesTitle')}</h1>
          <p className="text-gray-500 text-sm">{t('uploadSubtitle')}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-4">

        {/* Free Plan Banner */}
        {!isPro && (
          <div className={`rounded-2xl p-4 flex items-center justify-between ${
            uploadCount >= FREE_LIMIT
              ? 'bg-red-50 border-2 border-red-300'
              : uploadCount >= 3
              ? 'bg-yellow-50 border-2 border-yellow-300'
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <div>
              <p className={`font-bold text-sm ${
                uploadCount >= FREE_LIMIT ? 'text-red-700' : uploadCount >= 3 ? 'text-yellow-700' : 'text-blue-700'
              }`}>
                {uploadCount >= FREE_LIMIT
                  ? '🚫 Upload limit reached for this 6-hour window'
                  : `📤 ${uploadCount}/${FREE_LIMIT} uploads used in last 6 hours`
                }
              </p>
              <p className={`text-xs mt-0.5 ${uploadCount >= FREE_LIMIT ? 'text-red-500' : 'text-blue-500'}`}>
                {uploadCount >= FREE_LIMIT
                  ? 'Wait 6 hours or upgrade to Pro'
                  : `${FREE_LIMIT - uploadCount} uploads remaining`
                }
              </p>
            </div>
            {uploadCount >= FREE_LIMIT && (
              <button
                onClick={() => navigate('/payment')}
                className="bg-primary text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-secondary transition flex-shrink-0 ml-3"
              >
                {t('upgradePro')}
              </button>
            )}
          </div>
        )}

        {/* Pro Badge */}
        {isPro && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 flex items-center gap-2">
            <span>⭐</span>
            <p className="text-yellow-700 text-sm font-medium">
              {t('proPlan')} — Unlimited {t('uploadNotes').toLowerCase()}
            </p>
          </div>
        )}

        {/* Drop Zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
            dragOver
              ? 'border-primary bg-blue-50'
              : selectedFile
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 bg-white hover:border-primary hover:bg-blue-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp"
            onChange={e => handleFileSelect(e.target.files[0])}
          />

          {selectedFile ? (
            <div className="space-y-2">
              <div className="flex justify-center">
                {fileIconMap[fileType] || fileIconMap.txt}
              </div>
              <p className="font-bold text-gray-800">{selectedFile.name}</p>
              <p className="text-gray-400 text-sm">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                onClick={e => { e.stopPropagation(); setSelectedFile(null); setTitle(''); }}
                className="text-red-400 hover:text-red-600 text-xs flex items-center gap-1 mx-auto"
              >
                <FaTimes /> Remove file
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                <FaUpload className="text-gray-400 text-2xl" />
              </div>
              <div>
                <p className="font-bold text-gray-700">
                  Drop your file here or click to browse
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  PDF, DOCX, TXT, JPG, PNG — Max 10MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Note Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Introduction to Data Structures"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 transition"
            />
          </div>

          {/* Subject */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                {t('selectSubject')} *
              </label>
              <button
                onClick={() => setShowNewSubject(!showNewSubject)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <FaPlus className="text-xs" /> {t('createSubject')}
              </button>
            </div>

            {showNewSubject && (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={e => setNewSubjectName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createSubject()}
                  placeholder="Subject name e.g. Mathematics"
                  className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 text-sm transition"
                />
                <button
                  onClick={createSubject}
                  disabled={creatingSubject}
                  className="bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-secondary transition flex items-center gap-1"
                >
                  {creatingSubject ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                </button>
              </div>
            )}

            {subjects.length === 0 ? (
              <div className="text-center py-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-gray-400 text-sm">No subjects yet.</p>
                <button
                  onClick={() => setShowNewSubject(true)}
                  className="text-primary text-sm hover:underline mt-1"
                >
                  {t('createSubject')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {subjects.map(sub => (
                  <button
                    key={sub._id}
                    onClick={() => setSelectedSubject(sub._id)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition text-left ${
                      selectedSubject === sub._id
                        ? 'border-primary bg-blue-50 text-primary'
                        : 'border-gray-200 text-gray-700 hover:border-primary'
                    }`}
                  >
                    {sub.name}
                    {selectedSubject === sub._id && (
                      <FaCheck className="float-right mt-0.5 text-xs" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Course Level */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('courseLevel')}
            </label>
            <div className="flex flex-wrap gap-2">
              {COURSE_LEVELS.map(level => (
                <button
                  key={level}
                  onClick={() => setCourseLevel(level)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition ${
                    courseLevel === level
                      ? 'border-primary bg-blue-50 text-primary'
                      : 'border-gray-200 text-gray-600 hover:border-primary'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={uploading || !selectedFile || !selectedSubject || !title || (!isPro && uploadCount >= FREE_LIMIT)}
          className="w-full bg-primary hover:bg-secondary text-white font-bold py-4 rounded-2xl transition text-lg shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {uploading ? (
            <><FaSpinner className="animate-spin" /> {t('uploading')} {uploadProgress > 0 && `${uploadProgress}%`}</>
          ) : (
            <><FaUpload /> Upload and Analyze with AI</>
          )}
        </button>

        {/* Progress Bar */}
        {uploading && uploadProgress > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{t('uploading')}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Formats */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-3">Supported formats:</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: <FaFilePdf className="text-red-500" />, label: 'PDF' },
              { icon: <FaFileWord className="text-blue-500" />, label: 'DOCX' },
              { icon: <FaFileAlt className="text-gray-500" />, label: 'TXT' },
              { icon: <FaImage className="text-green-500" />, label: 'Image' },
            ].map((fmt, i) => (
              <div key={i} className="flex flex-col items-center gap-1 p-2 bg-gray-50 rounded-xl">
                <span className="text-xl">{fmt.icon}</span>
                <span className="text-xs text-gray-500 font-medium">{fmt.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Upload;