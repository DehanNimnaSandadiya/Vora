# 🚀 Complete Deployment Guide - Vora App

This guide will walk you through deploying Vora to **Render (Backend)** and **Vercel (Frontend)** step by step.

---

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ GitHub account with your code pushed to https://github.com/DehanNimnaSandadiya/Vora
- ✅ Email address (for signing up to services)
- ⏱️ About 1 hour of time

---

## Part 1: MongoDB Atlas Setup (Database) - 15 minutes

### Step 1.1: Create MongoDB Atlas Account

1. Go to: **https://www.mongodb.com/cloud/atlas/register**
2. Click **"Try Free"** or **"Sign Up"**
3. Choose one:
   - **Sign up with Google** (easiest)
   - **Sign up with Email** (enter email, password, create account)
4. Verify your email if required
5. Complete any additional account setup steps

### Step 1.2: Create a Free Cluster

1. After logging in, you'll see the **Atlas Dashboard**
2. Click the **"Build a Database"** button (green button)
3. Choose **"M0 FREE"** tier (Free Forever option)
4. Select **Cloud Provider**:
   - **AWS** (Amazon Web Services) - Recommended
   - **Google Cloud** or **Azure** also work
5. Select **Region**:
   - Choose a region closest to you (e.g., `N. Virginia (us-east-1)`, `Frankfurt (eu-central-1)`)
   - For free tier, select any available region
