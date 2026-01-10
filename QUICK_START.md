# 🚀 Quick Deployment Steps

## 1️⃣ Push to GitHub

```bash
cd C:\Users\motio\Music\Vora
git add .
git commit -m "Production-ready Vora app"
git branch -M main
git remote add origin https://github.com/DehanNimnaSandadiya/Vora.git
git push -u origin main
```

## 2️⃣ MongoDB Atlas Setup (5 minutes)

1. Sign up: https://www.mongodb.com/cloud/atlas
2. Create FREE cluster
3. Create database user (save password!)
4. Network Access: Allow `0.0.0.0/0`
5. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/vora?retryWrites=true&w=majority`

## 3️⃣ Google OAuth Setup (5 minutes)

1. Go to: https://console.cloud.google.com
2. Create project "Vora"
3. OAuth consent screen: External, add your email
4. Create OAuth 2.0 Client ID (Web app)
5. Add redirect URI: `https://your-backend.onrender.com/auth/google/callback` (update after Render)
6. Copy Client ID and Secret

## 4️⃣ Deploy Backend to Render (10 minutes)

1. Sign up: https://render.com (with GitHub)
2. New > Web Service
3. Connect repo: `DehanNimnaSandadiya/Vora`
4. Settings:
   - **Name:** `vora-backend`
   - **Root Directory:** `server` ⚠️
   - **Build:** `npm install`
   - **Start:** `npm start`
   - **Plan:** Free

5. Environment Variables:
```
NODE_ENV=production
PORT=5000
MONGO_URI=<from step 2>
CLIENT_URL=https://your-app.vercel.app (update after Vercel)
JWT_SECRET=<generate random 32+ chars>
SESSION_SECRET=<generate random 32+ chars>
GOOGLE_CLIENT_ID=<from step 3>
GOOGLE_CLIENT_SECRET=<from step 3>
GOOGLE_CALLBACK_URL=https://vora-backend.onrender.com/auth/google/callback
```

6. Deploy! Backend URL: `https://vora-backend.onrender.com`

## 5️⃣ Deploy Frontend to Vercel (5 minutes)

1. Sign up: https://vercel.com (with GitHub)
2. Add New > Project
3. Import: `DehanNimnaSandadiya/Vora`
4. Settings:
   - **Framework:** Vite
   - **Root Directory:** `client` ⚠️
   - **Build:** `cd .. && pnpm install && cd client && pnpm build`
   - **Output:** `dist` (relative to root)
   - **Install:** `cd .. && pnpm install`

5. Environment Variable:
```
VITE_API_URL=https://vora-backend.onrender.com
```

6. Deploy! Frontend URL: `https://vora-xxxxx.vercel.app`

## 6️⃣ Final Updates

1. **Update Render:** Set `CLIENT_URL` to your Vercel URL
2. **Update Google OAuth:** Add Vercel URL to authorized origins
3. **Test:** Visit your Vercel URL and try logging in!

---

## 🔧 Generate Secrets (PowerShell)

```powershell
# Generate JWT_SECRET
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Generate SESSION_SECRET (run again)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

---

## ✅ Verification Checklist

- [ ] Backend health check works: `https://your-backend.onrender.com/health`
- [ ] Frontend loads without errors
- [ ] Email/password registration works
- [ ] Google OAuth login works
- [ ] Can create rooms
- [ ] Real-time chat works
- [ ] Socket.io connections work

---

## 🐛 Common Issues

**Backend won't start:**
- Check Render logs
- Verify all environment variables are set
- Check MongoDB connection string

**CORS errors:**
- Verify `CLIENT_URL` in Render matches Vercel URL exactly
- No trailing slash!

**Google OAuth fails:**
- Redirect URI must match exactly in Google Console
- Check `GOOGLE_CALLBACK_URL` in Render

**Socket.io not working:**
- Render free tier has WebSocket limitations
- Check browser console for connection errors
