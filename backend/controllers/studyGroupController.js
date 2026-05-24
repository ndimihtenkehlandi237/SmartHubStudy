const StudyGroup = require('../models/StudyGroup');
const Note = require('../models/Note');
const Message = require('../models/Message');
const User = require('../models/User');
const crypto = require('crypto');

const generateCode = () =>
  crypto.randomBytes(4).toString('hex').toUpperCase();

// ── CREATE GROUP ──
const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const user = await User.findById(req.user.id).select('fullName');
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

// ── JOIN GROUP ──
const joinGroup = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) {
      return res.status(400).json({ message: 'Invite code is required' });
    }

    const group = await StudyGroup.findOne({
      inviteCode: inviteCode.toUpperCase(),
    });
    if (!group) {
      return res.status(404).json({
        message: 'Invalid invite code. Group not found.',
      });
    }

    const alreadyMember = group.members.some(
      m => m.toString() === req.user.id
    );
    if (alreadyMember) {
      return res.status(400).json({
        message: 'You are already a member of this group.',
      });
    }

    group.members.push(req.user.id);
    await group.save();

    const populated = await StudyGroup.findById(group._id)
      .populate('members', 'fullName email university')
      .populate('createdBy', 'fullName');

    res.status(200).json({
      message: 'Joined group successfully!',
      group: populated,
    });
  } catch (error) {
    console.error('Join group error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET MY GROUPS ──
const getMyGroups = async (req, res) => {
  try {
    const groups = await StudyGroup.find({ members: req.user.id })
      .populate('members', 'fullName email university')
      .populate('createdBy', 'fullName')
      .populate('sharedNotes.noteId', 'title fileType summary keyTopics rawText createdAt')
      .populate('sharedNotes.sharedBy', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({ groups });
  } catch (error) {
    console.error('Get groups error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── SHARE NOTE TO GROUP ──
const shareNote = async (req, res) => {
  try {
    const { noteId } = req.body;

    const group = await StudyGroup.findOne({
      _id: req.params.id,
      members: req.user.id,
    });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const note = await Note.findOne({ _id: noteId, userId: req.user.id });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const alreadyShared = group.sharedNotes.some(
      sn => sn.noteId.toString() === noteId
    );
    if (alreadyShared) {
      return res.status(400).json({
        message: 'Note already shared in this group.',
      });
    }

    const user = await User.findById(req.user.id).select('fullName');

    group.sharedNotes.push({
      noteId,
      sharedBy: req.user.id,
      sharedByName: user.fullName,
      sharedAt: new Date(),
    });
    await group.save();

    res.status(200).json({ message: 'Note shared successfully!' });
  } catch (error) {
    console.error('Share note error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── SAVE SHARED NOTE TO OWN SUBJECT ──
const saveSharedNote = async (req, res) => {
  try {
    const { noteId, subjectId, title } = req.body;

    const originalNote = await Note.findById(noteId);
    if (!originalNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const Subject = require('../models/Subject');
    const subject = await Subject.findOne({
      _id: subjectId,
      userId: req.user.id,
    });
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if already saved
    const alreadySaved = await Note.findOne({
      userId: req.user.id,
      rawText: originalNote.rawText,
      subjectId,
    });
    if (alreadySaved) {
      return res.status(400).json({
        message: 'You already saved this note.',
      });
    }

    const newNote = await Note.create({
      title: title || originalNote.title,
      userId: req.user.id,
      subjectId,
      courseLevel: originalNote.courseLevel,
      fileType: originalNote.fileType,
      fileUrl: originalNote.fileUrl,
      rawText: originalNote.rawText,
      summary: originalNote.summary,
      keyTopics: originalNote.keyTopics,
      references: originalNote.references,
    });

    await Subject.findByIdAndUpdate(subjectId, { $inc: { noteCount: 1 } });

    res.status(201).json({
      message: 'Note saved to your collection!',
      note: newNote,
    });
  } catch (error) {
    console.error('Save shared note error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── SEND MESSAGE ──
const sendMessage = async (req, res) => {
  try {
    const { text, type } = req.body;
    const groupId = req.params.id;

    const group = await StudyGroup.findOne({
      _id: groupId,
      members: req.user.id,
    });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const user = await User.findById(req.user.id).select('fullName plan');

    if (user.plan !== 'pro') {
      return res.status(403).json({
        message: 'Group chat is a Pro feature. Upgrade to Pro to send messages.',
        code: 'PRO_REQUIRED',
      });
    }

    const message = await Message.create({
      groupId,
      senderId: req.user.id,
      senderName: user.fullName,
      text: text || '',
      type: type || 'text',
    });

    res.status(201).json({ message: 'Message sent!', data: message });
  } catch (error) {
    console.error('Send message error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET MESSAGES ──
const getMessages = async (req, res) => {
  try {
    const groupId = req.params.id;

    const group = await StudyGroup.findOne({
      _id: groupId,
      members: req.user.id,
    });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const messages = await Message.find({ groupId })
      .sort({ createdAt: 1 })
      .limit(100);

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Get messages error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── LEAVE GROUP ──
const leaveGroup = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    group.members = group.members.filter(
      m => m.toString() !== req.user.id
    );
    await group.save();

    res.status(200).json({ message: 'Left group successfully' });
  } catch (error) {
    console.error('Leave group error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── DELETE GROUP ──
const deleteGroup = async (req, res) => {
  try {
    const group = await StudyGroup.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });
    if (!group) {
      return res.status(404).json({
        message: 'Group not found or not authorized',
      });
    }

    await StudyGroup.findByIdAndDelete(req.params.id);
    await Message.deleteMany({ groupId: req.params.id });

    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createGroup,
  joinGroup,
  getMyGroups,
  shareNote,
  saveSharedNote,
  sendMessage,
  getMessages,
  leaveGroup,
  deleteGroup,
};