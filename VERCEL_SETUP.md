# 🎯 Vercel Deployment - Step by Step

## Quick Setup Guide for Vercel (Frontend)

### Step 1: Sign Up / Log In to Vercel
1. Go to https://vercel.com
2. Click "Sign Up"
3. Sign up with GitHub (recommended)

### Step 2: Import Project
1. After logging in, click "Add New..." button
2. Select "Project"
3. You'll see your GitHub repositories
4. Find and click "Import" on **DehanNimnaSandadiya/Vora**

### Step 3: Configure Project

**Framework Preset:**
- Select: **Vite** (or leave as "Other" and configure manually)

**Root Directory:**
- Click "Edit" next to Root Directory
- Set to: `client` ⚠️ **THIS IS CRITICAL!**
- Click "Continue"

**Build and Output Settings:**
- **Framework Preset:** Vite
- **Build Command:** `cd .. && pnpm install && cd client && pnpm build`
- **Output Directory:** `client/dist`
- **Install Command:** `cd .. && pnpm install`
- **Node.js Version:** 18.x or 20.x

### Step 4: Set Environment Variables

Click "Environment Variables" and add:

```
VITE_API_URL = https://vora-backend.onrender.com
```
(Replace with your actual Render backend URL)

⚠️ **Important:** Do NOT add `/api` suffix - the code handles this automatically!

### Step 5: Deploy

1. Review all settings
2. Click "Deploy"
3. Wait 2-5 minutes for build and deployment
4. Your frontend will be live at: `https://vora-xxxxx.vercel.app`

### Step 6: Get Your Frontend URL

After deployment:
1. Copy your deployment URL (e.g., `https://vora-xxxxx.vercel.app`)
2. Use this URL to update:
   - Render's `CLIENT_URL` environment variable
   - Google OAuth authorized origins

### Step 7: Update Render After Deployment

1. Go to Render dashboard
2. Your service > Environment
3. Update `CLIENT_URL` to your Vercel URL:
   ```
   CLIENT_URL=https://vora-xxxxx.vercel.app
   ```
4. Render will auto-redeploy

### Step 8: Update Google OAuth

1. Go to Google Cloud Console
2. APIs & Services > Credentials
3. Edit your OAuth 2.0 Client ID
4. Add to **Authorized JavaScript origins:**
   - `https://vora-xxxxx.vercel.app`
5. Click "Save"

### Troubleshooting

**Build fails:**
- Check deployment logs in Vercel dashboard
- Verify Root Directory is `client`
- Check if `pnpm install` completed successfully

**404 on routes:**
- This is normal! Vercel is configured with rewrites in `vercel.json`
- All routes should redirect to `index.html` (SPA behavior)

**API calls fail:**
- Check browser console (F12) for errors
- Verify `VITE_API_URL` is set correctly
- Make sure backend URL doesn't have `/api` suffix
- Check CORS in Render logs

**Blank page:**
- Check browser console for errors
- Verify build completed successfully
- Check if all environment variables are set

---

## Vercel Features

- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Automatic deployments on git push
- ✅ Preview deployments for PRs
- ✅ Free custom domains (optional)

---

## Custom Domain (Optional)

1. Go to Vercel project settings
2. Domains tab
3. Add your custom domain
4. Follow DNS configuration instructions
5. Update `CLIENT_URL` in Render with your custom domain
