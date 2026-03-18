# Deploy PedDent QE Review — Step by Step

## What You Need First

1. **Node.js** — Download from https://nodejs.org (pick the LTS version)
   - After installing, open Terminal (Mac) or Command Prompt (Windows)
   - Type `node --version` — you should see a version number

2. **The app folder** — Copy the entire `PedDent-QE-App` folder to your Desktop (or wherever you like)

---

## Step 1: Install Dependencies

Open Terminal and navigate to the app folder:

```bash
cd ~/Desktop/PedDent-QE-App
npm install
```

This downloads all the libraries the app needs. Takes about 30–60 seconds.

---

## Step 2: Test Locally

```bash
npm run dev
```

Open your browser to **http://localhost:5173** — you should see the app running.

Press `Ctrl+C` in Terminal to stop it when you're done testing.

---

## Step 3: Build for Production

```bash
npm run build
```

This creates a `dist/` folder with the optimized app ready to deploy.

---

## Step 4: Deploy (Pick One)

### Option A: Vercel (Recommended — Free, Easiest)

1. Go to https://vercel.com and sign up with your GitHub account (or email)
2. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. From your app folder, run:
   ```bash
   vercel
   ```
4. Follow the prompts (say yes to defaults)
5. Done — Vercel gives you a URL like `peddent-qe-review.vercel.app`

**To use a custom domain** (like peddentreview.com):
- Buy a domain from Namecheap, Google Domains, or GoDaddy (~$12/year)
- In Vercel dashboard → Settings → Domains → Add your domain
- Update your DNS to point to Vercel (they walk you through it)

### Option B: Netlify (Also Free, Drag & Drop)

1. Go to https://app.netlify.com
2. Sign up (free)
3. In Terminal, build the app:
   ```bash
   npm run build
   ```
4. Drag the `dist/` folder onto the Netlify deploy area in your browser
5. Done — get a URL like `peddent-qe-review.netlify.app`

### Option C: GitHub Pages (Free, Good if You Use GitHub)

1. Create a new GitHub repository
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR-USERNAME/peddent-qe-review.git
   git push -u origin main
   ```
3. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```
4. Add to package.json scripts:
   ```json
   "deploy": "npm run build && gh-pages -d dist"
   ```
5. Run:
   ```bash
   npm run deploy
   ```
6. Go to repo Settings → Pages → Source: gh-pages branch

---

## Step 5: Share It

Once deployed, you get a URL you can share with anyone. They can:
- Open it on their phone browser
- Tap "Add to Home Screen" (iOS: Share → Add to Home Screen, Android: menu → Install app)
- It works offline after first visit

---

## Updating the App

When you want to make changes:

1. Edit the files
2. Test locally: `npm run dev`
3. Redeploy:
   - **Vercel:** Just run `vercel` again (or push to GitHub if connected)
   - **Netlify:** Run `npm run build` and re-drag the dist folder
   - **GitHub Pages:** Run `npm run deploy`

---

## Adding New Questions

Edit `src/data/questions.json` — it's a JSON array. Each question looks like:

```json
{
  "id": 4889,
  "topic": "Pulp Therapy",
  "question": "Your question text here?",
  "a": "Choice A",
  "b": "Choice B",
  "c": "Choice C",
  "d": "Choice D",
  "e": "",
  "answer": "B",
  "explanation": "Because...",
  "source": "2026 Update"
}
```

Add new questions to the array, rebuild, and redeploy.

---

## Troubleshooting

**"npm: command not found"** → Node.js isn't installed. Download from https://nodejs.org

**"Error: Cannot find module..."** → Run `npm install` again

**Build errors** → Make sure you're in the PedDent-QE-App folder (check with `pwd`)

**Port already in use** → Another app is using that port. Try `npm run dev -- --port 3001`

**Questions not loading** → Check that `src/data/questions.json` exists and is valid JSON
