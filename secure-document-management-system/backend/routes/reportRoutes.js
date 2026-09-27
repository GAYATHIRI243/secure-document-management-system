const express = require('express');
const { getReport } = require('../controllers/reportController');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, requireRole('admin'));

router.get('/', getReport);

module.exports = router;
