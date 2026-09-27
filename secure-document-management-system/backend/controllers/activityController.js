const Activity = require('../models/Activity');

// @route GET /api/activities
// Admins see all activity; normal users see only their own.
const getActivities = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
    const activities = await Activity.find(filter)
      .populate('document', 'documentName')
      .sort({ timestamp: -1 })
      .limit(500);
    res.json({ activities });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/activities/recent (used by monitoring page initial load)
const getRecentActivities = async (req, res, next) => {
  try {
    const activities = await Activity.find({})
      .populate('document', 'documentName')
      .sort({ timestamp: -1 })
      .limit(30);
    res.json({ activities });
  } catch (error) {
    next(error);
  }
};

module.exports = { getActivities, getRecentActivities };
