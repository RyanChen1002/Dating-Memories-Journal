# 💕 Dating Memories Journal

A private, beautifully designed cloud application for couples to log and cherish their favorite dates, locations, and milestones. Built with a stunning dark-mode glassmorphism aesthetic.

## ✨ Features

- **🔐 Privacy First (Secure Login):** Protected zero-trust architecture. Powered by Supabase Authentication and Postgres Row-Level-Security (RLS), meaning couples can only ever view their own memories.
- **📸 Intelligent Cloud Photos:** Automatically compresses large date photos securely into a Supabase Storage bucket for lightning-fast loading and preserving free-tier server limits.
- **🗺️ Interactive Minimaps:** Drop pins directly on your memories using live, open-source OpenStreetMap location autocomplete. Each memory card dynamically renders a gorgeous, vibrant embedded map.
- **🔎 Relational Dashboard:** Includes a live Relationship Stats engine that computes total memories and unique dates.
- **⏱️ Smart Filtering:** Instantly animate and filter your relationship roadmap using the custom Year Dropdown or blazing-fast keyword search (fully client-side).
- **💅 Premium UI/UX:** Built entirely with advanced CSS features: dynamic layouts, vibrant glowing timeline lines, hover-responsive floating emoji orbs, and blurred glass windows.

## 🛠️ Tech Stack

This project was built without bloated frameworks! It leverages the power of pure, modern vanilla web technologies:
- **Frontend Core:** HTML5, CSS3, Vanilla JavaScript (ES6+).
- **Backend & Database:** Supabase JS SDK (PostgreSQL Database + Auth + Edge Storage).
- **Maps:** Leaflet.js with free OpenStreetMap tile layers.

## 🚀 Setup & Local Development

1. Clone the repository.
2. Ensure you have a Supabase project set up with the corresponding `memories` table and `memory-photos` public storage bucket.
3. Open `js/config.js` and insert your Supabase Project URL and Anon API Key.
	*(Note: Because of strict RLS policies, it is 100% physically safe to expose your Anon Key to the frontend).*
4. Run locally using VS Code Live Server or any basic HTTP server!

## 🌍 Coming Soon (Phase 6)
- **PubThis Hosting:** The next target is configuring a deployment pipeline using the `pubthis` MCP/CLI instead of traditional hosts to instantly publish this journal to the internet.
