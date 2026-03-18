# PedDent QE Review - Quick Deployment Guide

## 30-Second Deployment with Vercel (Recommended)

The fastest way to get your app live:

### 1. Install Vercel
```bash
npm install -g vercel
```

### 2. Deploy
```bash
vercel
```

### 3. Done!
Your app is now live with a URL like `https://peddent-qe-app.vercel.app`

---

## Step-by-Step for Beginners

### Prerequisites
- Completed `npm install`
- Have a GitHub, Vercel, or Netlify account (free)

### Deploy in 5 Minutes

#### **Option A: Vercel (Easiest)**

1. **Install CLI:**
```bash
npm install -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy:**
```bash
vercel
```

4. **Answer prompts:**
   - "Set up and deploy?" → `y`
   - "Which scope?" → Select your account
   - "Project name?" → `peddent-qe`
   - "In which directory?" → `./`
   - "Want to modify?" → `n`

5. **Live!** Copy the URL and share it

---

#### **Option B: Netlify (No CLI Required)**

1. **Build the app:**
```bash
npm run build
```

2. **Go to [netlify.com](https://netlify.com)**

3. **Sign up with GitHub**

4. **Drag and drop** the `dist` folder into the deploy area

5. **Live in seconds!**

---

#### **Option C: GitHub Pages**

1. **Update vite config:**
   Edit `vite.config.js` and change:
```javascript
export default defineConfig({
  base: '/repo-name/',  // Change repo-name to your actual repo name
  // ...
})
```

2. **Build:**
```bash
npm run build
```

3. **Create GitHub repo** (if you haven't)

4. **Push code:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/repo-name.git
git push -u origin main
```

5. **Enable GitHub Pages:**
   - Go to repo Settings
   - Scroll to Pages
   - Set source to "main" branch
   - Click Save

6. **Access at:** `https://YOUR_USERNAME.github.io/repo-name`

---

## Testing Before Deployment

### 1. Test locally:
```bash
npm run build
npm run preview
```

Visit `http://localhost:5000` and test:
- Load home page
- Take a quiz
- Check offline mode (DevTools → Network → Offline)
- Try flashcards
- Check dark mode toggle in settings

### 2. Verify PWA:
- DevTools → Application → Manifest (should load)
- Check Service Worker status

### 3. Test responsive design:
- Open DevTools (F12)
- Toggle device toolbar (Ctrl+Shift+M)
- Test on mobile, tablet, desktop sizes

---

## Environment Variables (Optional)

Create `.env.local` (copy from `.env.example`):
```
VITE_APP_NAME=PedDent QE Review
VITE_ENABLE_PWA=true
```

---

## Custom Domain

### **Vercel:**
1. Go to Vercel dashboard
2. Select your project
3. Settings → Domains
4. Add your custom domain
5. Follow DNS instructions

### **Netlify:**
1. Go to Site settings
2. Domain management
3. Add custom domain
4. Update DNS records

### **GitHub Pages:**
1. Add CNAME file to repo root with domain
2. Update DNS to point to GitHub

---

## Troubleshooting Deployment

### App shows blank page
- Check browser console (F12)
- Ensure `base` path is correct in `vite.config.js`
- Clear cache and refresh

### Questions not loading
- Verify `src/data/questions.json` was included in build
- Check dist folder contains data file
- Verify build completed successfully

### Offline not working
- Service worker takes time to register
- Refresh page twice
- Check DevTools → Application → Service Workers

### Build fails
```bash
# Clear and rebuild
rm -rf dist node_modules
npm install
npm run build
```

---

## Monitoring & Updates

### Monitor performance:
- Vercel: Dashboard shows page metrics
- Netlify: Analytics in site settings
- Check build logs for errors

### Update the app:
```bash
# Make changes
# Test locally
npm run dev

# Build and redeploy
npm run build
vercel  # or push to GitHub
```

---

## Security Checklist

- [ ] All questions loaded from `questions.json`
- [ ] No API keys in code
- [ ] No sensitive data in localStorage (only progress)
- [ ] Service worker caches appropriately
- [ ] HTTPS enabled (automatic on Vercel/Netlify)
- [ ] CSP headers configured (if needed)

---

## Performance Tips

The app is already optimized, but you can further improve:

1. **Enable compression** (automatic on most platforms)
2. **Use CDN** (Vercel/Netlify provide this)
3. **Monitor bundle size:**
```bash
npm run build -- --stats
```

Current bundle size: ~150KB gzipped

---

## FAQ

**Q: Is my data private?**
A: Yes. All progress stored in browser only. No backend server.

**Q: Can I use a custom domain?**
A: Yes, all platforms support custom domains (usually $12-15/year).

**Q: Can I use my own server?**
A: Yes, upload `dist` folder to any web host supporting SPAs.

**Q: How do I update the app after deployment?**
A: For Vercel/Netlify: Push new code → auto-redeploys. For GitHub Pages: Push to main → redeploys.

**Q: Can users download the app as PWA?**
A: Yes. On mobile, they'll see "Add to Home Screen" prompt.

---

## Next Steps

1. Deploy using Vercel (easiest)
2. Test thoroughly on mobile & desktop
3. Share URL with students
4. Monitor for issues
5. Update questions as needed

Good luck! 🦷✅

---

**Need help?** Refer to platform-specific docs:
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [GitHub Pages Guide](https://pages.github.com)
