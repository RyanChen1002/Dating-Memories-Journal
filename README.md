# 💕 Dating Memories Journal

[![Live Demo On Vercel](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://dating-memories-journal.vercel.app)  
**Live Site:** [https://dating-memories-journal.vercel.app](https://dating-memories-journal.vercel.app)

A private, beautifully designed cloud application for couples to log and cherish their favorite dates, locations, and milestones. Built with a stunning dark-mode glassmorphism aesthetic.

## 📖 How to Use

1. **Create an Account:** Visit the site above and confidently sign up. Since it uses Row-Level-Security, your account is entirely isolated and private.
2. **Add a Memory:** Click the floating pink `+` button in the bottom corner. Upload a photo, pick the date, write a caption, type to search for an exact location using the live map data, and pick a glowing emoji mood.
3. **Filter the Timeline:** As your memories grow, use the beautiful glass search bar at the top to instantly filter by keywords (like restaurant names) or isolate them by specific years.
4. **Edit the Past:** Spot a typo? Hover over any memory card to instantly Edit the caption, map location, or delete the memory securely.

## ✨ Features

- **🔐 Privacy First:** Protected by Supabase Auth and Row-Level-Security (RLS). You only see your own memories.
- **📸 Cloud Photos:** Fast, auto-compressed cloud storage via Supabase.
- **🗺️ Interactive Maps:** Google Maps powers the primary multi-pin experience, with OpenStreetMap as an automatic fallback.
- **✨ Premium 3D Atmospheres:** The dashboard features multiple stunning, user-selectable 3D backgrounds built natively into the app, featuring Interactive WebGL Liquid Waves, Volumetric Twilight Clouds, and High-Action Rotating tsParticle engines (like Siamese Flying Emojis and Starfields).
- **📋 Upcoming Plans Bucket List:** An interactive sidebar module dedicated to future dates and bucket-list trips. Clicking a plan opens a gorgeous iOS-style transparent modal complete with a checklist subsystem and live discussion/notes thread!
- **📝 Safe Local Drafts:** Unfinished memory descriptions, dates, locations, and moods can be restored after a refresh or accidental close. Photos are never stored in browser drafts.
- **🗓️ Memory Calendar:** Switch between the timeline and a mobile-friendly monthly calendar generated from existing memories, with swipe month navigation and direct links back to each memory.
- **💅 Apple-Tier Luxury UI:** Engineered with complex CSS properties including `backdrop-filter` frosted glassmorphism panels, hidden dynamic scrollbars, interactive responsive neon outlines, and perfectly balanced Flexbox layouts scaling flawlessly to mobile.

## 🛠️ Tech Stack

This project was built without bloated frameworks! It leverages the power of pure, modern vanilla web technologies:
- **Frontend Core:** HTML5, CSS3, Vanilla JavaScript (ES6+).
- **Backend & Database:** Supabase JS SDK (PostgreSQL Database + Auth + Edge Storage).
- **Maps:** Google Maps JavaScript API, with Leaflet.js/OpenStreetMap fallback.

## 🤖 AI-Powered Workflow (Spec-Kit)

This repository is fully upgraded with an advanced **Spec-Kit Agentic AI Workflow**. It supports slash commands that completely automate the software development lifecycle directly from the IDE:
- **`/speckit-constitution`**: Defines core project engineering principles & governance.
- **`/speckit-specify`**: Auto-generates formal feature specs from natural language.
- **`/speckit-plan`**: Maps out architecture, data models, and system tech stacks.
- **`/speckit-tasks`**: Turns the specification and plan into an actionable `tasks.md` checklist.
- **`/speckit-implement`**: Executes the checklist, autonomously writing actual code. 

All workflow scripts live in `.github/skills/`, and their structured outputs are neatly organized inside `.specify/`.

## 🚀 Setup & Local Development

1. Clone the repository.
2. Ensure you have a Supabase project set up with the corresponding `memories` table and `memory-photos` public storage bucket.
3. Open `js/config.js` and insert your Supabase Project URL and Anon API Key.
	*(Note: Because of strict RLS policies, it is 100% physically safe to expose your Anon Key to the frontend).*
4. Run locally using VS Code Live Server or any basic HTTP server!

### Google Maps browser-key security

Google Maps JavaScript API keys are necessarily visible to the browser. The key in `js/config.js` must be protected in Google Cloud Console with both:

- **Application restriction — Websites:** allow only `https://dating-memories-journal.vercel.app/*`, `http://127.0.0.1:8765/*`, and `http://localhost:8765/*`.
- **API restriction:** allow only **Maps JavaScript API**.

Never use a server, service-account, unrestricted, or multi-API key in frontend code. Review usage under Google Maps Platform → Metrics and configure Billing budget alerts before deployment.

## 🌍 Deployment

### Install as a PWA

- **iPhone/iPad (Safari):** Open the deployed site, tap **Share**, then **Add to Home Screen**.
- **Android (Chrome):** Open the deployed site, open the browser menu, then tap **Install app** or **Add to Home screen**.
- **Desktop Chrome/Edge:** Open the deployed site and use the install icon in the address bar.

The PWA uses a custom couples-journal icon, standalone display mode, and a cached public app shell. Installation and Service Workers require HTTPS in production (provided by Vercel) or `localhost` during development. Private Supabase journal data and authentication responses are not intentionally cached by the Service Worker.

On supported browsers, use the visible **Install App** button. On iPhone/iPad, the button explains the Safari **Share → Add to Home Screen** flow. Mobile users can also switch 3D atmospheres directly from the quick-settings bar without opening the profile panel.

- **Hosting:** Fully deployed and automatically built via **Vercel**. Connect this codebase to Vercel for instantaneous, free global edge hosting!
