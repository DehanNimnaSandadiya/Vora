# Vora - Deployment Guide

## Environment Variables

### Render (Backend)

Set these in Render Dashboard → Environment:

```
CLIENT_URL=https://vora-client.vercel.app
SERVER_URL=https://vora-heal.onrender.com
GOOGLE_CALLBACK_URL=https://vora-heal.onrender.com/api/auth/google/callback
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-secure-jwt-secret-min-32-chars
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vora?retryWrites=true&w=majority
SESSION_SECRET=your-secure-session-secret
JITSI_DOMAIN=meet.jit.si
NODE_ENV=production
```

**Important:**
- `PORT` is automatically set by Render - do NOT set it manually
- `CLIENT_URL` must match your Vercel frontend URL exactly (no trailing slash)
- `GOOGLE_CALLBACK_URL` must match what's configured in Google Cloud Console

### Vercel (Frontend)

Set these in Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_URL=https://vora-heal.onrender.com/api
VITE_JITSI_DOMAIN=meet.jit.si
```

**Important:**
- `VITE_API_URL` should be your Render backend URL + `/api`
- No trailing slash on `VITE_API_URL`

## Google Cloud Console Setup

1. Go to: https://console.cloud.google.com/apis/credentials
2. Open your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", add:
   ```
   https://vora-heal.onrender.com/api/auth/google/callback
   ```
4. For local development (optional):
   ```
   http://localhost:5000/api/auth/google/callback
   ```
5. Click **Save**

## Testing Features

### 1. Side Panel Toggle
- Open any room
- Click the panel toggle button (top right)
- Panel should collapse/expand smoothly
- Refresh page - preference should persist

### 2. Sample Users Seed (Admin Only)
- Log in as admin
- Open browser console or use API client
- POST to: `https://vora-heal.onrender.com/api/admin/seed-users`
- Headers: `Authorization: Bearer <admin-token>`
- Check response - should show created users
- All demo users have password: `demo123`

### 3. Badge System
**First Session Badge:**
- Start a Pomodoro timer (any preset)
- Let it complete or manually end session
- Check Profile → Stats tab - should see "First Session" badge

**Streak 3 Badge:**
- Complete focus sessions on 3 consecutive days
- Badge appears automatically in Profile

**Task Finisher Badge:**
- Complete 10 tasks (mark as "done")
- Badge appears automatically

**Focused 5h Badge:**
- Accumulate 5 hours (300 minutes) of focus time
- Badge appears automatically

**Badges Display:**
- Profile page → Stats tab shows all earned badges
- Room participants list shows badge icons next to names

### 4. Screen Share
- Join a room with at least 2 users
- User 1: Click "Start Share" button
- Browser will ask for screen share permission
- After permission granted, screen should appear in video element
- Other users in room should see the shared screen automatically
- Only one person can share at a time per room
- Click "Stop Share" to end sharing

## Local Development

### Backend
```bash
cd server
npm install
# Create .env with same variables as Render (use localhost URLs)
npm run start
```

### Frontend
```bash
cd client
npm install
# Create .env.local:
# VITE_API_URL=http://localhost:5000/api
# VITE_JITSI_DOMAIN=meet.jit.si
npm run dev
```

## New Environment Variables Summary

**Backend (Render):**
- No new vars (all existing)

**Frontend (Vercel):**
- No new vars (all existing)

## Files Changed

**Backend:**
- `server/utils/badges.js` - Fixed badge checking logic (removed duplicate user fetch, fixed task_finisher to use stats.tasksCompleted)
- `server/socket/timerHandlers.js` - Added streak tracking (daily activity) and badge checking on session end
- `server/routes/tasks.js` - Added badge checking on task completion (increments stats.tasksCompleted)
- `server/routes/admin.js` - Added `/api/admin/seed-users` endpoint (creates 8 demo users with password: demo123)
- `server/routes/users.js` - Added badges field to `/api/users/me` response
- `server/routes/rooms.js` - Added badges to owner/members populate fields
- `server/socket/roomHandlers.js` - Added badges to presence emit data
- `server/socket/screenShareHandlers.js` - NEW: Screen share WebRTC signaling handlers
- `server/server.js` - Added screenShareHandlers initialization

**Frontend:**
- `client/src/components/ui/badge-icon.tsx` - NEW: BadgeIcon and BadgeList components
- `client/src/pages/Profile.tsx` - Added badge display section in Stats tab, updated stats display
- `client/src/pages/RoomDetail.tsx` - Added badge icons to participant names, integrated ScreenShare component, side panel toggle (already existed)
- `client/src/components/rooms/ScreenShare.tsx` - NEW: Screen share component with WebRTC
- `client/src/contexts/AuthContext.tsx` - Added badges and stats fields to User interface
- `client/src/hooks/useRoom.ts` - Added badges to PresenceUser interface

**No new npm dependencies required** - Uses native WebRTC APIs and existing Socket.io

## Testing Checklist

### ✅ Feature 4: Side Panel Toggle
1. Open any room page
2. Click panel toggle button (top right of chat panel)
3. Panel should collapse/expand smoothly
4. Refresh page - preference persists in localStorage

### ✅ Feature 5: Sample Users Seed
1. Log in as admin user
2. Use Postman/curl or browser console:
   ```javascript
   fetch('https://vora-heal.onrender.com/api/admin/seed-users', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${localStorage.getItem('token')}`
     }
   }).then(r => r.json()).then(console.log)
   ```
3. Response should show created users
4. Login with demo users: email format `name.demo@vora.test`, password: `demo123`

### ✅ Feature 6: Badge System
**Test First Session Badge:**
- Start a 15min Pomodoro timer
- Complete the session
- Go to Profile → Stats tab
- Should see "First Session" badge

**Test Task Finisher Badge:**
- Create and complete 10 tasks across rooms
- Badge appears automatically in Profile

**Test Focused 5h Badge:**
- Complete multiple focus sessions totaling 5 hours (300 minutes)
- Badge appears automatically

**Test Streak 3 Badge:**
- Complete focus sessions on 3 consecutive days
- Badge appears automatically

**Test Badge Display:**
- Profile page → Stats tab shows all earned badges with icons
- Room participants list shows badge icons next to names (max 2 visible, +N for more)

### ⚠️ Feature 7: Screen Share
**Note:** Screen share requires WebRTC which may have connectivity issues on free tiers due to NAT/firewall. For production, consider TURN servers.

**Test Screen Share:**
1. Open room in 2 different browsers/devices
2. User 1: Click "Start Share" button
3. Browser prompts for screen/window selection
4. After selection, video should appear
5. User 2: Should automatically see the shared screen
6. User 1: Click "Stop Share" - sharing ends for all
7. Only one person can share at a time (error shown if someone else is sharing)

**Known Limitations:**
- Uses free STUN server (stun.l.google.com)
- May not work behind strict firewalls/NAT
- For production, add TURN server configuration
