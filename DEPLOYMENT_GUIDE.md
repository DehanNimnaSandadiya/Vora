# 🚀 Complete Deployment Guide for Vora

This guide will walk you through deploying Vora to **Render (Backend)** and **Vercel (Frontend)** for FREE.

## 📋 Prerequisites

Before starting, you need:
- GitHub account
- MongoDB Atlas account (free tier)
- Google Cloud Console account (for OAuth)
- Render account (free tier)
- Vercel account (free tier)

---

## Step 1: Push Code to GitHub

### 1.1 Initialize Git (if not already done)

```bash
cd C:\Users\motio\Music\Vora
git init
git add .
git commit -m "Initial commit: Production-ready Vora app"
```

### 1.2 Add Remote and Push

```bash
git remote add origin https://github.com/DehanNimnaSandadiya/Vora.git
git branch -M main
git push -u origin main
```

**If you get authentication errors**, use GitHub CLI or set up SSH keys.

---

## Step 2: Set Up MongoDB Atlas (Database)

### 2.1 Create MongoDB Atlas Account
1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for free
3. Create a new project (e.g., "Vora")

### 2.2 Create a Cluster
1. Click "Build a Database"
2. Select **FREE (M0)** tier
3. Choose your cloud provider and region (closest to you)
4. Click "Create"

### 2.3 Configure Database Access
1. Go to **Database Access** (left sidebar)
2. Click "Add New Database User"
3. Authentication: **Password**
4. Username: Create a username
5. Password: Click "Autogenerate Secure Password" (SAVE THIS!)
6. Database User Privileges: **Atlas admin**
7. Click "Add User"

### 2.4 Configure Network Access
1. Go to **Network Access** (left sidebar)
2. Click "Add IP Address"
3. Click **"Allow Access from Anywhere"** (for production)
   - Or add `0.0.0.0/0`
4. Click "Confirm"

### 2.5 Get Connection String
1. Go to **Database** (left sidebar)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Driver: **Node.js**, Version: **5.5 or later**
5. Copy the connection string
   - It looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