6. Click **"Create"** button at the bottom
7. **Wait 3-5 minutes** for cluster creation (you'll see progress)

### Step 1.3: Create Database User

1. On the **"Security Quickstart"** screen (appears after cluster creation):
   - Choose **"Username and Password"** authentication method
   - Username: Enter `vora-admin` (or any username you prefer)
   - Password: Click **"Autogenerate Secure Password"** button
   - **⚠️ IMPORTANT:** Click **"Copy"** button to save the password, then click **"Save Password"** in the popup
   - You can also write it down manually (you'll need it later!)
2. Under **"Where would you like to connect from?"**:
   - Click **"My Local Environment"** (for now)
   - We'll add network access in the next step
3. Click **"Finish and Close"**

**Alternative if Quickstart didn't appear:**
1. Go to **"Database Access"** in the left sidebar
2. Click **"Add New Database User"** button
3. Authentication Method: **Password**
4. Username: `vora-admin`
5. Password: Click **"Autogenerate Secure Password"** → Copy and save it
6. User Privileges: **Atlas admin** (should be default)
7. Click **"Add User"**

### Step 1.4: Configure Network Access

1. In the left sidebar, click **"Network Access"**
2. Click **"Add IP Address"** button
3. You'll see options:
   - Click **"Allow Access from Anywhere"** button (this adds `0.0.0.0/0`)
   - **OR** manually enter: `0.0.0.0/0` and click **"Confirm"**
4. You'll see a warning about security - click **"Confirm"** (this is fine for production apps)
5. Wait 1-2 minutes for the change to take effect

**Why `0.0.0.0/0`?** This allows your Render backend to connect from anywhere. For production, you could restrict to Render's IP ranges, but `0.0.0.0/0` works fine for now.

### Step 1.5: Get Connection String

1. Go back to **"Database"** in the left sidebar (or click **"Overview"**)
2. You'll see your cluster (named something like "Cluster0")
3. Click the **"Connect"** button (next to your cluster)
4. Choose **"Connect your application"**
5. Driver: Select **"Node.js"**
6. Version: Select **"5.5 or later"** (latest version)
7. You'll see a connection string like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
8. **Copy this connection string** (click the copy icon)
9. **Edit it manually:**
   - Replace `<username>` with your database username (e.g., `vora-admin`)
   - Replace `<password>` with the password you saved earlier
   - **Important:** Change the `?` after `.net/` to `/vora?` to specify the database name
   - Final string should look like:
     ```
     mongodb+srv://vora-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/vora?retryWrites=true&w=majority
     ```
10. **Save this connection string** - you'll need it for Render!

**Example of final connection string:**
```
mongodb+srv://vora-admin:abc123XYZ@cluster0.mongodb.net/vora?retryWrites=true&w=majority
```

---

## Part 2: Google OAuth Setup - 15 minutes

### Step 2.1: Create Google Cloud Project

1. Go to: **https://console.cloud.google.com/**
2. Sign in with your Google account
3. If this is your first time:
   - Accept terms of service
   - Select your country
   - Click **"Agree and Continue"**
4. At the top, you'll see a **project dropdown** (might say "Select a project" or show a project name)
5. Click the project dropdown → Click **"NEW PROJECT"**
6. Project name: Enter `Vora` (or any name)
7. Organization: Leave as default (or select if you have one)
8. Location: Leave as default
9. Click **"CREATE"** button
10. Wait 10-30 seconds for project creation
11. **Select your new project** from the project dropdown at the top

### Step 2.2: Configure OAuth Consent Screen

1. In the left sidebar, hover over **"APIs & Services"**
2. Click **"OAuth consent screen"**
3. User Type: Select **"External"** (for personal/free projects)
   - Click **"CREATE"** button
4. **App Information:**
   - App name: `Vora`
   - User support email: Select your email from dropdown
   - App logo: Leave blank (optional)
   - App domain: Leave blank
   - Application home page: Leave blank (or add your future Vercel URL)
   - Application privacy policy link: Leave blank (optional)
   - Application terms of service link: Leave blank (optional)
   - Authorized domains: Leave blank
   - Developer contact information: Enter your email
   - Click **"SAVE AND CONTINUE"**
5. **Scopes:**
   - You'll see default scopes (email, profile, openid)
   - Click **"SAVE AND CONTINUE"** (no changes needed)
6. **Test users:**
   - Click **"ADD USERS"** button
   - Enter your email address
   - Click **"ADD"**
   - Click **"SAVE AND CONTINUE"**
7. **Summary:**
   - Review the information
   - Click **"BACK TO DASHBOARD"**

### Step 2.3: Create OAuth Credentials

1. In the left sidebar, under **"APIs & Services"**, click **"Credentials"**
2. At the top, click **"+ CREATE CREDENTIALS"** button
3. Select **"OAuth client ID"**
4. If prompted, select **"Web application"** as application type
5. **Name:** Enter `Vora Web Client`
6. **Authorized JavaScript origins:**
   - Click **"+ ADD URI"** button
   - Enter: `http://localhost:5173` (for local development)
   - Click **"+ ADD URI"** again
   - Enter: `https://your-app.vercel.app` (we'll update this after Vercel deployment - use placeholder for now)
   - You can add more later
7. **Authorized redirect URIs:**
   - Click **"+ ADD URI"** button
   - Enter: `http://localhost:5000/auth/google/callback` (for local development)
   - Click **"+ ADD URI"** again
   - Enter: `https://vora-backend.onrender.com/auth/google/callback` (we'll update with actual Render URL later)
8. Click **"CREATE"** button
9. **⚠️ IMPORTANT:** A popup will appear with your credentials:
   - **Client ID:** Copy this (looks like: `123456789-abc.apps.googleusercontent.com`)
   - **Client Secret:** Copy this (looks like: `GOCSPX-xxxxxxxxxxxx`)
   - **Save both** - you'll need them for Render!
   - Click **"OK"** (you can view these later in Credentials page, but secret is only shown once)

**Note:** If you missed copying the secret, you can create a new OAuth client ID or reset the secret.

---

## Part 3: Deploy Backend to Render - 20 minutes

### Step 3.1: Create Render Account

1. Go to: **https://render.com**
2. Click **"Get Started for Free"** button (top right)
3. Choose **"Continue with GitHub"** (recommended - easier to connect your repo)
4. Authorize Render to access your GitHub account:
   - You'll be redirected to GitHub
   - Click **"Authorize render"** button
   - You may need to enter your GitHub password
5. You'll be redirected back to Render dashboard

### Step 3.2: Create New Web Service

1. In Render dashboard, click the **"New +"** button (top right)
2. Select **"Web Service"** from the dropdown
3. **Connect Repository:**
   - You'll see a list of your GitHub repositories
   - Find and click on **"DehanNimnaSandadiya/Vora"**
   - If you don't see it, click **"Configure account"** to grant more permissions
   - Click **"Connect"** button next to the repository

### Step 3.3: Configure Web Service Settings

Fill in these settings **carefully**:

1. **Name:**
   - Enter: `vora-backend` (or any name you prefer)
   - This will be part of your URL: `https://vora-backend.onrender.com`

2. **Region:**
   - Select a region closest to you (e.g., `Oregon (US West)`, `Frankfurt (EU Central)`)

3. **Branch:**
   - Select: `main` (should be default)

4. **Root Directory:**
   - ⚠️ **VERY IMPORTANT:** Click **"Advanced"** to reveal this option
   - Enter: `server` (exactly as shown, without quotes)
   - This tells Render where your backend code is located

5. **Runtime:**
   - Select: `Node` (should be auto-detected)

6. **Build Command:**
   - Enter: `npm install`
   - This installs all dependencies

7. **Start Command:**
   - Enter: `npm start`
   - This runs your server

8. **Instance Type:**
   - Select: **"Free"** (or "Starter" if you want always-on service)
   - Free tier: Spins down after 15 min inactivity, 750 hours/month free

9. Click **"Advanced"** to see more options (already open if you set Root Directory)

### Step 3.4: Set Environment Variables

Before clicking "Create Web Service", scroll down to **"Environment Variables"** section:

Click **"Add Environment Variable"** for each of these:

1. **NODE_ENV**
   - Key: `NODE_ENV`
   - Value: `production`
   - Click **"Save"**

2. **PORT**
   - Key: `PORT`
   - Value: `5000`
   - Click **"Save"**

3. **MONGO_URI**
   - Key: `MONGO_URI`
   - Value: Paste your MongoDB connection string from Part 1, Step 1.5
   - Example: `mongodb+srv://vora-admin:password@cluster0.xxxxx.mongodb.net/vora?retryWrites=true&w=majority`
   - Click **"Save"**

4. **CLIENT_URL**
   - Key: `CLIENT_URL`
   - Value: `https://your-app.vercel.app` (placeholder - we'll update after Vercel deployment)
   - Click **"Save"**

5. **JWT_SECRET**
   - Key: `JWT_SECRET`
   - Value: Generate a random 40-character string (see below for how)
   - Click **"Save"**

6. **SESSION_SECRET**
   - Key: `SESSION_SECRET`
   - Value: Generate a different random 40-character string
   - Click **"Save"**

7. **GOOGLE_CLIENT_ID**
   - Key: `GOOGLE_CLIENT_ID`
   - Value: Paste the Client ID from Part 2, Step 2.3
   - Click **"Save"**

8. **GOOGLE_CLIENT_SECRET**
   - Key: `GOOGLE_CLIENT_SECRET`
   - Value: Paste the Client Secret from Part 2, Step 2.3
   - Click **"Save"**

9. **GOOGLE_CALLBACK_URL**
   - Key: `GOOGLE_CALLBACK_URL`
   - Value: `https://vora-backend.onrender.com/auth/google/callback`
   - Replace `vora-backend` with your actual service name if different
   - Click **"Save"**

**How to Generate Random Secrets (Windows PowerShell):**

Open PowerShell and run this command twice (once for JWT_SECRET, once for SESSION_SECRET):

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object {[char]$_})
```

Copy the output each time and use it as the value.

**Or use online generator:**
- Go to: https://www.random.org/strings/
- Generate 40-character random alphanumeric strings

### Step 3.5: Deploy Backend

1. **Review all settings** one more time:
   - ✅ Root Directory = `server`
   - ✅ Build Command = `npm install`
   - ✅ Start Command = `npm start`
   - ✅ All 9 environment variables added

2. Scroll to the bottom and click **"Create Web Service"** button

3. **Build Process:**
   - Render will start building your service
   - You'll see build logs in real-time
   - First build takes 5-10 minutes
   - Watch for any errors (they'll be highlighted in red)

4. **Build Success:**
   - When build completes successfully, you'll see: "Your service is live!"
   - Your backend URL will be: `https://vora-backend.onrender.com` (or your service name)
   - **Copy this URL** - you'll need it for Vercel and Google OAuth!

### Step 3.6: Test Backend

1. Open a new browser tab
2. Visit: `https://your-backend-name.onrender.com/health`
   - Replace `your-backend-name` with your actual service name
3. You should see a JSON response like:
   ```json
   {
     "status": "ok",
     "timestamp": "...",
     "uptime": ...
   }
   ```
4. ✅ If you see this, your backend is working!

**If you see errors:**
- Check the **"Logs"** tab in Render dashboard
- Look for red error messages
- Common issues:
  - Missing environment variables
  - Wrong MongoDB connection string
  - Build command errors

---

## Part 4: Deploy Frontend to Vercel - 15 minutes

### Step 4.1: Create Vercel Account

1. Go to: **https://vercel.com**
2. Click **"Sign Up"** button (top right)
3. Choose **"Continue with GitHub"** (recommended)
4. Authorize Vercel to access your GitHub account
5. You'll be redirected to Vercel dashboard

### Step 4.2: Import Project

1. In Vercel dashboard, click **"Add New..."** button (top right)
2. Select **"Project"** from the dropdown
3. You'll see a list of your GitHub repositories
4. Find and click **"Import"** next to **"DehanNimnaSandadiya/Vora"**
5. If you don't see it, click **"Adjust GitHub App Permissions"** and grant access

### Step 4.3: Configure Project Settings

1. **Project Name:**
   - Auto-filled as `Vora` (you can change it)
   - This will be part of your URL: `https://vora-xxxxx.vercel.app`

2. **Framework Preset:**
   - Should auto-detect as **"Vite"**
   - If not, select **"Vite"** from dropdown

3. **Root Directory:**
   - ⚠️ **VERY IMPORTANT:** Click **"Edit"** button
   - Change from `./` to `client`
   - This tells Vercel where your frontend code is located

4. **Build and Output Settings:**
   - **Build Command:** Should auto-fill, but verify it's: `cd .. && pnpm install && cd client && pnpm build`
   - **Output Directory:** Should be `dist` (relative to root directory)
   - **Install Command:** Should be: `cd .. && pnpm install`

5. **Environment Variables:**
   - Click to expand this section
   - Click **"Add"** button
   - **Key:** Enter `VITE_API_URL`
   - **Value:** Enter your Render backend URL (from Part 3, Step 3.5)
     - Example: `https://vora-backend.onrender.com`
     - ⚠️ **IMPORTANT:** Do NOT add `/api` at the end - the code handles this!
   - **Environments:** Select all three (Production, Preview, Development)
   - Click **"Save"**

### Step 4.4: Deploy Frontend

1. **Review settings:**
   - ✅ Root Directory = `client`
   - ✅ Framework = Vite
   - ✅ Build Command is correct
   - ✅ Output Directory = `dist`
   - ✅ `VITE_API_URL` environment variable is set

2. Click **"Deploy"** button

3. **Build Process:**
   - Vercel will start building your frontend
   - Build takes 2-5 minutes
   - You'll see build progress and logs
   - Watch for any errors

4. **Deployment Success:**
   - When complete, you'll see: "Congratulations! Your project has been deployed."
   - Your frontend URL will be: `https://vora-xxxxx.vercel.app` (or your project name)
   - **Copy this URL** - you'll need it for the next steps!

### Step 4.5: Test Frontend

1. Click on your deployment URL (or copy and paste in browser)
2. You should see the Vora landing page
3. ✅ If the page loads, your frontend is deployed!

**If you see a blank page or errors:**
- Check browser console (F12 → Console tab)
- Check Vercel deployment logs
- Verify `VITE_API_URL` is set correctly

---

## Part 5: Update Configurations - 10 minutes

Now we need to update configurations to connect everything together.

### Step 5.1: Update Render CLIENT_URL

1. Go back to **Render dashboard**
2. Click on your **vora-backend** service
3. Go to **"Environment"** tab (left sidebar)
4. Find the **CLIENT_URL** variable
5. Click the **pencil/edit icon** next to it
6. Update the value to your actual Vercel URL:
   - Example: `https://vora-xxxxx.vercel.app`
   - ⚠️ **No trailing slash!** (no `/` at the end)
7. Click **"Save Changes"**
8. Render will **automatically redeploy** (takes 2-3 minutes)
9. Wait for redeployment to complete (check the "Events" tab)

### Step 5.2: Update Google OAuth Redirect URIs

1. Go back to **Google Cloud Console**: https://console.cloud.google.com/
2. Make sure your **Vora** project is selected (top dropdown)
3. Go to **"APIs & Services"** → **"Credentials"** (left sidebar)
4. Find your **OAuth 2.0 Client ID** (named "Vora Web Client")
5. Click the **pencil/edit icon** to edit it

6. **Authorized JavaScript origins:**
   - You should already have `http://localhost:5173`
   - Click **"+ ADD URI"**
   - Enter your Vercel frontend URL: `https://vora-xxxxx.vercel.app`
   - No trailing slash!

7. **Authorized redirect URIs:**
   - You should already have `http://localhost:5000/auth/google/callback`
   - Verify you have: `https://vora-backend.onrender.com/auth/google/callback`
   - If not, click **"+ ADD URI"** and add it
   - Replace `vora-backend` with your actual Render service name if different

8. Click **"SAVE"** button at the bottom

### Step 5.3: Update Render GOOGLE_CALLBACK_URL (if needed)

1. Go back to **Render dashboard**
2. Your **vora-backend** service → **"Environment"** tab
3. Find **GOOGLE_CALLBACK_URL**
4. Verify it matches your actual Render backend URL:
   - Should be: `https://your-actual-backend-name.onrender.com/auth/google/callback`
5. If it's incorrect, edit and save (will trigger redeploy)

---

## Part 6: Test Your Live Application - 10 minutes

Now let's test everything to make sure it works!

### Step 6.1: Test Frontend Access

1. Visit your Vercel URL: `https://vora-xxxxx.vercel.app`
2. ✅ Should see the Vora landing page
3. If blank or errors, check browser console (F12)

### Step 6.2: Test Backend Health

1. Visit: `https://your-backend.onrender.com/health`
2. ✅ Should see JSON response with status "ok"

### Step 6.3: Test Email Registration

1. On your Vercel site, click **"Sign Up"** or **"Register"**
2. Fill in:
   - Name: Your name
   - Email: Your email
   - Password: A password
   - University: (optional)
3. Click **"Register"** or **"Sign Up"**
4. ✅ Should successfully register and log you in
5. ✅ Should redirect to dashboard or rooms page

**If registration fails:**
- Check Render logs for errors
- Verify MongoDB connection string is correct
- Check browser console for API errors

### Step 6.4: Test Google OAuth Login

1. Log out if you're logged in
2. Click **"Continue with Google"** or **"Sign in with Google"** button
3. You'll be redirected to Google sign-in
4. Select your Google account
5. Authorize the app
6. ✅ Should redirect back to your Vercel site and log you in

**If Google OAuth fails:**
- Check Render logs for OAuth errors
- Verify redirect URI matches exactly in Google Console
- Make sure you added your email as a test user in OAuth consent screen
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct in Render

### Step 6.5: Test Core Features

1. **Create a Room:**
   - Click **"Create Room"** or similar button
   - Fill in room details
   - Click create
   - ✅ Should create room successfully

2. **Join a Room:**
   - Browse available rooms
   - Click to join a room
   - ✅ Should join successfully

3. **Send a Message:**
   - In a room, type a message in chat
   - Press send
   - ✅ Should send and appear in chat

4. **Create a Task:**
   - In a room, create a task
   - ✅ Should create successfully

5. **Pomodoro Timer:**
   - Start the timer
   - ✅ Should start and count down

---

## Troubleshooting Common Issues

### Backend Issues

**Service won't start:**
- Check Render **"Logs"** tab
- Look for red error messages
- Common causes:
  - Missing environment variables
  - Wrong MongoDB connection string format
  - Port already in use (shouldn't happen on Render)

**MongoDB connection fails:**
- Verify connection string has `/vora?` (database name)
- Check password doesn't have special characters that need URL encoding
- Verify network access allows `0.0.0.0/0`
- Test connection string in MongoDB Compass (desktop app)

**CORS errors:**
- Check `CLIENT_URL` in Render matches Vercel URL **exactly**
- No trailing slash: `https://app.vercel.app` not `https://app.vercel.app/`
- Check browser console for exact CORS error message
- Verify backend CORS settings in `server.js`

### Frontend Issues

**Blank page:**
- Open browser console (F12)
- Look for JavaScript errors
- Check Network tab for failed API calls
- Verify `VITE_API_URL` is set correctly in Vercel

**API calls fail (404/500):**
- Check `VITE_API_URL` doesn't have `/api` suffix
- Verify backend is running (check Render dashboard)
- Check Network tab in browser console for request/response
- Verify backend routes are correct

**Build fails:**
- Check Vercel build logs
- Verify Root Directory is `client`
- Check for TypeScript errors
- Verify all dependencies in `package.json`

### Google OAuth Issues

**Redirect URI mismatch:**
- Error: "redirect_uri_mismatch"
- Go to Google Console → Credentials
- Verify redirect URI matches **exactly** (including `https://`, no trailing `/`)
- Update if needed and wait 5 minutes for changes to propagate

**"Access blocked: This app's request is invalid":**
- Your email might not be added as a test user
- Go to OAuth consent screen → Test users → Add your email
- Or publish the app (requires verification for production)

**OAuth works but user not created:**
- Check Render logs for errors during user creation
- Verify MongoDB connection is working
- Check User model in backend code

### Socket.io / Real-time Issues

**Socket connections fail:**
- Render free tier has WebSocket limitations
- Check browser console for connection errors
- Verify `CLIENT_URL` is correct in Render
- First connection after spin-down may take 30-60 seconds (cold start)

**Messages not appearing in real-time:**
- Check socket.io connection status in browser console
- Verify backend socket handlers are working (check Render logs)
- Check if other users are connected

### General Issues

**Slow first request:**
- Render free tier spins down after 15 min inactivity
- First request after spin-down takes 30-60 seconds (cold start)
- This is normal for free tier
- Consider upgrading to "Starter" plan for always-on service

**Changes not appearing:**
- Vercel auto-deploys on git push
- Render auto-deploys on git push (if enabled) or manual redeploy
- Wait 2-5 minutes for deployment to complete
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)

---

## Next Steps After Deployment

1. **Custom Domain (Optional):**
   - Vercel: Project Settings → Domains → Add your domain
   - Render: Upgrade to paid plan for custom domain on backend
   - Update `CLIENT_URL` and Google OAuth URIs with custom domain

2. **Monitor Your App:**
   - Vercel: Check deployment logs and analytics
   - Render: Monitor logs and metrics
   - Set up error tracking (Sentry, etc.)

3. **Database Backups:**
   - MongoDB Atlas: Configure automated backups (paid feature)
   - Or export database manually periodically

4. **Performance Optimization:**
   - Enable Vercel Analytics
   - Optimize images and assets
   - Consider CDN for static files

5. **Security:**
   - Review and rotate secrets periodically
   - Enable 2FA on all accounts (GitHub, Render, Vercel, MongoDB, Google)
   - Monitor for security vulnerabilities

---

## Quick Reference: Your URLs

After deployment, you'll have:

- **Frontend (Vercel):** `https://vora-xxxxx.vercel.app`
- **Backend (Render):** `https://vora-backend.onrender.com`
- **Health Check:** `https://vora-backend.onrender.com/health`
- **GitHub Repo:** `https://github.com/DehanNimnaSandadiya/Vora`

---

## Environment Variables Summary

**Render (Backend):**
```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/vora?retryWrites=true&w=majority
CLIENT_URL=https://your-app.vercel.app
JWT_SECRET=<40-char random string>
SESSION_SECRET=<40-char random string>
GOOGLE_CLIENT_ID=<from Google Console>
GOOGLE_CLIENT_SECRET=<from Google Console>
GOOGLE_CALLBACK_URL=https://your-backend.onrender.com/auth/google/callback
```

**Vercel (Frontend):**
```
VITE_API_URL=https://your-backend.onrender.com
```

---

## Support & Resources

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com
- **Google OAuth Docs:** https://developers.google.com/identity/protocols/oauth2
- **Socket.io Docs:** https://socket.io/docs

---

**🎉 Congratulations! Your Vora app is now live in production!**

If you encounter any issues not covered here, check the logs in Render/Vercel dashboards or refer to the official documentation links above.
