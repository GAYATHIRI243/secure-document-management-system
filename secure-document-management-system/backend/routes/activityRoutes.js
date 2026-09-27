const express = require('express');
const { getActivities, getRecentActivities } = require('../controllers/activityController');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getActivities);
router.get('/recent', requireRole('admin'), getRecentActivities);

module.exports = router;
