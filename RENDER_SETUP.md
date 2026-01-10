# 🎯 Render Deployment - Step by Step

## Quick Setup Guide for Render (Backend)

### Step 1: Sign Up / Log In to Render
1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended)

### Step 2: Create New Web Service
1. Click "New +" button (top right)
2. Select "Web Service"
3. Connect your GitHub account if not already connected
4. Find and select: **DehanNimnaSandadiya/Vora**
5. Click "Connect"

### Step 3: Configure Service

**Basic Settings:**
- **Name:** `vora-backend` (or any name you want)
- **Region:** Choose closest to you (Oregon, Frankfurt, etc.)
- **Branch:** `main`
- **Root Directory:** `server` ⚠️ **THIS IS CRITICAL!**
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Plan:** Free (or Starter if you want always-on)

### Step 4: Set Environment Variables

Scroll down to "Environment Variables" section and click "Add Environment Variable" for each:

**Required Variables:**
```
NODE_ENV = production
PORT = 5000
```

**Database:**
```
MONGO_URI = mongodb+srv://username:password@cluster.mongodb.net/vora?retryWrites=true&w=majority
```
(Replace with your actual MongoDB Atlas connection string)

**Client URL (update after Vercel deployment):**
```
CLIENT_URL = https://your-app.vercel.app
```
(You'll update this after deploying frontend to Vercel)

**Secrets (generate random 32+ character strings):**
```
JWT_SECRET = [Generate random string - see below]
SESSION_SECRET = [Generate random string - see below]
```

**Google OAuth:**
```
GOOGLE_CLIENT_ID = your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = your-client-secret
GOOGLE_CALLBACK_URL = https://vora-backend.onrender.com/auth/google/callback
```
(Replace `vora-backend` with your actual Render service name)

### Step 5: Generate Secrets (Windows PowerShell)

```powershell
# Generate JWT_SECRET (run this command, copy the output)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object {[char]$_})

# Generate SESSION_SECRET (run again to get different value)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object {[char]$_})
```

### Step 6: Deploy

1. Review all settings
2. Click "Create Web Service"
3. Wait 5-10 minutes for first deployment
4. Your backend will be live at: `https://vora-backend.onrender.com`

### Step 7: Verify Deployment

1. Visit: `https://your-backend-name.onrender.com/health`
2. You should see: `{"status":"ok","timestamp":"...","uptime":...}`

### Step 8: Update Environment Variables After Vercel Deployment

Once your frontend is deployed on Vercel:
1. Go to Render dashboard > Your service > Environment
2. Update `CLIENT_URL` to your Vercel URL
3. Render will auto-redeploy

### Troubleshooting

**Build fails:**
- Check "Logs" tab in Render dashboard
- Verify Root Directory is set to `server`
- Check npm install logs

**Service won't start:**
- Check "Logs" tab
- Verify all environment variables are set
- Check MongoDB connection string format

**502 Bad Gateway:**
- Service might be spinning up (free tier)
- Wait 30-60 seconds and refresh
- Check logs for errors

---

## Render Free Tier Notes

- ✅ Services spin down after 15 min inactivity
- ✅ First request after spin-down: 30-60 second delay (cold start)
- ✅ 750 hours/month free (enough for one always-on service)
- ⚠️ WebSocket connections may have limitations on free tier
