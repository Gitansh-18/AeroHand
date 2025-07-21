# AeroHand

A hand-gesture controlled web game built with Vite, JavaScript, and MediaPipe Hands.

## Author
Gitansh

## Features
- Playable only on desktop/laptop (not mobile)
- Responsive UI for all window sizes
- Minimum window size enforcement with user message
- Fullscreen support
- All assets and sounds included

## Deployment Instructions
1. **Install dependencies:**
   ```
   npm install
   ```
2. **Build for production:**
   ```
   npm run build
   ```
3. **Serve the `dist/` folder locally to test:**
   ```
   npx serve dist
   # or
   cd dist
   python -m http.server 5000
   ```
   Open your browser to the shown localhost address.
4. **Deploy the `dist/` folder to your static web host** (Vercel, Netlify, GitHub Pages, etc).

## Security Notes
- All frontend code is public in the browser. The code is minified/obfuscated in production.
- No secrets or sensitive data are present in the frontend.
- The game is licensed under the MIT License (see LICENSE).

## Project Structure
- `src/` - Source code (JS, logic, rendering)
- `public/` - Static assets (images, sounds)
- `dist/` - Production build output (deploy this folder)

## License
MIT License. Copyright (c) 2025 Gitansh. See [LICENSE](./LICENSE). 

---

## **How to Fix and Push to GitHub**

1. **Remove the lock file:**
   ```sh
   del .git\index.lock
   ```
   (or manually delete `.git/index.lock` in your project folder)

2. **Stage all required files:**
   ```sh
   git add src public index.html styles.css package.json package-lock.json tsconfig.json tsconfig.app.json tsconfig.node.json postcss.config.js eslint.config.js tailwind.config.js vite.config.ts README.md LICENSE .gitignore game.py
   ```

3. **Commit your changes:**
   ```sh
   git commit -m "Initial commit: AeroHand game by Gitansh"
   ```

4. **Add your GitHub remote (if not already):**
   ```sh
   git remote add origin https://github.com/yourusername/aerohand.git
   ```

5. **Push to GitHub:**
   ```sh
   git push -u origin main
   ```

---

**You only need to deploy the `dist/` folder to your web host after running `npm run build`.  
For GitHub, push only the files above (not `dist/` or `node_modules/`).**

Let me know if you want the exact commands for a specific step! 