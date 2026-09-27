const mongoose = require('mongoose');

const securityAlertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    alertType: {
      type: String,
      enum: [
        'HIGH_RISK_USER',
        'MULTIPLE_FAILED_LOGINS',
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        'UNUSUAL_DOWNLOAD_ACTIVITY',
        'RAPID_REPEATED_ACTIONS',
        'ML_ANOMALY_DETECTED',
      ],
      required: true,
    },
    description: { type: String, required: true },
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true },
    status: { type: String, enum: ['new', 'reviewed', 'resolved'], default: 'new' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SecurityAlert', securityAlertSchema);
