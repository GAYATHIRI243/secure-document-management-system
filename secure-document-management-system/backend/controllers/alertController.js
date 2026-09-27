const SecurityAlert = require('../models/SecurityAlert');

// @route GET /api/alerts (admin)
const getAlerts = async (req, res, next) => {
  try {
    const alerts = await SecurityAlert.find({})
      .populate('user', 'name email riskScore')
      .sort({ createdAt: -1 });
    res.json({ alerts });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/alerts/:id/status (admin) - mark reviewed / resolved
const updateAlertStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['new', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const alert = await SecurityAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found.' });

    alert.status = status;
    await alert.save();

    res.json({ message: `Alert marked as ${status}.`, alert });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAlerts, updateAlertStatus };
