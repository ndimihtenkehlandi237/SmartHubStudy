import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
  FaBookOpen, FaUpload, FaTrash,
  FaFilePdf, FaFileWord, FaFileAlt, FaImage,
  FaArrowLeft, FaSearch, FaSpinner, FaChevronLeft,
  FaChevronDown, FaChevronUp, FaBookmark, FaCheck
} from 'react-icons/fa';
import { getToken } from '../services/authService';
import API from '../services/api';

// Save and restore reading progress per note
const saveProgress = (noteId, sectionIndex) => {
  try {
    const key = `reading_progress_${noteId}`;
    localStorage.setItem(key, JSON.stringify({ sectionIndex, savedAt: Date.now() }));
  } catch (_) {}
};

const getProgress = (noteId) => {
  try {
    const key = `reading_progress_${noteId}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch (_) { return null; }
};

const clearProgress = (noteId) => {
  try {
    localStorage.removeItem(`reading_progress_${noteId}`);
  } catch (_) {}
};

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

  // Structured summary states
  const [expandedSections, setExpandedSections] = useState({});
  const [currentSection, setCurrentSection] = useState(0);
  const [readSections, setReadSections] = useState({});

  // Topic explanation states
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicExplanation, setTopicExplanation] = useState(null);
  const [loadingTopic, setLoadingTopic] = useState(false);

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

  useEffect(() => { fetchData(); }, [fetchData]);

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
      clearProgress(id);
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
    setSelectedTopic(null);
    setTopicExplanation(null);

    // Restore reading progress
    const progress = getProgress(note._id);
    if (progress) {
      setCurrentSection(progress.sectionIndex);
      // Expand up to saved section
      const expanded = {};
      for (let i = 0; i <= progress.sectionIndex; i++) {
        expanded[i] = true;
      }
      setExpandedSections(expanded);
      toast.info(`📖 Resumed from section ${progress.sectionIndex + 1}`, { autoClose: 2000 });
    } else {
      setCurrentSection(0);
      setExpandedSections({ 0: true });
    }
    setReadSections({});
  };

  const toggleSection = (index) => {
    setExpandedSections(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const markSectionRead = (noteId, index, totalSections) => {
    const newRead = { ...readSections, [index]: true };
    setReadSections(newRead);

    // Save progress
    const nextUnread = index + 1 < totalSections ? index + 1 : index;
    setCurrentSection(nextUnread);
    saveProgress(noteId, nextUnread);

    // Auto-expand next section
    if (index + 1 < totalSections) {
      setExpandedSections(prev => ({ ...prev, [index + 1]: true }));
    }
  };

  const handleTopicClick = async (topic, note) => {
    if (selectedTopic === topic) {
      setSelectedTopic(null);
      setTopicExplanation(null);
      return;
    }
    setSelectedTopic(topic);
    setTopicExplanation(null);
    setLoadingTopic(true);
    try {
      const res = await API.post(
        '/api/ai/explain-topic',
        {
          topic,
          noteTitle: note.title,
          noteContent: note.rawText?.slice(0, 3000) || note.summary || '',
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setTopicExplanation(res.data.explanation);
    } catch (error) {
      setTopicExplanation(
        `${topic} is one of the key concepts in these notes. ` +
        `Review the sections above for detailed explanations and examples.`
      );
    }
    setLoadingTopic(false);
  };

  // ── DETAIL VIEW ──
  if (showDetail && selectedNote) {
    const sections = selectedNote.sections || [];
    const totalSections = sections.length;
    const readCount = Object.keys(readSections).length;
    const progressPercent = totalSections > 0 ? Math.round((readCount / totalSections) * 100) : 0;

    return (
      <div className="min-h-screen bg-gray-100">

        {/* Header */}
        <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button
            onClick={() => {
              setShowDetail(false);
              setSelectedNote(null);
              setSelectedTopic(null);
              setTopicExplanation(null);
            }}
            className="text-gray-500 hover:text-primary transition flex-shrink-0"
          >
            <FaChevronLeft className="text-xl" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-gray-800 truncate">
              {selectedNote.title}
            </h1>
            <p className="text-gray-400 text-xs">
              {selectedNote.subjectId?.name}
              {selectedNote.courseLevel && ` — ${selectedNote.courseLevel}`}
            </p>
          </div>
          <button
            onClick={() => navigate(`/quiz?noteId=${selectedNote._id}`)}
            className="bg-primary text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-secondary transition flex-shrink-0"
          >
            Quiz →
          </button>
        </div>

        {/* Reading Progress Bar */}
        {totalSections > 0 && (
          <div className="bg-white border-b border-gray-100 px-4 py-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <FaBookmark className="text-primary text-xs" />
                Reading progress
              </span>
              <span className="text-xs font-bold text-primary">{progressPercent}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {readCount} of {totalSections} sections read •
              {progressPercent === 100
                ? ' ✅ Completed!'
                : ` Resume from section ${currentSection + 1}`}
            </p>
          </div>
        )}

        <div className="p-4 space-y-4 max-w-2xl mx-auto pb-8">

          {/* Overview Summary */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-primary">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2 text-sm">
              🤖 AI Overview
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {selectedNote.summary || 'Summary not available.'}
            </p>
          </div>

          {/* Structured Sections */}
          {sections.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide px-1">
                📚 Full Study Summary — {totalSections} Topics
              </h3>

              {sections.map((section, idx) => (
                <div
                  key={idx}
                  className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${
                    readSections[idx]
                      ? 'border-green-200'
                      : currentSection === idx
                      ? 'border-primary'
                      : 'border-gray-100'
                  }`}
                >
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(idx)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {readSections[idx] ? (
                        <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <FaCheck className="text-white text-xs" />
                        </div>
                      ) : currentSection === idx ? (
                        <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">{idx + 1}</span>
                        </div>
                      ) : (
                        <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-500 text-xs font-bold">{idx + 1}</span>
                        </div>
                      )}
                      <span className={`font-bold text-sm truncate ${
                        readSections[idx] ? 'text-green-700' :
                        currentSection === idx ? 'text-primary' : 'text-gray-800'
                      }`}>
                        {section.heading}
                      </span>
                    </div>
                    {expandedSections[idx]
                      ? <FaChevronUp className="text-gray-400 flex-shrink-0 text-sm" />
                      : <FaChevronDown className="text-gray-400 flex-shrink-0 text-sm" />
                    }
                  </button>

                  {/* Section Content */}
                  {expandedSections[idx] && (
                    <div className="px-4 pb-4 border-t border-gray-50">

                      {/* Main Content */}
                      <p className="text-gray-700 text-sm leading-relaxed mt-3">
                        {section.content}
                      </p>

                      {/* Real World Example */}
                      {section.example && (
                        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                          <p className="text-xs font-bold text-yellow-700 mb-1">
                            🌍 Real World Example
                          </p>
                          <p className="text-yellow-800 text-sm leading-relaxed">
                            {section.example}
                          </p>
                        </div>
                      )}

                      {/* Sub Topics */}
                      {section.subTopics?.length > 0 && (
                        <div className="mt-3 space-y-3">
                          {section.subTopics.map((sub, subIdx) => (
                            <div
                              key={subIdx}
                              className="bg-gray-50 rounded-xl p-3 border border-gray-100"
                            >
                              <p className="font-bold text-gray-700 text-xs mb-1">
                                {sub.heading}
                              </p>
                              <p className="text-gray-600 text-xs leading-relaxed">
                                {sub.content}
                              </p>
                              {sub.example && (
                                <div className="mt-2 bg-blue-50 rounded-lg p-2">
                                  <p className="text-xs font-bold text-blue-600 mb-0.5">
                                    💡 Example
                                  </p>
                                  <p className="text-blue-700 text-xs leading-relaxed">
                                    {sub.example}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Mark as Read Button */}
                      {!readSections[idx] && (
                        <button
                          onClick={() => markSectionRead(selectedNote._id, idx, totalSections)}
                          className="mt-4 w-full bg-primary text-white text-xs font-bold py-2.5 rounded-xl hover:bg-secondary transition flex items-center justify-center gap-2"
                        >
                          <FaCheck className="text-xs" />
                          Mark as Read & Continue
                        </button>
                      )}

                      {readSections[idx] && (
                        <div className="mt-3 flex items-center gap-2 text-green-600 text-xs font-medium">
                          <FaCheck className="text-xs" />
                          Section completed ✅
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Completion Banner */}
              {progressPercent === 100 && (
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white text-center">
                  <p className="text-2xl mb-1">🎉</p>
                  <p className="font-bold">Summary Complete!</p>
                  <p className="text-green-100 text-xs mt-1">
                    You have read all {totalSections} sections. Time to test yourself!
                  </p>
                  <button
                    onClick={() => {
                      clearProgress(selectedNote._id);
                      navigate(`/quiz?noteId=${selectedNote._id}`);
                    }}
                    className="mt-3 bg-white text-green-600 font-bold px-6 py-2 rounded-xl text-sm hover:bg-green-50 transition"
                  >
                    Generate Quiz Now →
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Fallback — Old style summary if no sections */
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3">📌 {t('keyTopics')}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {selectedNote.summary}
              </p>
            </div>
          )}

          {/* Key Topics — Clickable */}
          {selectedNote.keyTopics?.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                📌 {t('keyTopics')}
              </h3>
              <p className="text-xs text-gray-400 mb-3">
                💡 Tap any topic for an AI explanation
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedNote.keyTopics.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => handleTopicClick(topic, selectedNote)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                      selectedTopic === topic
                        ? 'bg-primary text-white border-primary'
                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-primary hover:text-white hover:border-primary active:scale-95'
                    }`}
                  >
                    {selectedTopic === topic && loadingTopic ? '⏳ ' : ''}
                    {topic}
                  </button>
                ))}
              </div>

              {selectedTopic && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-blue-800 text-sm">
                      📖 {selectedTopic}
                    </h4>
                    <button
                      onClick={() => { setTopicExplanation(null); setSelectedTopic(null); }}
                      className="text-blue-400 hover:text-blue-600 text-xs px-2 py-1 rounded-full hover:bg-blue-100 transition"
                    >
                      ✕ Close
                    </button>
                  </div>
                  {loadingTopic ? (
                    <div className="flex items-center gap-2 text-blue-600 text-sm">
                      <FaSpinner className="animate-spin" />
                      AI is explaining this topic...
                    </div>
                  ) : (
                    <p className="text-blue-700 text-sm leading-relaxed">
                      {topicExplanation}
                    </p>
                  )}
                </div>
              )}
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

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
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

      <div className="bg-white shadow-sm px-4 md:px-8 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-primary transition">
          <FaArrowLeft className="text-xl" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">{t('myNotesTitle')}</h1>
          <p className="text-gray-500 text-sm">{notes.length} {t('notesCount')}</p>
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="bg-primary text-white px-3 py-2 rounded-xl text-xs font-medium hover:bg-secondary transition flex items-center gap-1"
        >
          <FaUpload className="text-xs" /> {t('uploadNote')}
        </button>
      </div>

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

      <div className="px-4 md:px-8 py-2 bg-white border-b border-gray-100">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveSubject('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex-shrink-0 ${
              activeSubject === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {t('allNotes')}
          </button>
          {subjects.map(sub => (
            <button
              key={sub._id}
              onClick={() => setActiveSubject(sub._id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex-shrink-0 ${
                activeSubject === sub._id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <FaSpinner className="animate-spin text-primary text-3xl" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FaBookOpen className="text-5xl mb-3 opacity-30" />
            <p className="text-sm text-center mb-4">{t('noNotesFound')}</p>
            <button onClick={() => navigate('/upload')} className="bg-primary text-white px-6 py-2 rounded-xl text-sm hover:bg-secondary transition">
              {t('uploadNote')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map(note => {
              const progress = getProgress(note._id);
              const sections = note.sections || [];
              return (
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
                    <p className="text-xs text-gray-400 line-clamp-2 mb-2 leading-relaxed">
                      {note.summary}
                    </p>
                  )}

                  {/* Reading progress indicator on card */}
                  {progress && sections.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-primary font-medium flex items-center gap-1">
                          <FaBookmark className="text-xs" /> Reading in progress
                        </span>
                        <span className="text-xs text-gray-400">
                          Section {progress.sectionIndex + 1}/{sections.length}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.round(((progress.sectionIndex) / sections.length) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {note.keyTopics?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {note.keyTopics.slice(0, 3).map((topic, i) => (
                        <span key={i} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                          {topic}
                        </span>
                      ))}
                      {note.keyTopics.length > 3 && (
                        <span className="text-gray-400 text-xs">+{note.keyTopics.length - 3}</span>
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notes;