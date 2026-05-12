# SkillSprint — Gamified PM Learning

A gamified web app for PM skill-building. Daily scenario-based challenges, XP tracking, streaks, and a leaderboard.

Built to demonstrate 0→1 product execution as a portfolio project.

## Stack
- React 18
- DM Sans + Syne (Google Fonts)
- No external UI libraries — custom CSS only

## Local Development

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

### Option 1 — Vercel CLI (fastest)
```bash
npm install -g vercel
vercel
```
Follow the prompts. Done.

### Option 2 — GitHub + Vercel Dashboard
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import the GitHub repo
4. Vercel auto-detects Create React App
5. Click Deploy

### Option 3 — Drag & Drop
```bash
npm run build
```
Then drag the `build/` folder to [vercel.com/new](https://vercel.com/new)

## Features
- 3 PM challenges across Prioritization, Metrics, and PRD Writing
- Per-question feedback explaining why each answer is right/wrong
- XP system with level progression
- 7-day streak tracking
- Leaderboard with podium
- Profile with badges
- Mobile-first responsive layout

## Project Context
Built as a portfolio project by Ayush Sharma (Product Associate) to demonstrate product ownership from PRD → prototype → shipped product.
