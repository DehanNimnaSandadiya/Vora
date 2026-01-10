# 🎯 START HERE - Complete Deployment Instructions

Welcome! This guide will help you deploy Vora to production **for FREE** on Render (backend) and Vercel (frontend).

---

## ✅ Pre-Deployment Checklist

Your code is **production-ready**:
- ✅ All TypeScript errors fixed
- ✅ All unused code removed
- ✅ Build configurations updated
- ✅ Environment variable templates created
- ✅ Deployment guides prepared

---

## 🚀 Step-by-Step Deployment (Follow in Order)

### **STEP 1: Push Code to GitHub** ⏱️ 5 minutes

Open PowerShell/CMD in your project directory and run:

```bash
cd C:\Users\motio\Music\Vora

# Check if already committed (should show "nothing to commit")
git status

# If files are already committed (from previous step), skip commit
# If not, commit first:
git add .
git commit -m "Production-ready Vora app"

# Add remote (if not already added)
git remote add origin https://github.com/DehanNimnaSandadiya/Vora.git

# If remote exists but URL is wrong:
# git remote set-url origin https://github.com/DehanNimnaSandadiya/Vora.git

# Switch to main branch and push
git branch -M main
git push -u origin main
```

**If push fails with authentication:**
- Option 1: Use GitHub Desktop app
- Option 2: Generate Personal Access Token (Settings > Developer settings > Personal access tokens > Tokens classic)
- Option 3: Use SSH keys (recommended for future)

**Verify:** Go to https://github.com/DehanNimnaSandadiya/Vora - you should see all files!

---

### **STEP 2: Set Up MongoDB Atlas** ⏱️ 10 minutes

**2.1 Create Account**
1. Visit: https://www.mongodb.com/cloud/atlas/register
2. Sign up with email/Google
3. Create a free account

**2.2 Create Cluster**
1. Click "Build a Database"
2. Select **M0 FREE** tier
3. Choose provider: **AWS** (or any)
4. Choose region closest to you
5. Click "Create"

**2.3 Create Database User**
1. Left sidebar: **Database Access**
2. Click "Add New Database User"
3. Authentication: **Password**
4. Username: `vora-admin` (or any)
5. Password: Click "Autogenerate Secure Password" ⚠️ **SAVE THIS PASSWORD!**
6. User Privileges: **Atlas admin**
7. Click "Add User"

**2.4 Configure Network Access**
1. Left sidebar: **Network Access**
2. Click "Add IP Address"
3. Click **"Allow Access from Anywhere"** button
   - This adds `0.0.0.0/0`
4. Click "Confirm"

**2.5 Get Connection String**
1. Left sidebar: **Database**
2. Click "Connect" on your cluster
3. Select: **"Connect your application"**
4. Driver: **Node.js**, Version: **5.5 or later**
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` with your database username (e.g., `vora-admin`)
7. Replace `<password>` with your saved password
8. Add database name: Replace `?` with `/vora?`
9. **FINAL STRING:**
   ```
   mongodb+srv://vora-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/vora?retryWrites=true&w=majority
   ```
10. **SAVE THIS** - You'll paste it in Render!

---

### **STEP 3: Set Up Google OAuth** ⏱️ 10 minutes

**3.1 Create Google Cloud Project**
1. Visit: https://console.cloud.google.com/
2. Click project dropdown (top) > "New Project"
3. Project name: `Vora`
4. Click "Create"
5. Wait for creation, then select the project

**3.2 Configure OAuth Consent Screen**
1. Left menu: **APIs & Services** > **OAuth consent screen**
2. User Type: **External** (for free tier)
3. Click "Create"
4. Fill in:
   - App name: `Vora`
   - User support email: Your email
   - Developer contact: Your email
5. Click "Save and Continue"
6. Scopes: Click "Save and Continue" (default is fine)
7. Test users: Click "Add Users" > Add your email
8. Click "Save and Continue" > "Back to Dashboard"

**3.3 Create OAuth Credentials**
1. Left menu: **APIs & Services** > **Credentials**
2. Click "Create Credentials" > **"OAuth client ID"**
3. Application type: **Web application**
4. Name: `Vora Web Client`
5. **Authorized JavaScript origins:** Click "Add URI"
   - Add: `http://localhost:5173` (for local dev)
   - You'll add Vercel URL later
