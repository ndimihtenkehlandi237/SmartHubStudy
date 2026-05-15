import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaUpload, FaFilePdf, FaFileWord, FaFileAlt,
  FaImage, FaArrowLeft, FaSpinner
} from 'react-icons/fa';
import { getToken } from '../services/authService';
import axios from 'axios';

function Upload() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    subjectId: '',
    courseLevel: '',
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await axios.get('/api/notes/subjects', {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setSubjects(res.data.subjects);
    } catch (error) {
      console.error('Error fetching subjects');
    }
  };

  const createSubject = async () => {
    if (!newSubjectName.trim()) {
      toast.error('Please enter a subject name');
      return;
    }
    try {
      const res = await axios.post('/api/notes/subjects',
        { name: newSubjectName },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setSubjects([...subjects, res.data.subject]);
      setFormData({ ...formData, subjectId: res.data.subject._id });
      setNewSubjectName('');
      setShowNewSubject(false);
      toast.success('Subject created!');
    } catch (error) {
      toast.error('Failed to create subject');
    }
  };

  const getFileIcon = (file) => {
    if (!file) return <FaUpload className="text-5xl text-gray-300" />;
    if (file.type === 'application/pdf') return <FaFilePdf className="text-5xl text-red-500" />;
    if (file.type.includes('wordprocessingml')) return <FaFileWord className="text-5xl text-blue-500" />;
    if (file.type === 'text/plain') return <FaFileAlt className="text-5xl text-gray-500" />;
    if (file.type.startsWith('image/')) return <FaImage className="text-5xl text-green-500" />;
    return <FaFileAlt className="text-5xl text-gray-400" />;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) { toast.error('Please select a file'); return; }
    if (!formData.title) { toast.error('Please enter a title'); return; }
    if (!formData.subjectId) { toast.error('Please select a subject'); return; }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('file', selectedFile);
      data.append('title', formData.title);
      data.append('subjectId', formData.subjectId);
      data.append('courseLevel', formData.courseLevel);

       await axios.post('/api/notes/upload', data, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Note uploaded and summarized successfully! 🎉');
      navigate(`/notes`);
    } catch (error) {
      const message = error.response?.data?.message || 'Upload failed';
      toast.error(message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-white shadow-sm px-8 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-500 hover:text-primary transition"
        >
          <FaArrowLeft className="text-xl" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Upload Notes</h1>
          <p className="text-gray-500 text-sm">Upload your notes and let AI summarize them</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* File Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput').click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${
              dragOver ? 'border-primary bg-blue-50' :
              selectedFile ? 'border-green-400 bg-green-50' :
              'border-gray-300 bg-white hover:border-primary hover:bg-blue-50'
            }`}
          >
            <input
              id="fileInput"
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
            <div className="flex flex-col items-center gap-3">
              {getFileIcon(selectedFile)}
              {selectedFile ? (
                <>
                  <p className="font-bold text-gray-800">{selectedFile.name}</p>
                  <p className="text-gray-500 text-sm">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="text-green-600 text-sm font-medium">✅ File ready to upload</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-gray-700">Drag & drop your file here</p>
                  <p className="text-gray-500 text-sm">or click to browse</p>
                  <div className="flex gap-2 mt-2 flex-wrap justify-center">
                    {['PDF', 'DOCX', 'TXT', 'JPG', 'PNG'].map(f => (
                      <span key={f} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                        {f}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Note Title */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Note Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Chapter 3 — Data Structures"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 transition"
            />
          </div>

          {/* Subject Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Subject *
              </label>
              <button
                type="button"
                onClick={() => setShowNewSubject(!showNewSubject)}
                className="text-xs text-secondary hover:underline font-medium"
              >
                + Create New Subject
              </button>
            </div>

            {showNewSubject && (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g. Mathematics"
                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 text-sm"
                />
                <button
                  type="button"
                  onClick={createSubject}
                  className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary transition"
                >
                  Create
                </button>
              </div>
            )}

            {subjects.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">
                No subjects yet. Create one above!
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {subjects.map(subject => (
                  <button
                    key={subject._id}
                    type="button"
                    onClick={() => setFormData({ ...formData, subjectId: subject._id })}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition ${
                      formData.subjectId === subject._id
                        ? 'border-primary bg-blue-50 text-primary'
                        : 'border-gray-200 text-gray-700 hover:border-primary'
                    }`}
                  >
                    {subject.name}
                    <span className="block text-xs text-gray-400 font-normal">
                      {subject.noteCount} notes
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Course Level */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Course Level (Optional)
            </label>
            <input
              type="text"
              value={formData.courseLevel}
              onChange={(e) => setFormData({ ...formData, courseLevel: e.target.value })}
              placeholder="e.g. Mathematics 1, English 2, Data Structures 3"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 transition"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-secondary text-white font-bold py-4 rounded-2xl transition duration-300 text-lg shadow-lg flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Uploading & Summarizing...
              </>
            ) : (
              <>
                <FaUpload />
                Upload & Summarize with AI
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}

export default Upload;