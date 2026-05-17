import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaArrowLeft, FaPlus, FaUsers, FaSpinner,
  FaCopy, FaSignOutAlt, FaTrash, FaBookOpen
} from 'react-icons/fa';
import { getToken, getUser } from '../services/authService';
import API from '../services/api';

function StudyGroups() {
  const navigate = useNavigate();
  const user = getUser();
  const [groups, setGroups] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [saving, setSaving] = useState(false);
  const [createData, setCreateData] = useState({ name: '', description: '' });
  const [inviteCode, setInviteCode] = useState('');
  const [shareNoteId, setShareNoteId] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [groupsRes, notesRes] = await Promise.all([
        API.get('/api/groups/my', { headers }),
        API.get('/api/notes', { headers }),
      ]);
      setGroups(groupsRes.data.groups);
      setNotes(notesRes.data.notes);
    } catch (error) {
      toast.error('Failed to load groups');
    }
    setLoading(false);
  };

  const createGroup = async (e) => {
    e.preventDefault();
    if (!createData.name) { toast.error('Group name is required'); return; }
    setSaving(true);
    try {
      const res = await API.post('/api/groups',
        createData,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setGroups([res.data.group, ...groups]);
      setCreateData({ name: '', description: '' });
      setShowCreate(false);
      toast.success('Study group created! 🎉');
    } catch (error) {
      toast.error('Failed to create group');
    }
    setSaving(false);
  };

  const joinGroup = async (e) => {
    e.preventDefault();
    if (!inviteCode) { toast.error('Please enter invite code'); return; }
    setSaving(true);
    try {
      const res = await API.post('/api/groups/join',
        { inviteCode },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setGroups([...groups, res.data.group]);
      setInviteCode('');
      setShowJoin(false);
      toast.success('Joined group successfully! 🎉');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to join group';
      toast.error(message);
    }
    setSaving(false);
  };

  const shareNote = async () => {
    if (!shareNoteId) { toast.error('Please select a note to share'); return; }
    try {
      await API.post(`/api/groups/${selectedGroup._id}/share`,
        { noteId: shareNoteId },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast.success('Note shared with group! 🎉');
      setShareNoteId('');
      fetchData();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to share note';
      toast.error(message);
    }
  };

  const leaveGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      await API.delete(`/api/groups/${groupId}/leave`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setGroups(groups.filter(g => g._id !== groupId));
      if (selectedGroup?._id === groupId) setSelectedGroup(null);
      toast.success('Left group successfully');
    } catch (error) {
      toast.error('Failed to leave group');
    }
  };

  const deleteGroup = async (groupId) => {
    if (!window.confirm('Delete this group permanently?')) return;
    try {
      await API.delete(`/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setGroups(groups.filter(g => g._id !== groupId));
      if (selectedGroup?._id === groupId) setSelectedGroup(null);
      toast.success('Group deleted');
    } catch (error) {
      toast.error('Failed to delete group');
    }
  };

  const copyCode = (code) => {
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

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-white shadow-sm px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-primary transition">
            <FaArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Study Groups</h1>
            <p className="text-gray-500 text-sm">Collaborate and share notes with classmates</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowJoin(!showJoin); setShowCreate(false); }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            Join Group
          </button>
          <button
            onClick={() => { setShowCreate(!showCreate); setShowJoin(false); }}
            className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary transition flex items-center gap-2"
          >
            <FaPlus /> Create Group
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-8 space-y-6">

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
                  onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                  placeholder="e.g. Software Engineering Study Group"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  value={createData.description}
                  onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
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
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter 8-character invite code e.g. AB12CD34"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-secondary text-gray-700 transition font-mono tracking-widest text-center text-lg uppercase"
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

        {/* Groups */}
        {groups.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <FaUsers className="text-6xl text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">No Study Groups Yet</h3>
            <p className="text-gray-400 mb-6">Create a group or join one with an invite code</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowCreate(true)} className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-secondary transition">
                Create Group
              </button>
              <button onClick={() => setShowJoin(true)} className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition">
                Join with Code
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Groups List */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 text-lg">My Groups ({groups.length})</h3>
              {groups.map(group => (
                <div
                  key={group._id}
                  onClick={() => setSelectedGroup(group)}
                  className={`bg-white rounded-2xl p-5 shadow-sm border-2 cursor-pointer transition ${
                    selectedGroup?._id === group._id ? 'border-primary' : 'border-transparent hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary w-12 h-12 rounded-xl flex items-center justify-center">
                        <FaUsers className="text-white text-lg" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">{group.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {group.members?.length || 0} members • {group.sharedNotes?.length || 0} notes shared
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {group.createdBy?._id === user?.id ? (
                        <button onClick={(e) => { e.stopPropagation(); deleteGroup(group._id); }} className="p-2 text-gray-300 hover:text-red-500 transition">
                          <FaTrash className="text-xs" />
                        </button>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); leaveGroup(group._id); }} className="p-2 text-gray-300 hover:text-red-500 transition">
                          <FaSignOutAlt className="text-xs" />
                        </button>
                      )}
                    </div>
                  </div>

                  {group.description && (
                    <p className="text-gray-500 text-sm mt-2">{group.description}</p>
                  )}

                  {/* Invite Code */}
                  <div
                    onClick={(e) => { e.stopPropagation(); copyCode(group.inviteCode); }}
                    className="mt-3 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 cursor-pointer hover:bg-gray-100 transition"
                  >
                    <span className="text-xs text-gray-500">Invite Code:</span>
                    <span className="font-mono font-bold text-primary text-sm tracking-widest">{group.inviteCode}</span>
                    <FaCopy className="text-gray-400 text-xs ml-auto" />
                  </div>
                </div>
              ))}
            </div>

            {/* Group Detail */}
            <div>
              {selectedGroup ? (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 text-lg">{selectedGroup.name}</h3>

                  {/* Members */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-700 text-sm mb-3">
                      👥 Members ({selectedGroup.members?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {selectedGroup.members?.map((member, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50">
                          <div className="bg-primary w-8 h-8 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {member.fullName?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{member.fullName}</p>
                            <p className="text-xs text-gray-400">{member.university}</p>
                          </div>
                          {member._id === selectedGroup.createdBy?._id && (
                            <span className="ml-auto text-xs bg-primary text-white px-2 py-0.5 rounded-full">Admin</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shared Notes */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-700 text-sm mb-3">
                      📝 Shared Notes ({selectedGroup.sharedNotes?.length || 0})
                    </h4>

                    {/* Share a note */}
                    <div className="flex gap-2 mb-3">
                      <select
                        value={shareNoteId}
                        onChange={(e) => setShareNoteId(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-secondary"
                      >
                        <option value="">Select note to share...</option>
                        {notes.map(note => (
                          <option key={note._id} value={note._id}>{note.title}</option>
                        ))}
                      </select>
                      <button
                        onClick={shareNote}
                        className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-secondary transition"
                      >
                        Share
                      </button>
                    </div>

                    {selectedGroup.sharedNotes?.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">No notes shared yet</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedGroup.sharedNotes?.map((note, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50">
                            <FaBookOpen className="text-primary flex-shrink-0" />
                            <p className="text-sm text-gray-700 font-medium">{note.title}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 shadow-sm text-center border border-gray-100">
                  <FaUsers className="text-5xl text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Select a group to view details</p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default StudyGroups;