const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTER
const register = async (req, res) => {
  try {
    console.log('Register body:', req.body);
    const { fullName, email, password, university } = req.body;

    if (!fullName || !email || !password || !university) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered. Please login.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      university,
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
        email: newUser.email,
        university: newUser.university,
        plan: newUser.plan,
      }
    });

  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    console.log('Login body:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'No account found with this email.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password. Please try again.' });
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
        email: user.email,
        university: user.university,
        plan: user.plan,
        studyStreak: user.studyStreak,
        points: user.points,
      }
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// GET CURRENT USER
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE PROFILE
// UPDATE PROFILE
const updateProfile = async (req, res) => {
  try {
    const { fullName, university, language } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, university, language },
      { new: true }
    ).select('-password');
    res.status(200).json({ message: 'Profile updated!', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, getMe, updateProfile };