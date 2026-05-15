import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaBookOpen, FaUpload, FaTrash, FaEye,
  FaFilePdf, FaFileWord, FaFileAlt, FaImage,
  FaArrowLeft, FaSearch, FaSpinner
} from 'react-icons/fa';
import { getToken } from '../services/authService';
import axios from 'axios';

function Notes() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

const fetchData = async () => {
  try {
    const [notesRes, subjectsRes] = await Promise.all([
      axios.get('/api/notes', { headers: { Authorization: `Bearer ${getToken()}` } }),
      axios.get('/api/notes/subjects', { headers: { Authorization: `Bearer ${getToken()}` } })
    ]);
    setNotes(notesRes.data.notes);
    setSubjects(subjectsRes.data.subjects);
  } catch (error) {
    toast.error('Failed to load notes');
  }
  setLoading(false);
};

  const deleteNote = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await axios.delete(`/api/notes/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setNotes(notes.filter(n => n._id !== id));
      if (selectedNote?._id === id) setSelectedNote(null);
      toast.success('Note deleted!');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const getFileIcon = (type) => {
    if (type === 'pdf') return <FaFilePdf className="text-red-500" />;
    if (type === 'docx') return <FaFileWord className="text-blue-500" />;
    if (type === 'image') return <FaImage className="text-green-500" />;
    return <FaFileAlt className="text-gray-500" />;
  };

  const filteredNotes = notes.filter(note => {
    const matchSubject = activeSubject === 'all' || note.subjectId?._id === activeSubject;
    const matchSearch = note.title.toLowerCase().includes(search.toLowerCase());
    return matchSubject && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* Header */}
      <div className="bg-white shadow-sm px-8 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-primary transition">
          <FaArrowLeft className="text-xl" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">My Notes</h1>
          <p className="text-gray-500 text-sm">{notes.length} notes uploaded</p>
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary transition flex items-center gap-2"
        >
          <FaUpload /> Upload Note
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* LEFT — Notes List */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">

          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-secondary"
              />
            </div>
          </div>

          {/* Subject Filter */}
          <div className="p-3 border-b border-gray-100 flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveSubject('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                activeSubject === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Notes
            </button>
            {subjects.map(sub => (
              <button
                key={sub._id}
                onClick={() => setActiveSubject(sub._id)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
                  activeSubject === sub._id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <FaSpinner className="animate-spin text-primary text-2xl" />
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 px-4">
                <FaBookOpen className="text-4xl mb-3 opacity-30" />
                <p className="text-sm text-center">No notes found. Upload your first note!</p>
                <button
                  onClick={() => navigate('/upload')}
                  className="mt-4 bg-primary text-white px-4 py-2 rounded-xl text-sm hover:bg-secondary transition"
                >
                  Upload Note
                </button>
              </div>
            ) : (
              filteredNotes.map(note => (
                <div
                  key={note._id}
                  onClick={() => setSelectedNote(note)}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition hover:bg-gray-50 ${
                    selectedNote?._id === note._id ? 'bg-blue-50 border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getFileIcon(note.fileType)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{note.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {note.subjectId?.name || 'Unknown Subject'}
                        {note.courseLevel && ` — ${note.courseLevel}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNote(note._id); }}
                      className="text-gray-300 hover:text-red-500 transition mt-1"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT — Note Detail */}
        <div className="flex-1 overflow-y-auto p-8">
          {selectedNote ? (
            <div className="max-w-3xl mx-auto space-y-6">

              {/* Note Header */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {getFileIcon(selectedNote.fileType)}
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full uppercase">
                        {selectedNote.fileType}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedNote.title}</h2>
                    <p className="text-gray-500 text-sm mt-1">
                      {selectedNote.subjectId?.name}
                      {selectedNote.courseLevel && ` — ${selectedNote.courseLevel}`}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Uploaded {new Date(selectedNote.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/quiz?noteId=${selectedNote._id}`)}
                    className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary transition"
                  >
                    Generate Quiz →
                  </button>
                </div>
              </div>

              {/* AI Summary */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2">
                  🤖 AI Summary
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {selectedNote.summary || 'No summary available.'}
                </p>
              </div>

              {/* Key Topics */}
              {selectedNote.keyTopics?.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-gray-800 text-lg mb-3">📌 Key Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedNote.keyTopics.map((topic, i) => (
                      <span key={i} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* References */}
              {selectedNote.references?.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-gray-800 text-lg mb-3">📚 References</h3>
                  <ul className="space-y-2">
                    {selectedNote.references.map((ref, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
                        <span className="text-primary font-bold mt-0.5">{i + 1}.</span>
                        {ref}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Raw Text Preview */}
              {selectedNote.rawText && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-gray-800 text-lg mb-3">📄 Note Content Preview</h3>
                  <div className="bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto">
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedNote.rawText.slice(0, 1000)}
                      {selectedNote.rawText.length > 1000 && '...'}
                    </p>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FaEye className="text-6xl mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a note to view details</p>
              <p className="text-sm mt-1">Click any note from the left panel</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Notes;