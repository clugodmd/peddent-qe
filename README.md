# PedDent QE Review - Pediatric Dental Board Exam Study Tool

A production-ready Progressive Web App (PWA) for studying pediatric dental board exams with 4,888 comprehensive questions, multiple study modes, and offline support.

## Features

- **Quiz Mode**: Quick quizzes with immediate feedback and explanations
- **Flashcard Mode**: Interactive flashcards with spaced repetition algorithm
- **Exam Simulation**: Full-length exam simulations with configurable timing (50, 100, or 200 questions)
- **Review Mode**: Search and filter all questions with detailed explanations
- **Progress Analytics**: Track accuracy by topic, study streak, and improvement over time
- **Offline Support**: Full PWA with service worker for offline access
- **Dark Mode**: Beautiful dark-themed UI optimized for extended study sessions
- **Mobile-First Design**: Responsive layout works perfectly on phones, tablets, and desktops
- **Data Persistence**: All progress saved locally in browser storage
- **Spaced Repetition**: SM-2 algorithm for optimal question scheduling

## Quick Start

### Prerequisites
- Node.js 16+ and npm (or yarn)
- A modern web browser with ES6+ support

### Local Development

1. **Clone or download this repository**

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm run dev
```

The app will open automatically at `http://localhost:3000`

4. **Build for production**
```bash
npm run build
```

## Deployment Options

### Option 1: Vercel (Recommended - Easiest)

Vercel provides free hosting for React/Vite apps with automatic deployments.

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
vercel
```

3. **Follow the prompts** and your app will be live!

**Advantages:**
- Zero configuration needed
- Automatic HTTPS
- Global CDN
- Free tier is generous
- Automatic deployments on git push

### Option 2: Netlify (Alternative)

Netlify provides free hosting with a simple drag-and-drop interface.

1. **Build your app**
```bash
npm run build
```

2. **Go to [netlify.com](https://netlify.com) and sign up**

3. **Drag and drop the `dist` folder** into Netlify

4. **Your app is live!**

**Advantages:**
- No CLI installation required
- Automatic HTTPS
- Custom domain support
- Easy environment variables

### Option 3: GitHub Pages

GitHub Pages provides free hosting directly from your repository.

1. **Update `vite.config.js`** to set the base path:
```javascript
export default defineConfig({
  base: '/peddent-qe-app/', // Change 'peddent-qe-app' to your repo name
  // ... rest of config
})
```

2. **Build the app**
```bash
npm run build
```

3. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push -u origin main
```

4. **Enable GitHub Pages** in repository settings:
   - Go to Settings → Pages
   - Set source to "Deploy from a branch"
   - Select "main" branch and "/root" folder

**Advantages:**
- No additional hosting needed
- Great for open-source projects
- Custom domain support

### Option 4: Docker Deployment

For advanced deployments, use Docker:

1. **Create a Dockerfile**
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
RUN npm install -g serve
WORKDIR /app
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

2. **Build and run**
```bash
docker build -t peddent-qe .
docker run -p 3000:3000 peddent-qe
```

### Option 5: Traditional Hosting (Apache, Nginx)

For traditional web hosting:

1. **Build the app**
```bash
npm run build
```

2. **Upload the `dist` folder** to your web server's public directory

3. **Configure your server** for SPA routing:

**Nginx Example:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**Apache Example:**
Add `.htaccess` to your `dist` folder:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## Project Structure

```
peddent-qe-app/
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   ├── favicon.svg             # App icon
│   └── index.html              # Root HTML
├── src/
│   ├── components/
│   │   ├── common/             # Reusable components
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── QuestionCard.jsx
│   │   │   ├── ChoiceButton.jsx
│   │   │   ├── TopicBadge.jsx
│   │   │   └── Button.jsx
│   │   └── layout/
│   │       ├── Header.jsx
│   │       └── BottomNav.jsx
│   ├── pages/                  # Page components
│   │   ├── Home.jsx
│   │   ├── Quiz.jsx
│   │   ├── Flashcards.jsx
│   │   ├── Exam.jsx
│   │   ├── Review.jsx
│   │   ├── Progress.jsx
│   │   └── Settings.jsx
│   ├── hooks/                  # Custom React hooks
│   │   ├── useQuiz.js
│   │   └── useTimer.js
│   ├── store/                  # State management
│   │   └── progressStore.js
│   ├── utils/                  # Utility functions
│   │   └── helpers.js
│   ├── data/                   # Question data
│   │   └── questions.json
│   ├── constants.js            # App constants
│   ├── App.jsx                 # Root component
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .gitignore
└── README.md
```