6. **Authorized redirect URIs:** Click "Add URI"
   - Add: `http://localhost:5000/auth/google/callback` (for local dev)
   - Add: `https://vora-backend.onrender.com/auth/google/callback` (use your actual Render URL later)
7. Click "Create"
8. **IMPORTANT:** Copy the **Client ID** and **Client Secret** - Save these!
   - They look like:
     - Client ID: `123456789-abc.apps.googleusercontent.com`
     - Client Secret: `GOCSPX-xxxxxxxxxxxx`

---

### **STEP 4: Deploy Backend to Render** ⏱️ 15 minutes

**4.1 Sign Up for Render**
1. Visit: https://render.com
2. Click "Get Started for Free"
3. Sign up with **GitHub** (recommended - connects your repo automatically)
4. Authorize Render to access repositories

**4.2 Create Web Service**
1. Click "New +" button (top right)
2. Select **"Web Service"**
3. Find and click **"Connect"** on `DehanNimnaSandadiya/Vora`
4. Click "Connect" to authorize

**4.3 Configure Service**
Fill in these settings carefully:

- **Name:** `vora-backend` (or any name you want)
- **Region:** Choose closest (e.g., Oregon, Frankfurt)
- **Branch:** `main`
- **Root Directory:** `server` ⚠️ **CRITICAL - Must be exactly "server"**
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Instance Type:** **Free** (or Starter if you want always-on)

**4.4 Set Environment Variables**
Scroll down to "Environment Variables" section. Click "Add Environment Variable" for each:

```
NODE_ENV = production
```

```
PORT = 5000
```

```
MONGO_URI = mongodb+srv://vora-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/vora?retryWrites=true&w=majority
```
(Paste your MongoDB connection string from Step 2.5)

```
CLIENT_URL = https://your-app.vercel.app
```
(Leave placeholder for now - update after Vercel deployment)

**Generate Secrets** (run in PowerShell):
```powershell
# Run this command, copy the output for JWT_SECRET:
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object {[char]$_})

# Run again for SESSION_SECRET (different value):
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object {[char]$_})
```

```
JWT_SECRET = [paste output from first command above]
```

```
SESSION_SECRET = [paste output from second command above]
```

```
GOOGLE_CLIENT_ID = [paste from Step 3.3]
```

```
GOOGLE_CLIENT_SECRET = [paste from Step 3.3]
```

```
GOOGLE_CALLBACK_URL = https://vora-backend.onrender.com/auth/google/callback
```
(Replace `vora-backend` with your actual service name if different)

**4.5 Deploy**
1. Review all settings (especially Root Directory!)
2. Click **"Create Web Service"**
3. Wait 5-10 minutes for first deployment
4. Watch the logs - you'll see build progress
5. When done, you'll see: "Your service is live at https://vora-backend.onrender.com"
6. **Copy this URL** - You'll need it for Vercel!

**4.6 Test Backend**
1. Visit: `https://your-backend-name.onrender.com/health`
2. Should see: `{"status":"ok","timestamp":"...","uptime":...}`
3. If you see this, backend is working! ✅

---

### **STEP 5: Deploy Frontend to Vercel** ⏱️ 10 minutes

**5.1 Sign Up for Vercel**
1. Visit: https://vercel.com
2. Click "Sign Up"
3. Sign up with **GitHub** (recommended)
4. Authorize Vercel to access repositories

**5.2 Import Project**
1. Click "Add New..." button
2. Select **"Project"**
3. Find `DehanNimnaSandadiya/Vora`
4. Click **"Import"**

**5.3 Configure Project**
Important settings:

- **Framework Preset:** `Vite` (should auto-detect)
- **Root Directory:** `client` ⚠️ **CRITICAL - Click "Edit" and set to "client"**
- **Build Command:** `cd .. && pnpm install && cd client && pnpm build`
- **Output Directory:** `dist` (relative to root)
- **Install Command:** `cd .. && pnpm install`
- **Node.js Version:** 18.x or 20.x

**5.4 Set Environment Variable**
1. Expand "Environment Variables" section
2. Add:
   ```
   Key: VITE_API_URL
   Value: https://vora-backend.onrender.com
   ```
   (Use your actual Render backend URL - **NO /api suffix!**)
3. Environments: Select "Production", "Preview", "Development"

**5.5 Deploy**
1. Review settings (especially Root Directory!)
2. Click **"Deploy"**
3. Wait 2-5 minutes
4. When done, you'll see: "Congratulations! Your project has been deployed."
5. Your URL: `https://vora-xxxxx.vercel.app`
6. **Copy this URL** - You need it for next steps!

