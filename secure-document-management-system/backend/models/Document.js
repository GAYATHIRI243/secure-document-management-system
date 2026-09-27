const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    documentName: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    filePath: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

documentSchema.index({ documentName: 'text', fileType: 'text' });

module.exports = mongoose.model('Document', documentSchema);
