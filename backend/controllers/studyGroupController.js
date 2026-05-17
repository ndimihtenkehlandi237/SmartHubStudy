const StudyGroup = require('../models/StudyGroup');
const Note = require('../models/Note');
const crypto = require('crypto');

// Generate unique invite code
const generateCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

// CREATE GROUP
const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Group name is required' });

    const group = await StudyGroup.create({
      name,
      description: description || '',
      createdBy: req.user.id,
      members: [req.user.id],
      inviteCode: generateCode(),
    });

    const populated = await StudyGroup.findById(group._id)
      .populate('members', 'fullName email university')
      .populate('createdBy', 'fullName');

    res.status(201).json({ message: 'Study group created!', group: populated });
  } catch (error) {
    console.error('Create group error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// JOIN GROUP
const joinGroup = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ message: 'Invite code is required' });

    const group = await StudyGroup.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!group) return res.status(404).json({ message: 'Invalid invite code. Group not found.' });

    if (group.members.includes(req.user.id)) {
      return res.status(400).json({ message: 'You are already a member of this group.' });
    }

    group.members.push(req.user.id);
    await group.save();

    const populated = await StudyGroup.findById(group._id)
      .populate('members', 'fullName email university')
      .populate('createdBy', 'fullName');

    res.status(200).json({ message: 'Joined group successfully!', group: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET MY GROUPS
const getMyGroups = async (req, res) => {
  try {
    const groups = await StudyGroup.find({ members: req.user.id })
      .populate('members', 'fullName email university')
      .populate('createdBy', 'fullName')
      .populate('sharedNotes', 'title fileType createdAt')
      .sort({ createdAt: -1 });
    res.status(200).json({ groups });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// SHARE NOTE TO GROUP
const shareNote = async (req, res) => {
  try {
    const { noteId } = req.body;
    const group = await StudyGroup.findOne({
      _id: req.params.id,
      members: req.user.id
    });
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const note = await Note.findOne({ _id: noteId, userId: req.user.id });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (group.sharedNotes.includes(noteId)) {
      return res.status(400).json({ message: 'Note already shared in this group.' });
    }

    group.sharedNotes.push(noteId);
    await group.save();

    res.status(200).json({ message: 'Note shared successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// LEAVE GROUP
const leaveGroup = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    group.members = group.members.filter(m => m.toString() !== req.user.id);
    await group.save();

    res.status(200).json({ message: 'Left group successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE GROUP
const deleteGroup = async (req, res) => {
  try {
    const group = await StudyGroup.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });
    if (!group) return res.status(404).json({ message: 'Group not found or not authorized' });

    await StudyGroup.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createGroup, joinGroup, getMyGroups, shareNote, leaveGroup, deleteGroup };