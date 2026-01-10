import express from 'express';
import passport from 'passport';
import { generateToken } from '../utils/generateToken.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Normalize CLIENT_URL helper
const getClientUrl = () => {
  return process.env.CLIENT_URL?.replace(/\/+$/, '') || 'http://localhost:5173';
};

// Google OAuth login
router.get(
  '/google',
  (req, res, next) => {
    logger.info('Google OAuth login initiated');
    next();
  },
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// Google OAuth callback - Standardized to /api/auth/google/callback
router.get(
  '/google/callback',
  (req, res, next) => {
    logger.info('Google OAuth callback received');
    next();
  },
  passport.authenticate('google', {
    failureRedirect: `${getClientUrl()}/login?error=oauth_failed`,
    session: false,
  }),
  (req, res) => {
    try {
      const token = generateToken(req.user._id, req.user.role || 'user');
      const clientUrl = getClientUrl();
      const redirectUrl = `${clientUrl}/auth/callback?token=${token}`;
      logger.info(`Google OAuth success: Redirecting user ${req.user.email} to frontend`);
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('Google OAuth token generation failed:', error);
      const clientUrl = getClientUrl();
      res.redirect(`${clientUrl}/login?error=token_generation_failed`);
    }
  }
);

export default router;

