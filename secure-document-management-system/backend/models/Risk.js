const mongoose = require('mongoose');

// Records every risk score change so we can chart trends and audit
// why a user's score moved.
const riskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    pointsAdded: { type: Number, required: true },
    scoreAfter: { type: Number, required: true },
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Risk', riskSchema);
