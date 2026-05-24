const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ── REGISTER ──
const register = async (req, res) => {
  try {
    const { fullName, email, password, university, language } = req.body;

    if (!fullName || !email || !password || !university) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'Email already registered. Please login.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate unique username from fullName
    const baseUsername = fullName.toLowerCase().replace(/\s+/g, '').slice(0, 12);
    const randomSuffix = Math.floor(Math.random() * 9999);
    const username = `${baseUsername}${randomSuffix}`;

    // Generate share link
    const shareLink = crypto.randomBytes(6).toString('hex');

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      university,
      language: language || 'en',
      username,
      shareLink,
    });

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        email: newUser.email,
        university: newUser.university,
        plan: newUser.plan,
        language: newUser.language,
        studyStreak: 0,
        points: 0,
        profilePicture: '',
        shareLink: newUser.shareLink,
      }
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ── LOGIN ──
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: 'No account found with this email.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Incorrect password. Please try again.'
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        university: user.university,
        plan: user.plan,
        language: user.language || 'en',
        studyStreak: user.studyStreak || 0,
        points: user.points || 0,
        profilePicture: user.profilePicture || '',
        tokenBalance: user.tokenBalance || 0,
        extraUploads: user.extraUploads || 0,
        extraQuizzes: user.extraQuizzes || 0,
        shareLink: user.shareLink || '',
        followers: user.followers?.length || 0,
        following: user.following?.length || 0,
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ── GET CURRENT USER ──
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('friends', 'fullName username profilePicture university')
      .populate('followers', 'fullName username profilePicture')
      .populate('following', 'fullName username profilePicture');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── UPDATE PROFILE ──
const updateProfile = async (req, res) => {
  try {
    const { fullName, university, language, username, profilePicture } = req.body;

    // Check username uniqueness if changing
    if (username) {
      const existing = await User.findOne({
        username: username.toLowerCase(),
        _id: { $ne: req.user.id },
      });
      if (existing) {
        return res.status(400).json({
          message: 'Username already taken. Please choose another.'
        });
      }
    }

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (university) updateData.university = university;
    if (language) updateData.language = language;
    if (username) updateData.username = username.toLowerCase().trim();
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: 'Profile updated!',
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        university: user.university,
        plan: user.plan,
        language: user.language,
        studyStreak: user.studyStreak,
        points: user.points,
        profilePicture: user.profilePicture,
        tokenBalance: user.tokenBalance,
        shareLink: user.shareLink,
        followers: user.followers?.length || 0,
        following: user.following?.length || 0,
      }
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── CHANGE PASSWORD ──
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'New password must be at least 6 characters'
      });
    }

    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: 'Current password is incorrect'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(req.user.id, {
      password: hashedPassword,
    });

    res.status(200).json({ message: 'Password changed successfully!' });
  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── SEARCH USERS ──
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } },
      ],
    })
      .select('fullName username profilePicture university followers following')
      .limit(20);

    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── SEND FRIEND REQUEST ──
const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot add yourself' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const alreadyFriend = targetUser.friends.includes(req.user.id);
    if (alreadyFriend) {
      return res.status(400).json({ message: 'Already friends' });
    }

    const alreadyRequested = targetUser.friendRequests.some(
      r => r.from.toString() === req.user.id && r.status === 'pending'
    );
    if (alreadyRequested) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    await User.findByIdAndUpdate(userId, {
      $push: {
        friendRequests: {
          from: req.user.id,
          status: 'pending',
        },
      },
    });

    // Also follow the user
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { following: userId },
    });
    await User.findByIdAndUpdate(userId, {
      $addToSet: { followers: req.user.id },
    });

    res.status(200).json({ message: 'Friend request sent!' });
  } catch (error) {
    console.error('Friend request error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── ACCEPT FRIEND REQUEST ──
const acceptFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { friendRequests: { from: userId } },
      $addToSet: { friends: userId },
    });

    await User.findByIdAndUpdate(userId, {
      $addToSet: { friends: req.user.id },
    });

    res.status(200).json({ message: 'Friend request accepted!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET FRIEND SUGGESTIONS ──
const getFriendSuggestions = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id)
      .select('friends university');

    const suggestions = await User.find({
      _id: { $ne: req.user.id, $nin: currentUser.friends },
      university: currentUser.university,
    })
      .select('fullName username profilePicture university followers')
      .limit(10);

    res.status(200).json({ suggestions });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── GET USER BY SHARE LINK ──
const getUserByShareLink = async (req, res) => {
  try {
    const { shareLink } = req.params;
    const user = await User.findOne({ shareLink })
      .select('fullName username profilePicture university followers following plan');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  getFriendSuggestions,
  getUserByShareLink,
};