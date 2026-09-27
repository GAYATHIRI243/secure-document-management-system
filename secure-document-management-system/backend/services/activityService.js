const Activity = require('../models/Activity');
const { getIO } = require('../sockets/socketRegistry');

/**
 * Creates an activity log entry and broadcasts it in real time.
 * @param {Object} params
 * @param {Object} [params.user] - Mongoose user document or null (e.g. anonymous failed login)
 * @param {string} params.userName
 * @param {string} params.activityType
 * @param {string} params.description
 * @param {string} [params.documentId]
 * @param {string} [params.ipAddress]
 * @param {number} [params.riskScore]
 */
const logActivity = async ({
  user = null,
  userName,
  activityType,
  description,
  documentId = null,
  ipAddress = 'unknown',
  riskScore = 0,
}) => {
  const activity = await Activity.create({
    user: user ? user._id : null,
    userName,
    activityType,
    description,
    document: documentId,
    ipAddress,
    riskScore,
  });

  const populated = await activity.populate('document', 'documentName');

  const io = getIO();
  if (io) {
    io.emit('activityCreated', populated);
  }

  return populated;
};

module.exports = { logActivity };
