const User = require('../models/User');
const Activity = require('../models/Activity');
const { getRiskLevel } = require('../services/riskService');
const { classifyBehavior, buildFeatureSnapshot } = require('../services/mlService');

// @route GET /api/risk (admin) - risk overview of all users
const getRiskOverview = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'user' }).sort({ riskScore: -1 });

    const overview = await Promise.all(
      users.map(async (user) => {
        const suspiciousCount = await Activity.countDocuments({
          user: user._id,
          activityType: { $in: ['FAILED_LOGIN', 'UNAUTHORIZED_ACCESS'] },
        });
        const lastActivity = await Activity.findOne({ user: user._id }).sort({ timestamp: -1 });

        return {
          userId: user._id,
          name: user.name,
          email: user.email,
          riskScore: user.riskScore,
          riskLevel: getRiskLevel(user.riskScore),
          suspiciousActivityCount: suspiciousCount,
          lastActivity: lastActivity ? lastActivity.timestamp : null,
        };
      })
    );

    const distribution = {
      LOW: overview.filter((u) => u.riskLevel === 'LOW').length,
      MEDIUM: overview.filter((u) => u.riskLevel === 'MEDIUM').length,
      HIGH: overview.filter((u) => u.riskLevel === 'HIGH').length,
    };

    res.json({ overview, distribution });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/risk/me - current user's own risk info
const getMyRisk = async (req, res, next) => {
  try {
    const suspiciousCount = await Activity.countDocuments({
      user: req.user._id,
      activityType: { $in: ['FAILED_LOGIN', 'UNAUTHORIZED_ACCESS'] },
    });

    res.json({
      riskScore: req.user.riskScore,
      riskLevel: getRiskLevel(req.user.riskScore),
      suspiciousActivityCount: suspiciousCount,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/risk/:userId/ml-status (admin) - live Isolation Forest / One-Class SVM
// classification for a specific user, using their current behavior snapshot.
// Useful for demos: shows the raw feature vector and both models' verdicts.
const getMLStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const result = await classifyBehavior(user);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/risk/me/ml-status - current user's own live ML classification
const getMyMLStatus = async (req, res, next) => {
  try {
    const result = await classifyBehavior(req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getRiskOverview, getMyRisk, getMLStatus, getMyMLStatus, buildFeatureSnapshot };
