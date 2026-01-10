# Vora Deployment Guide

This guide covers deploying Vora to production environments like Render, Vercel, or similar platforms.

## Architecture

- **Frontend (Client)**: React + Vite app (deploy to Vercel, Netlify, or static hosting)
- **Backend (Server)**: Node.js + Express + Socket.io (deploy to Render, Railway, or similar)
- **Database**: MongoDB Atlas (recommended) or self-hosted MongoDB

## Environment Variables

### Client Environment Variables

Set these in your frontend hosting platform (Vercel/Netlify):

```bash
VITE_API_URL=https://your-server-url.herokuapp.com
```

### Server Environment Variables

Set these in your backend hosting platform (Render/Railway):

#### Required Variables

```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/vora?retryWrites=true&w=majority

# Client URL (your frontend URL)
CLIENT_URL=https://your-app.vercel.app

# Server URL (your backend URL - for OAuth callbacks)
SERVER_URL=https://your-server.herokuapp.com

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRES_IN=7d

# Session Secret
SESSION_SECRET=your-session-secret-key-min-32-characters-long
```

#### Google OAuth (Required for Google Login)

```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=${SERVER_URL}/auth/google/callback
```

**Note**: The `GOOGLE_CALLBACK_URL` can be explicitly set, or it will default to `${SERVER_URL}/auth/google/callback`. Make sure to configure this in your Google Cloud Console.

#### Email Configuration (Optional - for invites)

```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_SERVICE=gmail
```

For Gmail, you'll need to:
1. Enable 2-factor authentication
2. Generate an "App Password" in your Google Account settings
3. Use that app password as `EMAIL_PASS`

## Deployment Steps

### 1. Deploy Backend (Render/Railway)

1. **Create a new Web Service** on Render/Railway
2. **Connect your repository**
3. **Set environment variables** (listed above)
4. **Build Command**: Leave empty or `cd server && npm install`
5. **Start Command**: `cd server && npm start`

**For Render specifically:**
- Service Type: Web Service
- Build Command: (empty)
- Start Command: `cd server && npm start`
- Environment: Node

### 2. Deploy Frontend (Vercel/Netlify)

1. **Import your repository** to Vercel/Netlify
2. **Set root directory** to `client` (if option available)
3. **Build Command**: `pnpm install && pnpm build`
4. **Output Directory**: `client/dist`
5. **Set environment variable**: `VITE_API_URL` = your backend URL

**For Vercel specifically:**
- Framework Preset: Vite
- Root Directory: `client`
- Build Command: `pnpm install && pnpm build`
- Output Directory: `client/dist`

### 3. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create new one)
3. Go to **APIs & Services > Credentials**
4. Create **OAuth 2.0 Client ID**
5. Set **Authorized redirect URIs**:
   - Development: `http://localhost:5000/auth/google/callback`
   - Production: `https://your-server-url.com/auth/google/callback`
6. Copy Client ID and Client Secret to your server environment variables

### 4. Set Up MongoDB Atlas (Recommended)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. Create database user
4. Whitelist IP addresses (or `0.0.0.0/0` for all - less secure)
5. Get connection string and set as `MONGO_URI`

### 5. Build Verification

**Test Backend Build:**
```bash
cd server
npm install
npm start
```

**Test Frontend Build:**
```bash
cd client
pnpm install
pnpm build
```

The build should complete without errors. The `dist` folder contains production-ready files.

## Platform-Specific Notes

### Render

- Automatic HTTPS included
- WebSocket support enabled by default
- Environment variables set in dashboard
- Auto-deploys on git push

### Vercel

- Automatic HTTPS and CDN
- Serverless functions (not suitable for Socket.io)
- Use for frontend only
- Deploy backend separately

### Railway

- Automatic HTTPS
- WebSocket support
- Simple deployment process
- Automatic builds from Git

### Heroku

- Requires Procfile: `web: cd server && npm start`
- WebSocket support on all dynos
- Environment variables in Settings

## Post-Deployment Checklist

- [ ] Backend is accessible at `SERVER_URL`
- [ ] Frontend is accessible at `CLIENT_URL`
- [ ] Health check endpoint works: `${SERVER_URL}/health`
- [ ] Google OAuth callback URL is configured
- [ ] MongoDB connection is working
- [ ] Socket.io connections are working (check browser console)
- [ ] CORS is allowing requests from `CLIENT_URL`
- [ ] Environment variables are all set correctly

## Troubleshooting

### Socket.io Connection Issues

- Ensure WebSocket support is enabled on your hosting platform
- Check CORS settings allow your client URL
- Verify `CLIENT_URL` matches your frontend URL exactly
- Check browser console for connection errors

### OAuth Redirect Issues

- Ensure `GOOGLE_CALLBACK_URL` matches Google Cloud Console configuration
- Use `SERVER_URL` environment variable for consistency
- Check that callback URL uses HTTPS in production

### MongoDB Connection Issues

- Verify connection string format
- Check IP whitelist includes hosting platform IPs
- Ensure database user has proper permissions

### Build Failures

- Check Node.js version (requires 18+)
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

## Security Checklist

- [ ] `JWT_SECRET` is at least 32 characters, randomly generated
- [ ] `SESSION_SECRET` is at least 32 characters, randomly generated
- [ ] MongoDB connection uses authentication
- [ ] CORS is restricted to your `CLIENT_URL` only
- [ ] Rate limiting is enabled (configured by default)
- [ ] Helmet security headers are enabled (configured by default)
- [ ] Input sanitization is enabled (configured by default)
- [ ] Production environment uses HTTPS only

## Monitoring

- Monitor server logs for errors
- Set up health check endpoints for uptime monitoring
- Track Socket.io connection errors
- Monitor MongoDB connection pool

## Scaling Considerations

- MongoDB Atlas provides automatic scaling
- Consider Redis for Socket.io scaling (multiple server instances)
- Use load balancer with sticky sessions for Socket.io
- Consider CDN for static frontend assets

