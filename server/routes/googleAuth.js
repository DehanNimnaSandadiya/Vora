import express from 'express';
import passport from 'passport';
import { generateToken } from '../utils/generateToken.js';

const router = express.Router();

// Google OAuth login
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL?.replace(/\/+$/, '') || 'http://localhost:5173'}/login?error=oauth_failed`,
    session: false,
  }),
  (req, res) => {
    try {
      const token = generateToken(req.user._id, 'user');
      const clientUrl = process.env.CLIENT_URL?.replace(/\/+$/, '') || 'http://localhost:5173';
      const redirectUrl = `${clientUrl}/auth/callback?token=${token}`;
      res.redirect(redirectUrl);
    } catch (error) {
      const clientUrl = process.env.CLIENT_URL?.replace(/\/+$/, '') || 'http://localhost:5173';
      res.redirect(`${clientUrl}/login?error=token_generation_failed`);
    }
  }
);

export default router;

