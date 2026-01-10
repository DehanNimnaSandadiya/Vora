# Deployment Fixes - Google OAuth & Render PORT

## ✅ Changes Made

### 1. Google OAuth Callback Standardization
- **Standardized route**: `/api/auth/google/callback`
- **Backward compatibility**: Also available at `/auth/google/callback`
- **Frontend updated**: Now uses `/api/auth/google` as primary route
- **Passport config**: Uses `GOOGLE_CALLBACK_URL` env var if provided, otherwise constructs from `SERVER_URL`

### 2. Render PORT Handling
- **PORT handling**: Uses `process.env.PORT` (Render injects this automatically)
- **Fallback**: Only for local development (`PORT || 5000`)
- **Server binding**: `httpServer.listen(PORT, '0.0.0.0', ...)` - binds to all interfaces for Render
- **Warning**: Logs warning if PORT not set in production

### 3. Enhanced Logging
- **OAuth callback**: Logs callback URL at startup
- **Google login**: Logs when OAuth login initiated
- **Callback received**: Logs when callback is received
- **Success**: Logs successful redirect with user email

## 📋 Files Changed

**Backend:**
- `server/config/passport.js` - Standardized callback URL to `/api/auth/google/callback`
- `server/routes/googleAuth.js` - Added logging, standardized routes
- `server/server.js` - PORT handling, route mounting, startup logging
- `server/routes/admin.js` - Fixed missing export default

**Frontend:**
- `client/src/pages/Login.tsx` - Updated to use `/api/auth/google`

## 🔧 Environment Variables for Render

Set these in Render dashboard:

```
CLIENT_URL=https://vora-client.vercel.app
SERVER_URL=https://vora-heal.onrender.com
GOOGLE_CALLBACK_URL=https://vora-heal.onrender.com/api/auth/google/callback
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-jwt-secret
MONGODB_URI=mongodb+srv://...
SESSION_SECRET=your-session-secret
PORT=(Auto-set by Render - do not set manually)
```

## 🔐 Google Cloud Console Configuration

### Authorized Redirect URIs

Add this exact URL in Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client:

```
https://vora-heal.onrender.com/api/auth/google/callback
```

**For local development**, also add:
```
http://localhost:5000/api/auth/google/callback
```

## ✅ Testing Checklist

### Local Development:
- [ ] `npm run start` works locally (uses port 5000)
- [ ] Google OAuth redirects to `/api/auth/google`
- [ ] Callback works at `/api/auth/google/callback`
- [ ] User redirects to frontend `/auth/callback?token=...`
- [ ] Login completes successfully

### Production (Render):
- [ ] Server starts on Render-injected PORT
- [ ] Google OAuth callback URL matches exactly: `https://vora-heal.onrender.com/api/auth/google/callback`
- [ ] No redirect loops
- [ ] No blank screens after login
- [ ] User successfully authenticated and redirected to dashboard

## 🚨 Important Notes

1. **GOOGLE_CALLBACK_URL**: If set, must match exactly what's in Google Cloud Console
2. **SERVER_URL**: Used to construct callback URL if `GOOGLE_CALLBACK_URL` is not set
3. **PORT**: Render automatically sets this - do NOT set manually
4. **CORS**: Already configured to allow Vercel frontend domain

## 🔄 OAuth Flow

1. User clicks "Continue with Google" → Frontend redirects to `/api/auth/google`
2. Backend redirects to Google consent screen
3. Google redirects back to `/api/auth/google/callback` with code
4. Backend exchanges code for user info, creates/updates user, generates JWT token
5. Backend redirects to frontend: `CLIENT_URL/auth/callback?token=JWT_TOKEN`
6. Frontend stores token, fetches user data, redirects to dashboard
