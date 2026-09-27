const User = require('../models/User');
const Activity = require('../models/Activity');
const Risk = require('../models/Risk');
const { getIO } = require('../sockets/socketRegistry');
const { createAlert } = require('./alertService');
const { classifyBehavior } = require('./mlService');

const ML_ANOMALY_POINTS = Number(process.env.RISK_ML_ANOMALY || 20);

const POINTS = {
  FAILED_LOGIN: Number(process.env.RISK_FAILED_LOGIN || 10),
  MULTIPLE_FAILED_LOGIN: Number(process.env.RISK_MULTIPLE_FAILED_LOGIN || 25),
  UNAUTHORIZED_ACCESS: Number(process.env.RISK_UNAUTHORIZED_ACCESS || 30),
  EXCESSIVE_DOWNLOAD: Number(process.env.RISK_EXCESSIVE_DOWNLOAD || 20),
  RAPID_ACTIONS: Number(process.env.RISK_RAPID_ACTIONS || 15),
};

const WINDOWS = {
  FAILED_LOGIN_MINUTES: Number(process.env.FAILED_LOGIN_WINDOW_MINUTES || 15),
  FAILED_LOGIN_THRESHOLD: Number(process.env.FAILED_LOGIN_THRESHOLD || 3),
  DOWNLOAD_MINUTES: Number(process.env.DOWNLOAD_WINDOW_MINUTES || 10),
  DOWNLOAD_THRESHOLD: Number(process.env.DOWNLOAD_THRESHOLD || 5),
  RAPID_SECONDS: Number(process.env.RAPID_ACTION_WINDOW_SECONDS || 30),
  RAPID_THRESHOLD: Number(process.env.RAPID_ACTION_THRESHOLD || 6),
};

const getRiskLevel = (score) => {
  if (score <= 30) return 'LOW';
  if (score <= 60) return 'MEDIUM';
  return 'HIGH';
};

/**
 * Adds points to a user's risk score (clamped 0-100), logs the change,
 * and raises an alert + real-time event if the user crosses into HIGH risk.
 */
const applyRiskPoints = async (user, points, reason) => {
  const previousScore = user.riskScore || 0;
  const newScore = Math.max(0, Math.min(100, previousScore + points));
  user.riskScore = newScore;
  await user.save();

  const riskLevel = getRiskLevel(newScore);

  await Risk.create({
    user: user._id,
    reason,
    pointsAdded: points,
    scoreAfter: newScore,
    riskLevel,
  });

  const io = getIO();
  if (io) {
    io.emit('riskUpdated', {
      userId: user._id,
      userName: user.name,
      riskScore: newScore,
      riskLevel,
      reason,
    });
  }

  if (riskLevel === 'HIGH' && previousScore <= 60) {
    await createAlert({
      user,
      alertType: 'HIGH_RISK_USER',
      description: `${user.name} crossed into HIGH risk (score: ${newScore}). Reason: ${reason}`,
      riskLevel: 'HIGH',
    });
  }

  return { newScore, riskLevel };
};

// Checks recent failed logins for this email/user within the configured window.
const evaluateFailedLogin = async (user) => {
  await applyRiskPoints(user, POINTS.FAILED_LOGIN, 'Failed login attempt');

  const since = new Date(Date.now() - WINDOWS.FAILED_LOGIN_MINUTES * 60 * 1000);
  const recentFailures = await Activity.countDocuments({
    user: user._id,
    activityType: 'FAILED_LOGIN',
    timestamp: { $gte: since },
  });

  if (recentFailures >= WINDOWS.FAILED_LOGIN_THRESHOLD) {
    await applyRiskPoints(user, POINTS.MULTIPLE_FAILED_LOGIN, 'Multiple failed login attempts');
    await createAlert({
      user,
      alertType: 'MULTIPLE_FAILED_LOGINS',
      description: `${user.name} had ${recentFailures} failed login attempts in the last ${WINDOWS.FAILED_LOGIN_MINUTES} minutes.`,
      riskLevel: 'MEDIUM',
    });
  }
};

