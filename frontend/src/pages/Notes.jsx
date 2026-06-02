import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
  FaBookOpen, FaUpload, FaTrash,
  FaFilePdf, FaFileWord, FaFileAlt, FaImage,
  FaArrowLeft, FaSearch, FaSpinner, FaChevronLeft
} from 'react-icons/fa';
import { getToken } from '../services/authService';
import API from '../services/api';

function Notes() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeSubject, setActiveSubject] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [notesRes, subjectsRes] = await Promise.all([
        API.get('/api/notes', { headers }),
        API.get('/api/notes/subjects', { headers }),
      ]);
      setNotes(notesRes.data.notes || []);
      setSubjects(subjectsRes.data.subjects || []);
    } catch (error) {
      toast.error('Failed to load notes');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const deleteNote = async id => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await API.delete(`/api/notes/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setNotes(prev => prev.filter(n => n._id !== id));
      if (selectedNote?._id === id) {
        setSelectedNote(null);
        setShowDetail(false);
      }
      toast.success('Note deleted!');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const getFileIcon = type => {
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

  const openNote = note => {
    setSelectedNote(note);
    setShowDetail(true);
  };

  // ── DETAIL VIEW ──
  if (showDetail && selectedNote) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow-sm px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => { setShowDetail(false); setSelectedNote(null); }}
            className="text-gray-500 hover:text-primary transition"
          >
            <FaChevronLeft className="text-xl" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-800 truncate">
              {selectedNote.title}
            </h1>
            <p className="text-gray-500 text-xs truncate">
              {selectedNote.subjectId?.name}
              {selectedNote.courseLevel && ` — ${selectedNote.courseLevel}`}
            </p>
          </div>
          <button
            onClick={() => navigate(`/quiz?noteId=${selectedNote._id}`)}
            className="bg-primary text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-secondary transition flex-shrink-0"
          >
            {t('quizButton')}
          </button>
        </div>

        <div className="p-4 space-y-4 max-w-2xl mx-auto">

          {/* Note Info */}
          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="text-2xl">{getFileIcon(selectedNote.fileType)}</div>
            <div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full uppercase">
                {selectedNote.fileType}
              </span>
              <p className="text-xs text-gray-400 mt-0.5">
                {t('uploadedOn')} {new Date(selectedNote.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* AI Summary */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              🤖 {t('aiSummary')}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {selectedNote.summary || t('noSummary')}
            </p>
          </div>

          {/* Key Topics */}
          {selectedNote.keyTopics?.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3">📌 {t('keyTopics')}</h3>
              <div className="flex flex-wrap gap-2">
                {selectedNote.keyTopics.map((topic, i) => (
                  <span
                    key={i}
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* References */}
          {selectedNote.references?.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3">📚 {t('references')}</h3>
              <ul className="space-y-2">
                {selectedNote.references.map((ref, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
                    <span className="text-primary font-bold flex-shrink-0">{i + 1}.</span>
                    {ref}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Content Preview */}
          {selectedNote.rawText && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3">📄 {t('contentPreview')}</h3>
              <div className="bg-gray-50 rounded-xl p-3 max-h-48 overflow-y-auto">
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedNote.rawText.slice(0, 800)}
                  {selectedNote.rawText.length > 800 && '...'}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pb-6">
            <button
              onClick={() => navigate(`/quiz?noteId=${selectedNote._id}`)}
              className="bg-primary text-white font-bold py-3 rounded-xl hover:bg-secondary transition text-sm"
            >
              {t('generateQuiz')} →
            </button>
            <button
              onClick={() => deleteNote(selectedNote._id)}
              className="bg-red-50 text-red-500 font-bold py-3 rounded-xl hover:bg-red-100 transition text-sm border border-red-200"
            >
              {t('deleteNote')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-white shadow-sm px-4 md:px-8 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-500 hover:text-primary transition"
        >
          <FaArrowLeft className="text-xl" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">{t('myNotesTitle')}</h1>
          <p className="text-gray-500 text-sm">
            {notes.length} {t('notesCount')}
          </p>
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="bg-primary text-white px-3 py-2 rounded-xl text-xs font-medium hover:bg-secondary transition flex items-center gap-1"
        >
          <FaUpload className="text-xs" /> {t('uploadNote')}
        </button>
      </div>

      {/* Search */}
      <div className="px-4 md:px-8 py-3 bg-white border-b border-gray-100">
        <div className="relative max-w-lg">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchNotes')}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-secondary"
          />
        </div>
      </div>

      {/* Subject Filter */}
      <div className="px-4 md:px-8 py-2 bg-white border-b border-gray-100">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveSubject('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex-shrink-0 ${
              activeSubject === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {t('allNotes')}
          </button>
          {subjects.map(sub => (
            <button
              key={sub._id}
              onClick={() => setActiveSubject(sub._id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex-shrink-0 ${
                activeSubject === sub._id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      <div className="p-4 md:p-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <FaSpinner className="animate-spin text-primary text-3xl" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FaBookOpen className="text-5xl mb-3 opacity-30" />
            <p className="text-sm text-center mb-4">{t('noNotesFound')}</p>
            <button
              onClick={() => navigate('/upload')}
              className="bg-primary text-white px-6 py-2 rounded-xl text-sm hover:bg-secondary transition"
            >
              {t('uploadNote')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map(note => (
              <div
                key={note._id}
                onClick={() => openNote(note)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-primary transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getFileIcon(note.fileType)}
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase">
                      {note.fileType}
                    </span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteNote(note._id); }}
                    className="text-gray-300 hover:text-red-500 transition p-1"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>

                <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-2">
                  {note.title}
                </h3>
                <p className="text-xs text-gray-500 mb-2">
                  {note.subjectId?.name || 'Unknown'}
                  {note.courseLevel && ` — ${note.courseLevel}`}
                </p>

                {note.summary && (
                  <p className="text-xs text-gray-400 line-clamp-3 mb-3 leading-relaxed">
                    {note.summary}
                  </p>
                )}

                {note.keyTopics?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {note.keyTopics.slice(0, 3).map((topic, i) => (
                      <span
                        key={i}
                        className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                    {note.keyTopics.length > 3 && (
                      <span className="text-gray-400 text-xs">
                        +{note.keyTopics.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/quiz?noteId=${note._id}`); }}
                    className="text-xs bg-primary text-white px-3 py-1 rounded-full hover:bg-secondary transition font-medium"
                  >
                    {t('quizButton')}
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

export default Notes;