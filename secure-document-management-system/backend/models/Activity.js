const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    userName: { type: String, required: true },
    activityType: {
      type: String,
      enum: [
        'LOGIN',
        'LOGOUT',
        'FAILED_LOGIN',
        'DOCUMENT_UPLOAD',
        'DOCUMENT_VIEW',
        'DOCUMENT_DOWNLOAD',
        'DOCUMENT_DELETE',
        'UNAUTHORIZED_ACCESS',
      ],
      required: true,
    },
    description: { type: String, required: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: false },
    ipAddress: { type: String, default: 'unknown' },
    timestamp: { type: Date, default: Date.now },
    riskScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

activitySchema.index({ timestamp: -1 });

module.exports = mongoose.model('Activity', activitySchema);
