# Project Constitution: Dating Memories Journal
**Version**: 1.0.0  
**Ratified**: 2026-09-17  
**Project**: Dating Memories Journal — A couples' timeline app for logging shared date memories with photos, captions, location pins, and mood emojis.

---

## Sync Impact Report
*This section documents any amendments to the constitution after initial ratification.*

| Version | Date | Change Summary |
|---------|------|----------------|
| 1.0.0 | 2026-09-17 | Initial ratification |

---

## Core Principles

### Article I: Library-First
Prefer well-maintained, existing libraries over custom implementations. Use established solutions for maps (Leaflet.js), date formatting (date-fns), emoji picking, and image handling. Do not reinvent solved problems.

### Article II: Explicit Boundaries
The application is divided into clearly separated concerns: authentication, memory CRUD, timeline rendering, map/location, and media handling. Each module must have a clean, explicit interface. No feature should reach into another module's internals.

### Article III: Test-First
Core functionality — creating, reading, updating, and deleting memories — must have corresponding tests written alongside feature development. Edge cases must be explicitly tested: empty photo uploads, captions at character limit, invalid dates, and missing location data.

### Article IV: Operational Visibility
The UI must always communicate state clearly to the user. Every async operation (saving a memory, loading the timeline, uploading a photo) must show a loading indicator. Every error must surface a human-readable, actionable message. Silent failures are never acceptable.

### Article V: Secure Defaults
- No couple's private data is ever exposed in URLs or browser history
- Authentication tokens are stored securely (httpOnly cookies or secure localStorage with expiry)
- Photo uploads are validated client-side (type, size) before transmission
- No personally identifiable information is logged to the console in production

### Article VI: Scalability & Performance
- The timeline must render the first 10 memory cards in under 2 seconds on a standard connection
- Photos must be displayed as progressive thumbnails on the timeline; full resolution only on detail view
- Map pins must load asynchronously and never block the page render
- All images are compressed client-side before upload (max 2MB per photo)

### Article VII: Simplicity
The app is for couples sharing intimate moments — the design must be emotionally resonant and visually clean. Avoid feature bloat. Every UI element must serve a clear purpose. Complexity is the enemy of romance.

### Article VIII: Anti-Abstraction
Write concrete, readable code first. Do not create abstract base classes or over-engineered utility layers until there is a clear, repeated need. Premature abstraction obscures intent and slows development.

### Article IX: Integration-First
The first working milestone is a complete end-to-end user path: a couple logs in → adds a memory with photo, caption, location, and mood → sees it appear on their shared timeline. Everything else is secondary until this path works.

---

## Tech Stack & Constraints

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | HTML5, CSS3, Vanilla JavaScript | No framework required for initial version |
| Maps | Leaflet.js | Open-source, no API key required for tile layer |
| Date handling | date-fns (CDN) | Lightweight, tree-shakeable |
| Storage (v1) | Browser localStorage | For prototype; upgrade to backend in v2 |
| Image handling | FileReader API | Client-side preview and compression |
| Emoji picker | Native emoji or emoji-picker-element | Lightweight web component |

---

## Domain-Specific Quality Gates

### Memory Creation
- A memory **must** include: date, at least one photo, a caption (1–280 characters), a location pin, and a mood emoji
- Photo upload must show a live preview before the user saves
- The date field must default to today but be editable; future dates are not allowed

### Timeline Display
- Memories are displayed newest-first by default
- Each timeline card must show: photo thumbnail, date, location name, mood emoji, and caption preview (truncated at 100 chars)
- Timeline must support smooth scroll without jank

### Couple Account System
- Both partners share one joint account/profile
- Either partner can add, edit, or delete any memory in the shared journal
- Session must persist across browser refreshes (remember me)

### Location
- Location is selected via an interactive map pin drop (Leaflet.js)
- A human-readable place name is required alongside the coordinates
- Location is displayed as a named pin on memory cards and the detail view

---

## Amendment Process
Changes to this constitution require:
1. A clear written rationale for the change
2. Review of impact on existing features
3. Version bump and entry in the Sync Impact Report above
