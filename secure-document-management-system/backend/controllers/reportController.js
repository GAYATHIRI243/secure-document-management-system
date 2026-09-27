const User = require('../models/User');
const Document = require('../models/Document');
const Activity = require('../models/Activity');
const SecurityAlert = require('../models/SecurityAlert');

const rangeToDate = (range, from, to) => {
  const now = new Date();
  if (range === 'today') {
    return { $gte: new Date(now.setHours(0, 0, 0, 0)) };
  }
  if (range === '7d') {
    return { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  }
  if (range === '30d') {
    return { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
  }
  if (range === 'custom' && from && to) {
    return { $gte: new Date(from), $lte: new Date(to) };
  }
  return {};
};

// @route GET /api/reports?range=today|7d|30d|custom&from=&to=
const getReport = async (req, res, next) => {
  try {
    const { range = '7d', from, to } = req.query;
    const dateFilter = rangeToDate(range, from, to);
    const timestampFilter = Object.keys(dateFilter).length ? { timestamp: dateFilter } : {};
    const createdAtFilter = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    const [
      totalUsers,
      totalDocuments,
      totalActivities,
      suspiciousActivities,
      highRiskUsers,
      alertsInRange,
      documentsInRange,
    ] = await Promise.all([
      User.countDocuments({}),
      Document.countDocuments({}),
      Activity.countDocuments(timestampFilter),
      Activity.countDocuments({ ...timestampFilter, activityType: { $in: ['FAILED_LOGIN', 'UNAUTHORIZED_ACCESS'] } }),
      User.countDocuments({ riskScore: { $gte: 61 } }),
      SecurityAlert.countDocuments(createdAtFilter),
      Document.countDocuments({ uploadedAt: dateFilter.$gte ? dateFilter : { $exists: true } }),
    ]);

    res.json({
      range,
      totalUsers,
      totalDocuments,
      totalActivities,
      suspiciousActivities,
      highRiskUsers,
      alertsInRange,
      documentsInRange,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getReport };
