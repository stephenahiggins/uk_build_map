import { Router } from 'express';
import {
  getUser,
  register,
  login,
  refreshAccessToken,
  logout,
  googleLogin,
  requestPasswordReset,
  resetPassword,
  updateUser,
} from './auth.controller';
import authMiddleware from '@/src/v1/middlewares/authMiddleware';

const router: Router = Router();

// register a new user
router.post('/register', register);

// login a user
router.post('/login', login);

// google login
router.post('/google-login', googleLogin);

// refresh access token
router.post('/refresh-token', refreshAccessToken);

// forget password
router.post('/forgot-password', requestPasswordReset);

// reset password
router.post('/reset-password', resetPassword);

// logout
router.post('/logout', authMiddleware, logout);

// update user details
router.put('/update', authMiddleware, updateUser);

// get User Profile
router.get('/', authMiddleware, getUser);

export default router;
