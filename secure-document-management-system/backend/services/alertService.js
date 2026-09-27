const SecurityAlert = require('../models/SecurityAlert');
const { getIO } = require('../sockets/socketRegistry');

/**
 * Creates a security alert and emits it in real time to admins.
 * @param {Object} params
 * @param {Object} params.user - Mongoose user document
 * @param {string} params.alertType
 * @param {string} params.description
 * @param {string} params.riskLevel - LOW | MEDIUM | HIGH
 */
const createAlert = async ({ user, alertType, description, riskLevel }) => {
  const alert = await SecurityAlert.create({
    user: user._id,
    alertType,
    description,
    riskLevel,
  });

  const populated = await alert.populate('user', 'name email role riskScore');

  const io = getIO();
  if (io) {
    io.emit('securityAlert', populated);
  }

  return populated;
};

module.exports = { createAlert };
