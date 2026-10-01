# Technical Implementation Plan: Dating Memories Journal

**Feature**: dating-memories-journal
**Version**: 2.0.0
**Date**: 2026-09-23
**Status**: Implemented

---

## 1. Architecture Overview

### High-Level Architecture
```
┌──────────────────────────────────────────────────┐
│                   Browser (Client)                │
│                                                    │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ auth.html│  │index.html│  │   js/memory.js  │  │
│  │ Login/   │  │ Timeline │  │ CRUD + Filters  │  │
│  │ Signup   │  │ Dashboard│  │ Location Search │  │
│  └────┬─────┘  └────┬─────┘  └───────┬────────┘  │
│       │              │                │            │
│       └──────────────┴────────────────┘            │
│                      │                             │
└──────────────────────┼─────────────────────────────┘
                       │ HTTPS
         ┌─────────────┴──────────────┐
         │     Supabase Cloud         │
         │                            │
         │  ┌────────┐  ┌──────────┐  │
         │  │  Auth   │  │ Postgres │  │
         │  │ Service │  │   (RLS)  │  │
         │  └────────┘  └──────────┘  │
         │  ┌────────────────────┐    │
         │  │  Storage Bucket    │    │
         │  │  (memory-photos)   │    │
         │  └────────────────────┘    │
         └────────────────────────────┘

         ┌────────────────────────────┐
         │  OpenStreetMap Nominatim   │
         │  (Location Autocomplete)   │
         └────────────────────────────┘
```

### Architecture Principles
- **Zero-framework frontend**: Pure HTML5/CSS3/JS for maximum simplicity and portability
- **Backend-as-a-Service**: Supabase handles auth, database, and file storage with zero server code
- **Security by default**: Row-Level Security policies enforce data isolation at the database layer
- **Progressive enhancement**: Core timeline works without maps; location/search are additive features

---

## 2. Technology Stack

### Core Technologies
| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | HTML5 / CSS3 / Vanilla JS (ES6+) | — | Structure, styling, logic |
| Typography | Google Fonts (Outfit) | — | Premium UI typography |
| Backend | Supabase JS SDK | v2 | Auth + Postgres + Storage |
| Maps | Leaflet.js | 1.9.4 | Map rendering (loaded but currently unused for display) |
| Location API | OpenStreetMap Nominatim | Free | Live address autocomplete |
| Design System | Custom CSS (Glassmorphism) | — | Dark-mode, glowing accents, glass panels |

### External Services
| Service | Purpose | Auth Required |
|---------|---------|---------------|
| Supabase | Database, Auth, Storage | Anon Key (safe to expose) |
| OpenStreetMap Nominatim | Location search | None (free, no API key) |
| Google Fonts CDN | Typography | None |

---

## 3. Component Breakdown

### 3.1 Authentication Layer (`auth.html` + `js/app.js`)
- **Sign Up form**: Email + Password → `supabase.auth.signUp()`
- **Login form**: Email + Password → `supabase.auth.signInWithPassword()`
- **Session guard**: `supabase.auth.getSession()` on page load; redirect if not authenticated
- **Logout**: `supabase.auth.signOut()` → redirect to `auth.html`

### 3.2 Memory CRUD Layer (`js/memory.js`)
- **Create**: Photo upload → Storage bucket → Insert row to `memories` table
- **Read**: `supabase.from('memories').select('*').order('date', { ascending: true })`
- **Update**: Detect edit mode → `supabase.from('memories').update(payload).eq('id', memoryId)`
- **Delete**: `window.confirm()` → `supabase.from('memories').delete().eq('id', memoryId)`

### 3.3 Location Autocomplete Layer (`js/memory.js`)
- Debounced `fetch()` to Nominatim API on keystrokes (min 3 chars)
- Glassmorphism dropdown renders results with address parsing
- On selection: captures `lat`, `lng`, and formatted place name

### 3.4 Dashboard & Filtering Layer (`js/memory.js`)
- **Stats Panel**: Total memories count + unique locations count
- **Search Filter**: Client-side instant filter on caption and location_name
- **Year Filter**: Dynamically populated `<select>` dropdown from data

### 3.5 Timeline Renderer (`js/memory.js`)
- Renders memory cards with photo, date, caption, location pill, edit/delete buttons
- Vertical glowing timeline line via CSS `::before` pseudo-element
- Anchor dots on each card via CSS `::after`

---

## 4. Data Architecture

### Supabase `memories` Table Schema
| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | Primary Key, auto-generated |
| user_id | uuid | Foreign key → auth.users, auto-set by RLS |
| date | date | Required, no future dates |
| caption | text | Required |
| photo_url | text | Public URL from Storage bucket |
| location_name | text | Required, human-readable place name |
| location_lat | float | Nullable, GPS latitude from Nominatim |
| location_lng | float | Nullable, GPS longitude from Nominatim |
| mood | text | Required, single emoji character |
| created_at | timestamptz | Auto-generated |

### Supabase Storage
- **Bucket**: `memory-photos` (public)
- **Path pattern**: `{user_email}/{timestamp}_{filename}`
- **Compression**: Client-side resize to max 800px width before upload

---

## 5. Security Plan

### Row-Level Security (RLS)
- `SELECT`: Users can only read rows where `user_id = auth.uid()`
- `INSERT`: `user_id` is automatically set to `auth.uid()`
- `UPDATE`: Users can only update their own rows
- `DELETE`: Users can only delete their own rows

### Client-Side Security
- Supabase Anon Key is safe to expose (RLS enforces access control)
- No sensitive data in `js/config.js` beyond the public anon key
- Photo validation: type check + size check before upload

---

## 6. File Structure
```
Dating-Memories-Journal/
├── .github/skills/              # Spec-Kit AI command instructions
├── .specify/
│   ├── memory/constitution.md   # Project governance
│   └── specs/001-dating-memories/
│       ├── spec.md              # This specification
│       ├── plan.md              # This plan
│       └── tasks.md             # Generated task checklist
├── assets/
│   └── bg-timeline.png          # Background image
├── css/
│   └── style.css                # Complete design system (~600 lines)
├── js/
│   ├── app.js                   # Auth logic + session management
│   ├── config.js                # Supabase URL + Anon Key
│   └── memory.js                # Memory CRUD + timeline + filters
├── auth.html                    # Login/Signup page
├── index.html                   # Main timeline page
└── README.md                    # Project documentation
```

---

## 7. Development Workflow

### Git Workflow
- **Branch**: `develop` for active development
- **Main**: `main` for stable releases
- **Commit style**: `feat:`, `fix:`, `docs:` conventional commits

### Deployment Strategy
- **Platform**: Vercel (free global edge deployment)
- **Process**: Push to GitHub → auto-deploy from `main` branch
- **PWA**: Using `manifest.json` for mobile "install" capability
