import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaArrowLeft, FaPlus, FaUsers, FaSpinner,
  FaCopy, FaSignOutAlt, FaTrash, FaBookOpen,
  FaChevronRight, FaPaperPlane, FaSave,
  FaShare, FaComments, FaLock
} from 'react-icons/fa';
import { getToken, getUser } from '../services/authService';
import API from '../services/api';

function SaveNoteModal({ note, subjects, onClose, onSave }) {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [title, setTitle] = useState(note?.noteId?.title || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedSubject) { toast.error('Please select a subject'); return; }
    setSaving(true);
    try {
      await onSave({ noteId: note.noteId?._id, subjectId: selectedSubject, title });
      onClose();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="font-bold text-gray-800 text-lg mb-4">
          Save Note to My Collection
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Save to Subject
            </label>
            {subjects.length === 0 ? (
              <p className="text-gray-400 text-sm">
                No subjects yet. Create one in Upload page first.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {subjects.map(sub => (
                  <button
                    key={sub._id}
                    onClick={() => setSelectedSubject(sub._id)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition ${
                      selectedSubject === sub._id
                        ? 'border-primary bg-blue-50 text-primary'
                        : 'border-gray-200 text-gray-700 hover:border-primary'
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedSubject}
            className="flex-1 bg-primary hover:bg-secondary text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
            {saving ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatPanel({ group, onBack }) {
  const user = getUser();
  const isPro = user?.plan === 'pro';
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await API.get(`/api/groups/${group._id}/messages`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setMessages(res.data.messages);
    } catch (error) {
      console.error('Fetch messages error');
    }
    setLoading(false);
  }, [group._id]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async e => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await API.post(
        `/api/groups/${group._id}/messages`,
        { text, type: 'text' },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setText('');
      fetchMessages();
    } catch (error) {
      const code = error.response?.data?.code;
      if (code === 'PRO_REQUIRED') {
        toast.error('Group chat is a Pro feature. Upgrade to unlock!');
      } else {
        toast.error('Failed to send message');
      }
    }
    setSending(false);
  };

  if (!isPro) {
    return (
      <div className="flex flex-col h-screen bg-gray-100">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white">
          <button onClick={onBack} className="text-gray-500 hover:text-primary transition">
            <FaArrowLeft />
          </button>
          <h3 className="font-bold text-gray-800">{group.name} — Chat</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <FaLock className="text-yellow-500 text-2xl" />
          </div>
          <h3 className="font-bold text-gray-800 text-lg mb-2">Pro Feature</h3>
          <p className="text-gray-500 text-sm mb-4">
            Group chat is available for Pro subscribers only.
          </p>
          <button
            onClick={() => window.location.href = '/payment'}
            className="bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-secondary transition"
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white">
        <button onClick={onBack} className="text-gray-500 hover:text-primary transition">
          <FaArrowLeft />
        </button>
        <h3 className="font-bold text-gray-800">{group.name} — Chat</h3>
        <span className="ml-auto text-xs text-gray-400">
          {group.members?.length} members
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <FaSpinner className="animate-spin text-primary text-2xl" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FaComments className="text-4xl mb-2 opacity-30 mx-auto" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isOwn = msg.senderId === user?.id;
            return (
              <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-md flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                  {!isOwn && (
                    <p className="text-xs text-gray-500 mb-1 ml-1">{msg.senderName}</p>
                  )}
                  <div className={`px-4 py-2 rounded-2xl text-sm ${
                    isOwn
                      ? 'bg-primary text-white rounded-tr-sm'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'
                  }`}>
                    {msg.text}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 mx-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 text-sm"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="bg-primary text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-secondary transition disabled:opacity-50"
          >
            {sending
              ? <FaSpinner className="animate-spin text-sm" />
              : <FaPaperPlane className="text-sm" />
            }
          </button>
        </div>
      </form>
    </div>
  );
}
function SharedNotesPanel({ group, subjects, onBack }) {
  const navigate = useNavigate();
  const [saveModal, setSaveModal] = useState(null);
  const [viewNote, setViewNote] = useState(null);

  const handleSaveNote = async ({ noteId, subjectId, title }) => {
    try {
      await API.post(
        `/api/groups/${group._id}/save-note`,
        { noteId, subjectId, title },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast.success('Note saved to your collection! 🎉');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save note');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white">
        <button onClick={onBack} className="text-gray-500 hover:text-primary transition">
          <FaArrowLeft />
        </button>
        <h3 className="font-bold text-gray-800">{group.name} — Shared Notes</h3>
        <span className="ml-auto text-xs text-gray-400">
          {group.sharedNotes?.length || 0} notes
        </span>
      </div>

      {saveModal && (
        <SaveNoteModal
          note={saveModal}
          subjects={subjects}
          onClose={() => setSaveModal(null)}
          onSave={handleSaveNote}
        />
      )}

      <div className="flex-1 overflow-y-auto">
        {viewNote ? (
          <div className="p-4 space-y-4">
            <button
              onClick={() => setViewNote(null)}
              className="text-primary text-sm font-medium flex items-center gap-1"
            >
              <FaArrowLeft className="text-xs" /> Back to notes
            </button>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-1">
                {viewNote.noteId?.title}
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Shared by {viewNote.sharedByName} •{' '}
                {new Date(viewNote.sharedAt).toLocaleDateString()}
              </p>

              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-gray-700 mb-2">🤖 AI Summary</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {viewNote.noteId?.summary || 'No summary available.'}
                  </p>
                </div>

                {viewNote.noteId?.keyTopics?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-gray-700 mb-2">📌 Key Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {viewNote.noteId.keyTopics.map((topic, i) => (
                        <span key={i} className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {viewNote.noteId?.rawText && (
                  <div>
                    <h4 className="font-bold text-gray-700 mb-2">📄 Content Preview</h4>
                    <div className="bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto">
                      <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                        {viewNote.noteId.rawText.slice(0, 600)}
                        {viewNote.noteId.rawText.length > 600 && '...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-6">
              <button
                onClick={() => setSaveModal(viewNote)}
                className="flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 rounded-xl hover:bg-secondary transition text-sm"
              >
                <FaSave /> Save to My Notes
              </button>
              <button
                onClick={() => navigate(`/quiz?noteId=${viewNote.noteId?._id}`)}
                className="flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition text-sm"
              >
                <FaChevronRight /> Generate Quiz
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {!group.sharedNotes || group.sharedNotes.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FaBookOpen className="text-5xl mb-3 opacity-30 mx-auto" />
                <p className="text-sm">No notes shared yet.</p>
                <p className="text-xs mt-1">Share your notes with the group!</p>
              </div>
            ) : (
              group.sharedNotes.map((sn, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-gray-800 text-sm truncate">
                        {sn.noteId?.title || 'Untitled Note'}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Shared by {sn.sharedByName} •{' '}
                        {new Date(sn.sharedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {sn.noteId?.summary && (
                    <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">
                      {sn.noteId.summary}
                    </p>
                  )}

                  {sn.noteId?.keyTopics?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {sn.noteId.keyTopics.slice(0, 3).map((t, j) => (
                        <span key={j} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewNote(sn)}
                      className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-xl transition"
                    >
                      View Note
                    </button>
                    <button
                      onClick={() => setSaveModal(sn)}
                      className="flex-1 text-xs bg-blue-50 hover:bg-blue-100 text-primary font-medium py-2 rounded-xl transition flex items-center justify-center gap-1"
                    >
                      <FaSave className="text-xs" /> Save
                    </button>
                    <button
                      onClick={() => navigate(`/quiz?noteId=${sn.noteId?._id}`)}
                      className="flex-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2 rounded-xl transition"
                    >
                      Quiz →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
function StudyGroups() {
  const navigate = useNavigate();
  const user = getUser();
  const isPro = user?.plan === 'pro';

  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createData, setCreateData] = useState({ name: '', description: '' });
  const [inviteCode, setInviteCode] = useState('');
  const [shareNoteId, setShareNoteId] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activePanel, setActivePanel] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [groupsRes, notesRes, subjectsRes] = await Promise.all([
        API.get('/api/groups/my', { headers }),
        API.get('/api/notes', { headers }),
        API.get('/api/notes/subjects', { headers }),
      ]);
      setGroups(groupsRes.data.groups);
      setNotes(notesRes.data.notes);
      setSubjects(subjectsRes.data.subjects);
    } catch (error) {
      toast.error('Failed to load groups');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createGroup = async e => {
    e.preventDefault();
    if (!createData.name) { toast.error('Group name is required'); return; }
    setSaving(true);
    try {
      const res = await API.post('/api/groups', createData, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setGroups(prev => [res.data.group, ...prev]);
      setCreateData({ name: '', description: '' });
      setShowCreate(false);
      toast.success('Study group created! 🎉');
    } catch (error) {
      toast.error('Failed to create group');
    }
    setSaving(false);
  };

  const joinGroup = async e => {
    e.preventDefault();
    if (!inviteCode) { toast.error('Please enter invite code'); return; }
    setSaving(true);
    try {
      const res = await API.post('/api/groups/join', { inviteCode }, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setGroups(prev => [...prev, res.data.group]);
      setInviteCode('');
      setShowJoin(false);
      toast.success('Joined group! 🎉');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join group');
    }
    setSaving(false);
  };

  const shareNote = async groupId => {
    if (!shareNoteId) { toast.error('Please select a note'); return; }
    try {
      await API.post(`/api/groups/${groupId}/share`, { noteId: shareNoteId }, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      toast.success('Note shared! 🎉');
      setShareNoteId('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to share note');
    }
  };

  const leaveGroup = async groupId => {
    if (!window.confirm('Leave this group?')) return;
    try {
      await API.delete(`/api/groups/${groupId}/leave`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setGroups(prev => prev.filter(g => g._id !== groupId));
      if (selectedGroup?._id === groupId) setSelectedGroup(null);
      toast.success('Left group');
    } catch (error) {
      toast.error('Failed to leave group');
    }
  };

  const deleteGroup = async groupId => {
    if (!window.confirm('Delete this group permanently?')) return;
    try {
      await API.delete(`/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setGroups(prev => prev.filter(g => g._id !== groupId));
      if (selectedGroup?._id === groupId) setSelectedGroup(null);
      toast.success('Group deleted');
    } catch (error) {
      toast.error('Failed to delete group');
    }
  };

  const copyCode = code => {
    navigator.clipboard.writeText(code);
    toast.success('Invite code copied! 📋');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <FaSpinner className="animate-spin text-primary text-4xl" />
      </div>
    );
  }

  if (selectedGroup && activePanel === 'chat') {
    return <ChatPanel group={selectedGroup} onBack={() => setActivePanel(null)} />;
  }

  if (selectedGroup && activePanel === 'notes') {
    return (
      <SharedNotesPanel
        group={selectedGroup}
        subjects={subjects}
        onBack={() => setActivePanel(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-white shadow-sm px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-primary transition">
            <FaArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Study Groups</h1>
            <p className="text-gray-500 text-sm">Collaborate with classmates</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowJoin(!showJoin); setShowCreate(false); }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm font-medium transition"
          >
            Join
          </button>
          <button
            onClick={() => { setShowCreate(!showCreate); setShowJoin(false); }}
            className="bg-primary text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-secondary transition flex items-center gap-1"
          >
            <FaPlus className="text-xs" /> Create
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-4">

        {/* Create Form */}
        {showCreate && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg mb-4">Create New Study Group</h3>
            <form onSubmit={createGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Group Name *</label>
                <input
                  type="text"
                  value={createData.name}
                  onChange={e => setCreateData({ ...createData, name: e.target.value })}
                  placeholder="e.g. Software Engineering Study Group"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  value={createData.description}
                  onChange={e => setCreateData({ ...createData, description: e.target.value })}
                  placeholder="What is this group about?"
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 transition resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-secondary text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
                  {saving ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                  {saving ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Join Form */}
        {showJoin && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg mb-4">Join a Study Group</h3>
            <form onSubmit={joinGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Invite Code *</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter 8-character code"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 font-mono tracking-widest text-center text-lg uppercase transition"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowJoin(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-secondary text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
                  {saving ? <FaSpinner className="animate-spin" /> : <FaUsers />}
                  {saving ? 'Joining...' : 'Join Group'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Groups List */}
        {groups.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <FaUsers className="text-6xl text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">No Study Groups Yet</h3>
            <p className="text-gray-400 mb-6">Create a group or join one with an invite code</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowCreate(true)} className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-secondary transition">Create Group</button>
              <button onClick={() => setShowJoin(true)} className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition">Join with Code</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(group => (
              <div key={group._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5">

                  {/* Group Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="bg-primary w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FaUsers className="text-white text-lg" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-800 truncate">{group.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {group.members?.length || 0} members • {group.sharedNotes?.length || 0} notes
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {group.createdBy?._id === user?.id ? (
                        <button onClick={() => deleteGroup(group._id)} className="p-2 text-gray-300 hover:text-red-500 transition">
                          <FaTrash className="text-xs" />
                        </button>
                      ) : (
                        <button onClick={() => leaveGroup(group._id)} className="p-2 text-gray-300 hover:text-red-500 transition">
                          <FaSignOutAlt className="text-xs" />
                        </button>
                      )}
                    </div>
                  </div>

                  {group.description && (
                    <p className="text-gray-500 text-sm mb-3">{group.description}</p>
                  )}

                  {/* Invite Code */}
                  <div
                    onClick={() => copyCode(group.inviteCode)}
                    className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 cursor-pointer hover:bg-gray-100 transition mb-4"
                  >
                    <span className="text-xs text-gray-500">Invite Code:</span>
                    <span className="font-mono font-bold text-primary text-sm tracking-widest">{group.inviteCode}</span>
                    <FaCopy className="text-gray-400 text-xs ml-auto" />
                  </div>

                  {/* Members Avatars */}
                  <div className="flex items-center gap-2 mb-4">
                    {group.members?.slice(0, 5).map((m, i) => (
                      <div key={i} className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white text-xs font-bold" title={m.fullName}>
                        {m.fullName?.charAt(0) || '?'}
                      </div>
                    ))}
                    {group.members?.length > 5 && (
                      <span className="text-xs text-gray-400">+{group.members.length - 5} more</span>
                    )}
                  </div>

                  {/* Share Note */}
                  <div className="flex gap-2 mb-4">
                    <select
                      value={shareNoteId}
                      onChange={e => setShareNoteId(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-secondary"
                    >
                      <option value="">Select note to share...</option>
                      {notes.map(note => (
                        <option key={note._id} value={note._id}>{note.title}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => shareNote(group._id)}
                      className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary transition flex items-center gap-1"
                    >
                      <FaShare className="text-xs" /> Share
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => { setSelectedGroup(group); setActivePanel('notes'); }}
                      className="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-primary font-medium py-3 rounded-xl transition text-sm"
                    >
                      <FaBookOpen /> Notes ({group.sharedNotes?.length || 0})
                    </button>
                    <button
                      onClick={() => { setSelectedGroup(group); setActivePanel('chat'); }}
                      className={`flex items-center justify-center gap-2 font-medium py-3 rounded-xl transition text-sm ${
                        isPro
                          ? 'bg-green-50 hover:bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-400 cursor-pointer'
                      }`}
                    >
                      <FaComments />
                      Chat
                      {!isPro && <span className="text-xs">🔒</span>}
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudyGroups;