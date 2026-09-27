const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logActivity } = require('../services/activityService');
const { evaluateFailedLogin, evaluateMLAnomaly } = require('../services/riskService');
const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// @route POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const user = await User.create({ name, email, password, role: 'user' });

    res.status(201).json({
      message: 'Account created successfully. Please log in.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      await logActivity({
        userName: email,
        activityType: 'FAILED_LOGIN',
        description: `Failed login attempt for unknown email ${email}`,
        ipAddress,
      });
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.status === 'blocked' || user.status === 'inactive') {
      return res.status(403).json({ message: `Account is ${user.status}. Contact an administrator.` });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      await logActivity({
        user,
        userName: user.name,
        activityType: 'FAILED_LOGIN',
        description: `Failed login attempt for ${user.email}`,
        ipAddress,
      });
      await evaluateFailedLogin(user);
      await evaluateMLAnomaly(user);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    user.lastLogin = new Date();
    await user.save();

    await logActivity({
      user,
      userName: user.name,
      activityType: 'LOGIN',
      description: `${user.name} logged in`,
      ipAddress,
    });

    await evaluateMLAnomaly(user);

    const token = signToken(user);

    res.json({
      message: 'Login successful.',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/auth/profile
const getProfile = async (req, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    await logActivity({
      user: req.user,
      userName: req.user.name,
      activityType: 'LOGOUT',
      description: `${req.user.name} logged out`,
      ipAddress: req.ip,
    });
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile, logout };
