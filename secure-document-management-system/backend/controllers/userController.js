const User = require('../models/User');
const Activity = require('../models/Activity');
const { getIO } = require('../sockets/socketRegistry');

// @route GET /api/users (admin)
const getUsers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = search
      ? { $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] }
      : {};
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/users/:id (admin or self)
const getUserById = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden.' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const activities = await Activity.find({ user: user._id }).sort({ timestamp: -1 }).limit(50);

    res.json({ user, activities });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/users/:id (admin)
const updateUser = async (req, res, next) => {
  try {
    const { name, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (name) user.name = name;
    if (role && ['admin', 'user'].includes(role)) user.role = role;

    await user.save();
    res.json({ message: 'User updated.', user });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/users/:id/status (admin) - activate / deactivate / block
const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive', 'blocked'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.status = status;
    await user.save();

    const io = getIO();
    if (io) {
      io.emit('userStatusChanged', { userId: user._id, name: user.name, status: user.status });
    }

    res.json({ message: `User status updated to ${status}.`, user });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/users/:id (admin)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    await user.deleteOne();
    res.json({ message: 'User deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUserById, updateUser, updateUserStatus, deleteUser };
