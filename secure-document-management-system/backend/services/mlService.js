const axios = require('axios');
const Activity = require('../models/Activity');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';
const TIMEOUT_MS = Number(process.env.ML_SERVICE_TIMEOUT_MS || 2000);

/**
 * Builds the same 5-feature behavior snapshot the Python service was
 * trained on, from this user's recent activity in MongoDB.
 * Feature order/names must match ml-service/features.py exactly.
 */
const buildFeatureSnapshot = async (user) => {
  const now = Date.now();
  const since15m = new Date(now - 15 * 60 * 1000);
  const since10m = new Date(now - 10 * 60 * 1000);
  const since30s = new Date(now - 30 * 1000);

  const [failedLogins15m, downloads10m, actions30s, unauthorizedAttempts] = await Promise.all([
    Activity.countDocuments({ user: user._id, activityType: 'FAILED_LOGIN', timestamp: { $gte: since15m } }),
    Activity.countDocuments({ user: user._id, activityType: 'DOCUMENT_DOWNLOAD', timestamp: { $gte: since10m } }),
    Activity.countDocuments({ user: user._id, timestamp: { $gte: since30s } }),
    Activity.countDocuments({ user: user._id, activityType: 'UNAUTHORIZED_ACCESS' }),
  ]);

  return {
    failed_logins_15m: failedLogins15m,
    downloads_10m: downloads10m,
    actions_30s: actions30s,
    unauthorized_attempts: unauthorizedAttempts,
    hour_of_day: new Date().getHours(),
  };
};

/**
 * Sends a user's current behavior snapshot to the Isolation Forest /
 * One-Class SVM service and returns its verdict. Fails soft: if the ML
 * service is unreachable (e.g. not started), returns a "not available"
 * result instead of throwing, so the rule-based risk engine keeps working
 * even without the ML service running.
 */
const classifyBehavior = async (user) => {
  try {
    const snapshot = await buildFeatureSnapshot(user);
    const { data } = await axios.post(`${ML_SERVICE_URL}/predict`, snapshot, { timeout: TIMEOUT_MS });
    return { available: true, snapshot, ...data };
  } catch (error) {
    return {
      available: false,
      reason: error.code === 'ECONNREFUSED' ? 'ML service not running' : error.message,
    };
  }
};

module.exports = { classifyBehavior, buildFeatureSnapshot };
