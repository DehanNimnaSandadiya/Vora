# 📤 Push to GitHub Guide

## Step-by-Step Instructions

### 1. Configure Git (if first time)

```bash
cd C:\Users\motio\Music\Vora
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### 2. Stage All Files

```bash
git add .
```

### 3. Commit Changes

```bash
git commit -m "Production-ready: Cleaned code, fixed errors, added deployment configs"
```

### 4. Add Remote Repository

```bash
git remote add origin https://github.com/DehanNimnaSandadiya/Vora.git
```

**If remote already exists:**
```bash
git remote set-url origin https://github.com/DehanNimnaSandadiya/Vora.git
```

### 5. Push to GitHub

```bash
git branch -M main
git push -u origin main
```

### 6. If Push Fails (Authentication)

**Option A: Use GitHub CLI**
```bash
gh auth login
git push -u origin main
```

**Option B: Use Personal Access Token**
1. Go to GitHub > Settings > Developer settings > Personal access tokens
2. Generate new token (classic) with `repo` scope
3. Use token as password when prompted

**Option C: Use SSH (Recommended)**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub: Settings > SSH and GPG keys > New SSH key
# Then change remote URL:
git remote set-url origin git@github.com:DehanNimnaSandadiya/Vora.git
git push -u origin main
```

---

## Verification

After pushing:
1. Visit: https://github.com/DehanNimnaSandadiya/Vora
2. Verify all files are present
3. Check that `.env.example` files are visible (not `.env` files)

---

## Next Steps After Push

1. ✅ Set up MongoDB Atlas (see DEPLOYMENT_GUIDE.md)
2. ✅ Configure Google OAuth (see DEPLOYMENT_GUIDE.md)
3. ✅ Deploy to Render (backend) - see RENDER_SETUP.md
4. ✅ Deploy to Vercel (frontend) - see VERCEL_SETUP.md