6. Replace `<password>` with your actual password
7. Add database name: Change `?` to `/vora?`
   - Final: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/vora?retryWrites=true&w=majority`
8. **SAVE THIS** - You'll need it for Render!

---

## Step 3: Set Up Google OAuth

### 3.1 Create Google Cloud Project
1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Click "Create Project"
3. Name: "Vora"
4. Click "Create"

### 3.2 Configure OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**
2. User Type: **External** (for free)
3. App name: "Vora"
4. User support email: Your email
5. Developer contact: Your email
6. Click "Save and Continue"
7. Scopes: Click "Save and Continue" (default is fine)
8. Test users: Add your email (for testing)
9. Click "Save and Continue"
10. Click "Back to Dashboard"

### 3.3 Create OAuth Credentials
1. Go to **APIs & Services > Credentials**
2. Click "Create Credentials" > "OAuth client ID"
3. Application type: **Web application**
4. Name: "Vora Web Client"
5. **Authorized JavaScript origins:**
   - `http://localhost:5173` (for local dev)
   - `https://your-app.vercel.app` (you'll add this after Vercel deployment)
6. **Authorized redirect URIs:**
   - `http://localhost:5000/auth/google/callback` (for local dev)
   - `https://your-backend.onrender.com/auth/google/callback` (you'll add after Render deployment)
7. Click "Create"
8. **Copy Client ID and Client Secret** - You'll need these for Render!

---

## Step 4: Deploy Backend to Render

### 4.1 Create Render Account
1. Go to [https://render.com](https://render.com)
2. Sign up with GitHub
3. Authorize Render to access your repositories

### 4.2 Create New Web Service
1. Click "New +" > "Web Service"
2. Connect your repository: Select **DehanNimnaSandadiya/Vora**
3. Configure:
   - **Name:** `vora-backend` (or any name)
   - **Region:** Choose closest to you
   - **Branch:** `main`
   - **Root Directory:** `server` ⚠️ **IMPORTANT**
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** **Free** (or Starter if you want)

### 4.3 Set Environment Variables
In Render dashboard, go to **Environment** tab and add:

```bash
NODE_ENV=production
PORT=5000

# MongoDB (from Step 2.5)
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/vora?retryWrites=true&w=majority

# Frontend URL (you'll update this after Vercel deployment)
CLIENT_URL=https://your-app.vercel.app

# JWT Secret (generate a random 32+ char string)
JWT_SECRET=your-random-secret-key-min-32-characters-long-change-this-in-production

# Session Secret (generate another random 32+ char string)
SESSION_SECRET=your-random-session-secret-min-32-characters-long-change-this

# Google OAuth (from Step 3.3)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://vora-backend.onrender.com/auth/google/callback
```

**To generate secrets:**
```bash
# On Windows PowerShell:
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### 4.4 Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Your backend URL will be: `https://vora-backend.onrender.com` (or your custom name)
4. **Copy this URL** - You'll need it for Vercel!

### 4.5 Test Backend
Visit: `https://vora-backend.onrender.com/health`
You should see: `{"status":"ok",...}`

---

## Step 5: Deploy Frontend to Vercel

### 5.1 Create Vercel Account
1. Go to [https://vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Authorize Vercel to access your repositories

### 5.2 Import Project
1. Click "Add New" > "Project"
2. Import Git Repository: Select **DehanNimnaSandadiya/Vora**
3. Configure Project:
   - **Framework Preset:** Vite
   - **Root Directory:** `client` ⚠️ **IMPORTANT**
   - **Build Command:** `cd .. && pnpm install && cd client && pnpm build`
   - **Output Directory:** `client/dist`
   - **Install Command:** `cd .. && pnpm install`

### 5.3 Set Environment Variables
In Vercel dashboard, go to **Environment Variables** and add:

```bash
VITE_API_URL=https://vora-backend.onrender.com
```
(Use your actual Render backend URL)

### 5.4 Deploy
1. Click "Deploy"
2. Wait for deployment (2-5 minutes)
3. Your frontend URL will be: `https://vora-xxxxx.vercel.app`
4. **Copy this URL** - You'll need to update Render and Google OAuth!

---

## Step 6: Update Configuration

### 6.1 Update Render Environment Variables
1. Go back to Render dashboard
2. Update `CLIENT_URL` with your Vercel URL:
   ```
   CLIENT_URL=https://vora-xxxxx.vercel.app
   ```
3. Redeploy (Render auto-redeploys on env var changes)

### 6.2 Update Google OAuth Redirect URIs
1. Go back to Google Cloud Console
2. **APIs & Services > Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add to **Authorized JavaScript origins:**
   - `https://vora-xxxxx.vercel.app`
5. Add to **Authorized redirect URIs:**
   - `https://vora-backend.onrender.com/auth/google/callback`
6. Click "Save"

---

## Step 7: Test Your Deployment

### 7.1 Test Frontend
1. Visit your Vercel URL: `https://vora-xxxxx.vercel.app`
2. You should see the landing page

### 7.2 Test Authentication
1. Try signing up with email/password
2. Try Google OAuth login
3. Check if you can create rooms, send messages, etc.

### 7.3 Common Issues

**Backend not connecting:**
- Check Render logs: Render Dashboard > Your Service > Logs
- Verify MONGO_URI is correct
- Check CORS settings (CLIENT_URL)

**Frontend shows errors:**
- Check browser console (F12)
- Verify VITE_API_URL is set correctly
- Check Vercel build logs

**Google OAuth not working:**
- Verify redirect URIs match exactly
- Check Render logs for OAuth errors
- Make sure GOOGLE_CALLBACK_URL matches Render URL

**Socket.io not connecting:**
- Check if WebSocket is enabled on Render (free tier has limitations)
- Verify CLIENT_URL in Render matches Vercel URL

---

## 🎉 You're Done!

Your app is now live at:
- **Frontend:** `https://vora-xxxxx.vercel.app`
- **Backend:** `https://vora-backend.onrender.com`

---

## 📝 Additional Notes

### Render Free Tier Limitations
- Services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds (cold start)
- 750 hours/month free (enough for always-on if you use one service)

### Vercel Free Tier
- Unlimited deployments
- Global CDN
- Perfect for frontend hosting

### MongoDB Atlas Free Tier
- 512MB storage
- Shared cluster
- Perfect for development/small projects

### Custom Domains (Optional)
- **Vercel:** Add custom domain in project settings
- **Render:** Upgrade to paid plan for custom domains

---

## 🔄 Updating Your App

To deploy updates:
1. Make changes locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```
3. Render and Vercel will auto-deploy!

---

## 🆘 Need Help?

Check logs:
- **Render:** Dashboard > Your Service > Logs
- **Vercel:** Dashboard > Your Project > Deployments > View Logs
- **MongoDB:** Atlas > Your Cluster > Metrics

Common issues are usually:
- Wrong environment variables
- CORS issues (CLIENT_URL mismatch)
- MongoDB connection string errors
- Google OAuth redirect URI mismatches
