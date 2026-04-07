# Awesome GitHub Profile Pages

> A curated gallery of awesome GitHub-hosted profile sites & templates.

**[🌐 View the Live Gallery](https://Dipen-Dedania.github.io/awesome-github-profile-website/)**

---

## 🚀 The Gallery Site
We've built a modern, responsive gallery site to showcase these profiles. It features:
- **Firebase Cache:** The browser reads stats from Firebase and local cache only.
- **Background Sync:** A Node script refreshes Firebase from GitHub on a schedule.
- **Smart Filtering:** Search by name, author, or language.
- **Modern UI:** A sleek dark-mode interface with glassmorphism and animations.
- **Data Source Split:**
  - `data.md` is the source for the **profile list** (repo/site links, author, etc.).
  - Firebase is the source for **live GitHub stats** (stars, forks, followers, updated date).


Hey there,
If you have come across to this repo so you definitely wants to create an awesome profile page and you don't have enough time to create simple website or not interested in doing HTML stuff then you are probably at the right place.   

## Resume is dead 

A good Github profile can both make you more likely to pass resume screening and impress the interviewer. For both recruiters and interviewers, it’s very important to know what each candidate has been working and what's their contributions to the open source community. we all know that resume becomes less and less valuable because people tend to exaggerate their past contributions/skills and it’s extremely hard to verify. Some people may even fake their resumes.(grand salutes to those extraordinary peoples)

However only few candidates have a Github page on their resumes and most of them are not well maintained. So you definitely get better chance to stand out by keeping an up-to-date Github profile. By looking at one’s Github repositories, you can almost immediately tell if he’s an expert or beginner of a specific field.

## List

Here are the list of sample repositories which I came accrossed and found interesting. Order is based on a way I found a repo. Make sure to fork and give it a star to appreciate their efforts. 

## 🤝 Contribution Workflow (Add a New Profile)

Use this standard flow to add your profile to the gallery:

1. **Fork and clone**
   ```bash
   git clone https://github.com/<your-username>/awesome-github-profile-website.git
   cd awesome-github-profile-website
   npm install
   ```
2. **Create a branch**
   ```bash
   git checkout -b feat/add-<your-github-username>-profile
   ```
3. **Add your profile entry in `data.md`**
   - Add your entry inside the `<!-- PROFILES-START -->` and `<!-- PROFILES-END -->` block.
   - Follow the existing entry format exactly (`Repo - ...`, `Link - ...`, separators, etc.).
4. **Generate derived files**
   ```bash
   npm run extract
   npm run generate:screenshots
   ```
5. **Run local verification**
   ```bash
   npm run dev
   npm run build
   ```
   Confirm your card appears correctly and links work.
6. **Commit and push**
   ```bash
   git add .
   git commit -m "Add profile: <your-github-username>"
   git push origin feat/add-<your-github-username>-profile
   ```
7. **Open PR / MR**
   - Create a Pull Request (or Merge Request) to `master`.
   - Include:
     - Your GitHub username
     - Live site URL
     - Repo URL
     - A screenshot (if available)
   - Keep the PR focused to profile-related changes only.


---

## 🛠️ Development & Deployment

This project uses **React + Vite + Tailwind CSS**. The profile data is automatically extracted from the list above.

### How `data.md` and Firebase work together
1. `data.md` is parsed by `scripts/extract-profiles-from-readme.js` and generates `src/profiles.js`.
2. The app renders cards from `src/profiles.js` (this is the canonical list of profiles).
3. At runtime, the app hydrates stats from Firebase cache (with localStorage fallback), not from GitHub API directly in the browser.
4. `scripts/sync-github-cache.js` updates Firebase with fresh repo/user stats.

### Local Setup
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure Firebase cache:**
   - Copy `.env.example` to `.env`
   - Fill Firebase Web SDK fields and Realtime Database URL
   - Add `GITHUB_TOKEN` if you want to run the sync script locally

3. **Start development server:**
   ```bash
   npm run dev
   ```
   *The extraction script will automatically run to sync with the latest `data.md` changes.*

### Sync Cache
Run this to refresh GitHub stats into Firebase:
```bash
npm run sync:github-cache
```
The command skips records that are newer than one week.

### Deploying
The project is configured with **GitHub Actions**. Simply push your changes to the `master` branch, and it will automatically deploy to GitHub Pages.

There is also a scheduled workflow that refreshes the Firebase cache daily.

Alternatively, to deploy manually:
```bash
npm run deploy
```

---
