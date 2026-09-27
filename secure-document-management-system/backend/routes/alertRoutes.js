const express = require('express');
const { getAlerts, updateAlertStatus } = require('../controllers/alertController');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, requireRole('admin'));

router.get('/', getAlerts);
router.put('/:id/status', updateAlertStatus);

module.exports = router;
