import express from 'express';
import { register, login, me, status } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/status', status);
router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);

export default router;
