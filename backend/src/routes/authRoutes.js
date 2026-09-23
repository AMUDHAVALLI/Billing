import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, me, status, updatePassword } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// 10 attempts per 15 minutes per IP — enough for a real typo or two, not
// enough for a password-guessing script.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in a few minutes.' },
});

router.get('/status', status);
router.post('/register', register);
router.post('/login', loginLimiter, login);
router.get('/me', requireAuth, me);
router.put('/password', requireAuth, loginLimiter, updatePassword);

export default router;
