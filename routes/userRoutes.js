import express from 'express';
import { registerUser, loginUser } from '../controllers/userController.js';

const router = express.Router();

/**
 * POST /api/user/register
 * Body: { name, email }
 * Purpose: Register a new user
 */
router.post('/register', registerUser);

/**
 * POST /api/user/login
 * Body: { email }
 * Purpose: Basic login (no password) just to get user info for now
 */
router.post('/login', loginUser);

export default router;
