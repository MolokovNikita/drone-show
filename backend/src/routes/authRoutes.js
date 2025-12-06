const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.post(
  '/register',
  [
    body('username').notEmpty().trim().isLength({ min: 3 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').notEmpty().trim()
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('username').notEmpty().trim(),
    body('password').notEmpty()
  ],
  authController.login
);

router.post('/refresh', authController.refreshToken);
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;

