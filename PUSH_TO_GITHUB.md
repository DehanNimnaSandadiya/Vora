# 📤 Push Code to GitHub - Exact Commands

## Run These Commands in Order

Open **PowerShell** or **CMD** and run:

```bash
# Navigate to project
cd C:\Users\motio\Music\Vora

# Check status (should show you have 1 commit ready to push)
git status

# Add remote (only if not already added)
git remote add origin https://github.com/DehanNimnaSandadiya/Vora.git

# If you get "remote origin already exists", run this instead:
# git remote set-url origin https://github.com/DehanNimnaSandadiya/Vora.git

# Switch to main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

---

## 🔐 If Authentication Fails

### Option 1: Use Personal Access Token (Easiest)

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" > "Generate new token (classic)"
3. Name: `Vora Deployment`
4. Select scopes: ✅ `repo` (full control)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)
7. When `git push` asks for password, paste the token instead

### Option 2: Use GitHub Desktop

1. Download: https://desktop.github.com/
2. Sign in with GitHub
3. File > Add Local Repository
4. Choose: `C:\Users\motio\Music\Vora`
5. Commit message: "Production-ready Vora app"
6. Click "Publish repository"

### Option 3: Use SSH (Recommended for Future)

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"
# Press Enter to accept default location
# Press Enter twice for no passphrase (or set one)

# Copy public key
type %USERPROFILE%\.ssh\id_ed25519.pub

# Add to GitHub:
# 1. Go to https://github.com/settings/ssh/new
# 2. Paste the key
# 3. Save

# Change remote URL
git remote set-url origin git@github.com:DehanNimnaSandadiya/Vora.git

# Push
git push -u origin main
```

---

## ✅ Verify Push Succeeded

1. Visit: https://github.com/DehanNimnaSandadiya/Vora
2. You should see all your files
3. Check that these files exist:
   - ✅ `server/package.json`
   - ✅ `client/package.json`
   - ✅ `DEPLOYMENT_GUIDE.md`
   - ✅ `START_HERE.md`
   - ✅ `render.yaml`
   - ✅ `client/vercel.json`

---

## 🚀 After Successful Push

Continue with deployment:
1. ✅ **MongoDB Atlas Setup** - See `START_HERE.md` Step 2
2. ✅ **Google OAuth Setup** - See `START_HERE.md` Step 3
3. ✅ **Deploy to Render** - See `START_HERE.md` Step 4
4. ✅ **Deploy to Vercel** - See `START_HERE.md` Step 5

---

## ❓ Still Having Issues?

**"fatal: remote origin already exists":**
```bash
git remote set-url origin https://github.com/DehanNimnaSandadiya/Vora.git
git push -u origin main
```

**"fatal: Authentication failed":**
- Use Personal Access Token (see Option 1 above)
- Or use GitHub Desktop (see Option 2 above)

**"fatal: repository not found":**
- Check repo name: `DehanNimnaSandadiya/Vora`
- Make sure repo exists on GitHub
- Verify you have push access
