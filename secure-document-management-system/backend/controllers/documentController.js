const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');
const { logActivity } = require('../services/activityService');
const { evaluateUnauthorizedAccess, evaluateDownload, evaluateRapidActions, evaluateMLAnomaly } = require('../services/riskService');

// @route POST /api/documents/upload
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'A file is required.' });
    }

    const { documentName, description } = req.body;

    const document = await Document.create({
      documentName: documentName || req.file.originalname,
      description: description || '',
      filePath: req.file.filename,
      fileType: path.extname(req.file.originalname).replace('.', '').toUpperCase() || 'FILE',
      fileSize: req.file.size,
      uploadedBy: req.user._id,
    });

    await logActivity({
      user: req.user,
      userName: req.user.name,
      activityType: 'DOCUMENT_UPLOAD',
      description: `${req.user.name} uploaded "${document.documentName}"`,
      documentId: document._id,
      ipAddress: req.ip,
    });

    await evaluateRapidActions(req.user);
    await evaluateMLAnomaly(req.user);

    const populated = await document.populate('uploadedBy', 'name email');
    res.status(201).json({ message: 'Document uploaded successfully.', document: populated });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/documents
const getDocuments = async (req, res, next) => {
  try {
    const { search } = req.query;
    const baseFilter = req.user.role === 'admin' ? {} : { uploadedBy: req.user._id };

    const filter = search
      ? { ...baseFilter, $or: [{ documentName: new RegExp(search, 'i') }, { fileType: new RegExp(search, 'i') }] }
      : baseFilter;

    const documents = await Document.find(filter).populate('uploadedBy', 'name email').sort({ uploadedAt: -1 });
    res.json({ documents });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/documents/:id
const getDocumentById = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id).populate('uploadedBy', 'name email');
    if (!document) return res.status(404).json({ message: 'Document not found.' });

    const isOwner = document.uploadedBy._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      await logActivity({
        user: req.user,
        userName: req.user.name,
        activityType: 'UNAUTHORIZED_ACCESS',
        description: `${req.user.name} attempted to view a document they do not own`,
        documentId: document._id,
        ipAddress: req.ip,
        riskScore: 30,
      });
      await evaluateUnauthorizedAccess(req.user, `${req.user.name} attempted to view "${document.documentName}" without authorization.`);
      return res.status(403).json({ message: 'You are not authorized to access this document.' });
    }

    await logActivity({
      user: req.user,
      userName: req.user.name,
      activityType: 'DOCUMENT_VIEW',
      description: `${req.user.name} viewed "${document.documentName}"`,
      documentId: document._id,
      ipAddress: req.ip,
    });

    res.json({ document });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/documents/:id/download
const downloadDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id).populate('uploadedBy', 'name email');
    if (!document) return res.status(404).json({ message: 'Document not found.' });

    const isOwner = document.uploadedBy._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      await logActivity({
        user: req.user,
        userName: req.user.name,
        activityType: 'UNAUTHORIZED_ACCESS',
        description: `${req.user.name} attempted to download a document they do not own`,
        documentId: document._id,
        ipAddress: req.ip,
        riskScore: 30,
      });
      await evaluateUnauthorizedAccess(req.user, `${req.user.name} attempted to download "${document.documentName}" without authorization.`);
      return res.status(403).json({ message: 'You are not authorized to download this document.' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', document.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File is missing from storage.' });
    }

    await logActivity({
      user: req.user,
      userName: req.user.name,
      activityType: 'DOCUMENT_DOWNLOAD',
      description: `${req.user.name} downloaded "${document.documentName}"`,
      documentId: document._id,
      ipAddress: req.ip,
    });

    await evaluateDownload(req.user);
    await evaluateRapidActions(req.user);
    await evaluateMLAnomaly(req.user);

    res.download(filePath, document.documentName);
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/documents/:id
const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found.' });

    const isOwner = document.uploadedBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      await evaluateUnauthorizedAccess(req.user, `${req.user.name} attempted to delete "${document.documentName}" without authorization.`);
      return res.status(403).json({ message: 'You are not authorized to delete this document.' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', document.filePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await document.deleteOne();

    await logActivity({
      user: req.user,
      userName: req.user.name,
      activityType: 'DOCUMENT_DELETE',
      description: `${req.user.name} deleted "${document.documentName}"`,
      ipAddress: req.ip,
    });

    res.json({ message: 'Document deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadDocument, getDocuments, getDocumentById, downloadDocument, deleteDocument };