---

### **STEP 6: Final Configuration Updates** ⏱️ 5 minutes

**6.1 Update Render Environment Variable**
1. Go back to Render dashboard
2. Your service > **Environment** tab
3. Find `CLIENT_URL`
4. Click "Edit" and update value to your Vercel URL:
   ```
   https://vora-xxxxx.vercel.app
   ```
5. Click "Save Changes"
6. Render will auto-redeploy (wait 2-3 minutes)

**6.2 Update Google OAuth Redirect URIs**
1. Go back to Google Cloud Console
2. **APIs & Services** > **Credentials**
3. Click on your OAuth 2.0 Client ID to edit
4. Under **Authorized JavaScript origins**, click "Add URI":
   - Add: `https://vora-xxxxx.vercel.app` (your Vercel URL)
5. Under **Authorized redirect URIs**, verify you have:
   - `https://vora-backend.onrender.com/auth/google/callback` (your Render URL)
6. Click "Save"

---

### **STEP 7: Test Everything!** ⏱️ 5 minutes

**Test Checklist:**

1. ✅ **Frontend loads:** Visit your Vercel URL - should see landing page
2. ✅ **Backend health:** Visit `https://your-backend.onrender.com/health` - should return JSON
3. ✅ **Email registration:** Try signing up with email/password
4. ✅ **Google OAuth:** Click "Continue with Google" - should redirect and sign in
5. ✅ **Create room:** After login, try creating a study room
6. ✅ **Join room:** Try joining an existing room
7. ✅ **Chat:** Send a message in a room
8. ✅ **Tasks:** Create a task in a room
9. ✅ **Timer:** Try starting the Pomodoro timer

**If something doesn't work:**
- Check browser console (F12) for errors
- Check Render logs (Dashboard > Service > Logs)
- Check Vercel logs (Dashboard > Project > Deployments > Latest > Logs)

---

## 🎉 Congratulations!

Your app is now live at:
- **Frontend:** `https://vora-xxxxx.vercel.app`
- **Backend:** `https://vora-backend.onrender.com`

---

## 📚 Additional Resources

- **Detailed Guide:** See `DEPLOYMENT_GUIDE.md`
- **Quick Reference:** See `QUICK_START.md`
- **Render Specific:** See `RENDER_SETUP.md`
- **Vercel Specific:** See `VERCEL_SETUP.md`
- **Git Push Help:** See `GIT_PUSH_GUIDE.md`

---

## 🆘 Troubleshooting

### Backend Issues

**Service won't start:**
- Check Render logs for errors
- Verify all environment variables are set (no typos!)
- Check MongoDB connection string format

**MongoDB connection fails:**
- Verify connection string has `/vora?` in it
- Check password is correct (URL-encoded if special chars)
- Verify network access allows `0.0.0.0/0`

**CORS errors:**
- Verify `CLIENT_URL` in Render matches Vercel URL **exactly**
- No trailing slash: `https://app.vercel.app` not `https://app.vercel.app/`
- Check browser console for exact CORS error

### Frontend Issues

**Blank page:**
- Check browser console (F12)
- Verify `VITE_API_URL` is set correctly
- Check Vercel build logs for errors

**API calls fail:**
- Verify `VITE_API_URL` doesn't have `/api` suffix
- Check Network tab in browser console
- Verify backend URL is accessible

**Google OAuth fails:**
- Check redirect URI matches exactly in Google Console
- Verify `GOOGLE_CALLBACK_URL` in Render is correct
- Check Render logs for OAuth errors

### Socket.io Issues

**Real-time features not working:**
- Render free tier has WebSocket limitations
- First connection after spin-down may be slow
- Check browser console for connection errors
- Verify `CLIENT_URL` is correct in Render

---

## 🔄 Updating Your App

To deploy updates:
1. Make changes locally
2. Commit and push:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```
3. Render and Vercel will **automatically deploy**!

---

## 💡 Pro Tips

1. **Always test locally first** before pushing to production
2. **Check logs immediately** if something breaks
3. **Save all environment variables** in a secure password manager
4. **Monitor Render/Vercel dashboards** for deployment status
5. **Use Render's "Manual Deploy"** if auto-deploy fails

---

## 📞 Need More Help?

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com
- **Google OAuth Docs:** https://developers.google.com/identity/protocols/oauth2

Good luck with your deployment! 🚀
