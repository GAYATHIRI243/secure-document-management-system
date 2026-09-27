const express = require('express');
const { getUsers, getUserById, updateUser, updateUserStatus, deleteUser } = require('../controllers/userController');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', requireRole('admin'), getUsers);
router.get('/:id', getUserById); // admin or self, enforced in controller
router.put('/:id', requireRole('admin'), updateUser);
router.put('/:id/status', requireRole('admin'), updateUserStatus);
router.delete('/:id', requireRole('admin'), deleteUser);

module.exports = router;
