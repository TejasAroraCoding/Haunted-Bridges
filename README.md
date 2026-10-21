# Haunted Bridges — installable web app

This folder is a Progressive Web App. Once it's hosted on an **https** site, phones and computers can install it to the home screen / app list and play full-screen and offline.

## Files
- `index.html` — the whole game
- `manifest.webmanifest` — app name, icons, landscape/full-screen settings
- `sw.js` — service worker that caches the game (and its fonts) for offline play
- `icons/` — app icons (regular, maskable, Apple touch, favicon)

## Put it online (pick one, all free)
- **Netlify Drop:** go to app.netlify.com/drop and drag this whole folder onto the page. You get an https link immediately.
- **GitHub Pages:** create a repository, upload the contents of this folder, then Settings → Pages → deploy from the main branch.
- **Cloudflare Pages / Vercel / any static host** also work — upload the folder as-is.

Keep the files together; the paths are relative, so it also works inside a sub-folder.

## Install it
- **Android (Chrome/Edge):** open the link → tap the **⬇ INSTALL** button in the top-right of the game, or browser menu → *Install app*.
- **iPhone / iPad (Safari):** open the link → Share → *Add to Home Screen*.
- **Desktop (Chrome/Edge):** click the install icon in the address bar, or the in-game **⬇ INSTALL** button.

## Updating
After changing `index.html`, bump `VERSION` at the top of `sw.js` (e.g. `hb-core-v8.1`) so installed copies pick up the new files.

## Local testing
Opening `index.html` straight from disk still plays fine, but installing needs a web server. For a quick local test run `python3 -m http.server` in this folder and open http://localhost:8000.