## Usage Guide

### Starting a Quiz
1. Click "Quick Quiz" on the home page
2. Select optional filters (topic, difficulty)
3. Answer questions with immediate feedback
4. Review explanations for each question

### Using Flashcards
1. Click "Flashcards" from the home page
2. Click a card to flip it
3. Rate your understanding: Again, Hard, Good, or Easy
4. The app uses spaced repetition to optimize review timing

### Taking an Exam Simulation
1. Click "Exam Simulation" on the home page
2. Select number of questions (50, 100, or 200)
3. Timer starts automatically
4. Complete all questions without feedback
5. Review detailed results including topic breakdown

### Reviewing Questions
1. Click "Review Questions" or use the Review Mode
2. Search by keyword, topic, or source
3. Filter by: All, Flagged, Previously Wrong, or Not Attempted
4. View detailed explanations and mark questions for review

### Tracking Progress
1. Visit the Progress & Analytics page
2. View overall accuracy, completion %, and study streak
3. See topic-by-topic performance breakdown
4. Track daily study activity over the last 30 days

## Data & Privacy

- **All data stored locally** in browser localStorage
- **No server backend** - everything runs offline
- **No analytics** or user tracking
- **Export/Import** your progress anytime
- **No account required** - fully anonymous

### Exporting Your Data
1. Go to Settings
2. Click "Export Progress"
3. JSON file downloads to your computer
4. Keep as backup or import on another device

### Importing Data
1. Go to Settings
2. Click "Import Progress"
3. Select previously exported JSON file
4. Progress instantly restored

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- All modern mobile browsers

## Technical Stack

- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Recharts** - Analytics charts
- **Lucide React** - Icons

## Performance

- **Fast Load Times**: Optimized with code splitting and lazy loading
- **Offline Support**: Service worker caches all assets
- **Small Bundle**: ~150KB gzipped
- **Mobile Optimized**: Progressive enhancement for all devices

## Features in Detail

### Spaced Repetition Algorithm
The app uses a modified SM-2 algorithm:
- Questions rated "Easy" appear again in days
- "Good" answers appear in 3+ days
- "Hard" answers appear sooner
- "Again" resets the spacing
- Ease factor adjusts based on performance

### Analytics
- Accuracy breakdown by topic
- Study streak tracking (current & longest)
- Daily activity heatmap
- Time tracking per session
- Grade calculations (A-F)

### Accessibility
- High contrast dark theme
- Keyboard navigation support
- Semantic HTML
- Mobile-friendly touch targets
- Font size adjustments

## Troubleshooting

### App not loading offline?
- Ensure service worker is registered: Check browser DevTools
- Try clearing cache: Settings → Developer Tools → Application
- Refresh the page

### Progress not saving?
- Check browser storage quota: DevTools → Application → LocalStorage
- Ensure cookies are not blocked in browser settings
- Export and re-import data if corruption occurs

### Performance issues?
- Disable browser extensions
- Clear cache and cookies
- Use a modern browser (latest version)
- Close other tabs

## Development

### Building from source
```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Modifying questions
Edit `/src/data/questions.json` directly. Must follow this structure:

```json
{
  "id": 1,
  "topic": "Topic Name",
  "question": "Question text here?",
  "a": "Option A text",
  "b": "Option B text",
  "c": "Option C text",
  "d": "Option D text",
  "e": "Option E text (optional)",
  "answer": "a",
  "explanation": "Explanation here",
  "source": "Source document"
}
```

## License

This is a standalone study tool. Use freely for educational purposes.

## Support & Feedback

For questions or improvements, refer to the local documentation or reach out to the development team.

## Version History

### v1.0.0 (Current)
- Initial release
- 4,888 pediatric dental questions
- All major study modes
- Offline PWA support
- Full analytics suite
- Dark mode theme
- Mobile-optimized design

---

**Happy studying! Pass your pediatric dental board exam with confidence.**