const evaluateUnauthorizedAccess = async (user, description) => {
  await applyRiskPoints(user, POINTS.UNAUTHORIZED_ACCESS, 'Unauthorized access attempt');
  await createAlert({
    user,
    alertType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
    description: description || `${user.name} attempted to access a resource without authorization.`,
    riskLevel: 'HIGH',
  });
};

// Checks recent downloads for excessive activity in the configured window.
const evaluateDownload = async (user) => {
  const since = new Date(Date.now() - WINDOWS.DOWNLOAD_MINUTES * 60 * 1000);
  const recentDownloads = await Activity.countDocuments({
    user: user._id,
    activityType: 'DOCUMENT_DOWNLOAD',
    timestamp: { $gte: since },
  });

  if (recentDownloads >= WINDOWS.DOWNLOAD_THRESHOLD) {
    await applyRiskPoints(user, POINTS.EXCESSIVE_DOWNLOAD, 'Excessive document downloads');
    await createAlert({
      user,
      alertType: 'UNUSUAL_DOWNLOAD_ACTIVITY',
      description: `${user.name} downloaded ${recentDownloads} documents in the last ${WINDOWS.DOWNLOAD_MINUTES} minutes.`,
      riskLevel: 'MEDIUM',
    });
  }
};

// Checks for rapid repeated actions of any kind (bursty behavior).
const evaluateRapidActions = async (user) => {
  const since = new Date(Date.now() - WINDOWS.RAPID_SECONDS * 1000);
  const recentActions = await Activity.countDocuments({
    user: user._id,
    timestamp: { $gte: since },
  });

  if (recentActions >= WINDOWS.RAPID_THRESHOLD) {
    await applyRiskPoints(user, POINTS.RAPID_ACTIONS, 'Rapid repeated actions');
    await createAlert({
      user,
      alertType: 'RAPID_REPEATED_ACTIONS',
      description: `${user.name} performed ${recentActions} actions within ${WINDOWS.RAPID_SECONDS} seconds.`,
      riskLevel: 'MEDIUM',
    });
  }
};

/**
 * Sends the user's current behavior snapshot to the Isolation Forest /
 * One-Class SVM microservice. If either model flags it as an anomaly,
 * adds risk points and raises an ML_ANOMALY_DETECTED alert naming which
 * model(s) triggered it. Safe to call even if the ML service is offline -
 * it just skips silently (the rule-based checks above still run).
 */
const evaluateMLAnomaly = async (user) => {
  const result = await classifyBehavior(user);

  if (!result.available) {
    return { checked: false, reason: result.reason };
  }

  // Broadcast EVERY classification (not just anomalies) so the Live
  // Monitoring page can show a continuous feed of the ML models' verdicts.
  const io = getIO();
  if (io) {
    io.emit('mlClassification', {
      userId: user._id,
      userName: user.name,
      timestamp: new Date(),
      isolation_forest: result.isolation_forest,
      one_class_svm: result.one_class_svm,
      combined_is_anomaly: result.combined_is_anomaly,
      snapshot: result.snapshot,
    });
  }

  if (result.combined_is_anomaly) {
    const flaggedBy = [
      result.isolation_forest?.is_anomaly && 'Isolation Forest',
      result.one_class_svm?.is_anomaly && 'One-Class SVM',
    ].filter(Boolean).join(' + ');

    await applyRiskPoints(user, ML_ANOMALY_POINTS, `ML anomaly detected (${flaggedBy})`);
    await createAlert({
      user,
      alertType: 'ML_ANOMALY_DETECTED',
      description: `${user.name}'s recent behavior was flagged as anomalous by ${flaggedBy}.`,
      riskLevel: 'MEDIUM',
    });
  }

  return { checked: true, ...result };
};

module.exports = {
  POINTS,
  WINDOWS,
  getRiskLevel,
  applyRiskPoints,
  evaluateFailedLogin,
  evaluateUnauthorizedAccess,
  evaluateDownload,
  evaluateRapidActions,
  evaluateMLAnomaly,
};
