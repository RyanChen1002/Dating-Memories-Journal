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
- **🗺️ Interactive Minimaps:** Drop pins with live OpenStreetMap integration.
- **✨ Premium 3D Atmospheres:** The dashboard features multiple stunning, user-selectable 3D backgrounds built natively into the app, featuring Interactive WebGL Liquid Waves, Volumetric Twilight Clouds, and High-Action Rotating tsParticle engines (like Siamese Flying Emojis and Starfields).
- **📋 Upcoming Plans Bucket List:** An interactive sidebar module dedicated to future dates and bucket-list trips. Clicking a plan opens a gorgeous iOS-style transparent modal complete with a checklist subsystem and live discussion/notes thread!
- **💅 Apple-Tier Luxury UI:** Engineered with complex CSS properties including `backdrop-filter` frosted glassmorphism panels, hidden dynamic scrollbars, interactive responsive neon outlines, and perfectly balanced Flexbox layouts scaling flawlessly to mobile.

## 🛠️ Tech Stack

This project was built without bloated frameworks! It leverages the power of pure, modern vanilla web technologies:
- **Frontend Core:** HTML5, CSS3, Vanilla JavaScript (ES6+).
- **Backend & Database:** Supabase JS SDK (PostgreSQL Database + Auth + Edge Storage).
- **Maps:** Leaflet.js with free OpenStreetMap tile layers.

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

## 🌍 Deployment

- **Hosting:** Fully deployed and automatically built via **Vercel**. Connect this codebase to Vercel for instantaneous, free global edge hosting!
