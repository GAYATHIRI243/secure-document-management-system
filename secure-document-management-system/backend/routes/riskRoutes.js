const express = require('express');
const { getRiskOverview, getMyRisk, getMLStatus, getMyMLStatus } = require('../controllers/riskController');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', requireRole('admin'), getRiskOverview);
router.get('/me', getMyRisk);
router.get('/me/ml-status', getMyMLStatus);
router.get('/:userId/ml-status', requireRole('admin'), getMLStatus);

module.exports = router;
