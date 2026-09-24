# Tasks: Dating Memories Journal

**Feature**: dating-memories-journal
**Generated**: 2026-09-23
**Status**: Reverse-engineered from completed implementation
**Spec**: `.specify/specs/001-dating-memories/spec.md`
**Plan**: `.specify/specs/001-dating-memories/plan.md`

---

## Implementation Strategy
- **MVP**: User Story 1 (Auth) + User Story 2 (Add Memory) + User Story 3 (Timeline)
- **Approach**: Incremental delivery, phase-by-phase
- **All phases below are COMPLETE** ✅

---

## Phase 1: Setup (Project Initialization)

- [x] T001 Create project folder structure with `css/`, `js/`, `assets/` directories
- [x] T002 Create `index.html` with HTML5 boilerplate, meta viewport, and Google Fonts link
- [x] T003 Create `auth.html` with login/signup form structure
- [x] T004 Create `css/style.css` with CSS reset, dark-mode variables, and Outfit font import
- [x] T005 Create `js/config.js` with Supabase project URL and Anon API Key
- [x] T006 Add Supabase JS SDK v2 via CDN script tag in both HTML files
- [x] T007 Add Leaflet.js CSS and JS via CDN in `index.html`
- [x] T008 Create `.specify/memory/constitution.md` with project governance principles

---

## Phase 2: Foundational (Auth & Cloud Infrastructure)

- [x] T009 [US1] Create Supabase project with `memories` table schema in `js/config.js`
- [x] T010 [US1] Enable Row-Level Security (RLS) policies on `memories` table for SELECT, INSERT, UPDATE, DELETE
- [x] T011 [US1] Create `memory-photos` storage bucket in Supabase (public access)
- [x] T012 [US1] Implement sign-up flow using `supabase.auth.signUp()` in `js/app.js`
- [x] T013 [US1] Implement login flow using `supabase.auth.signInWithPassword()` in `js/app.js`
- [x] T014 [US1] Implement session guard with `supabase.auth.getSession()` redirect logic in `js/app.js`
- [x] T015 [US1] Implement logout button with `supabase.auth.signOut()` in `js/app.js`
- [x] T016 [US1] Style `auth.html` with glassmorphism login card and glowing pink CTA button in `css/style.css`

---

## Phase 3: User Story 2 — Add a Memory

- [x] T017 [US2] Create floating action button (FAB) "+" with glowing pink animation in `index.html` and `css/style.css`
- [x] T018 [US2] Create Add Memory modal overlay with glassmorphism panel in `index.html`
- [x] T019 [US2] Implement photo upload click-to-select with live preview in `js/memory.js`
- [x] T020 [US2] Implement client-side photo compression (max 800px width) using Canvas API in `js/memory.js`
- [x] T021 [US2] Implement photo upload to Supabase Storage bucket `memory-photos/{email}/{timestamp}_{filename}` in `js/memory.js`
- [x] T022 [US2] Implement date picker input (defaults to today) in `index.html`
- [x] T023 [US2] Implement caption textarea in `index.html`
- [x] T024 [US2] Implement mood emoji selector as interactive 3D glass orbs with hover-pop animation in `css/style.css` and `js/memory.js`
- [x] T025 [US2] Implement location text input with OpenStreetMap Nominatim autocomplete dropdown in `js/memory.js`
- [x] T026 [US2] Capture GPS coordinates (lat/lng) on location selection in `js/memory.js`
- [x] T027 [US2] Style location autocomplete dropdown with glassmorphism in `css/style.css`
- [x] T028 [US2] Implement form submission: validate → upload photo → insert to `memories` table → reload timeline in `js/memory.js`
- [x] T029 [US2] Implement form reset and modal close logic in `js/memory.js`

---

## Phase 4: User Story 3 — Visual Timeline with Dashboard

- [x] T030 [US3] Implement `loadTimeline()` function to fetch memories ordered by date ascending in `js/memory.js`
- [x] T031 [US3] Render memory cards with photo, date, caption, location pill, and action buttons in `js/memory.js`
- [x] T032 [US3] Style vertical glowing timeline line using CSS `::before` pseudo-element in `css/style.css`
- [x] T033 [US3] Style anchor dots on each card using CSS `::after` pseudo-element in `css/style.css`
- [x] T034 [US3] Style location text as glowing amber glass pill badge in `css/style.css`
- [x] T035 [US3] Implement empty state display when no memories exist in `js/memory.js`
- [x] T036 [US3] Create dashboard stats panel (Total Memories + Unique Locations) in `index.html` and `js/memory.js`
- [x] T037 [US3] Style dashboard with glassmorphism, large amber stat numbers, and uppercase labels in `css/style.css`
- [x] T038 [US3] Implement instant keyword search filter (caption + location) in `js/memory.js`
- [x] T039 [US3] Implement year dropdown filter dynamically populated from data in `js/memory.js`
- [x] T040 [US3] Style control bar (search input + year select) with rounded dark glass inputs in `css/style.css`
- [x] T041 [US3] Wire `applyFilters()` to search input `oninput` and year select `onchange` events in `js/memory.js`

---

## Phase 5: User Story 4 — Edit & Delete Memories

- [x] T042 [US4] Add Edit and Delete buttons to each rendered memory card in `js/memory.js`
- [x] T043 [US4] Style Edit/Delete buttons with outline pill design in `css/style.css`
- [x] T044 [US4] Implement Delete flow: `window.confirm()` → `supabase.from('memories').delete()` → reload in `js/memory.js`
- [x] T045 [US4] Implement Edit mode: pre-fill form with existing data, switch modal title/button text in `js/memory.js`
- [x] T046 [US4] Implement partial Update: skip photo re-upload if no new file selected in `js/memory.js`
- [x] T047 [US4] Preserve GPS coordinates during edit unless user selects new location in `js/memory.js`

---

## Phase 6: Polish & Cross-Cutting Concerns (Future)

- [x] T048 Create `manifest.json` for PWA mobile install capability
- [ ] T049 Deploy to PubThis hosting platform
- [x] T050 Add responsive CSS breakpoints for mobile (≥ 320px) in `css/style.css`
- [x] T051 Add `background-clip` standard property alongside `-webkit-background-clip` for CSS compatibility in `css/style.css`
- [ ] T052 Implement "Load More" pagination if memories exceed 20 in `js/memory.js`

---

## Dependencies

```
US1 (Auth) ──► US2 (Add Memory) ──► US3 (Timeline + Dashboard)
                                         │
                                         ▼
                                    US4 (Edit/Delete)
```

- **US1** must complete first (auth required for all other features)
- **US2** and **US3** can be developed in parallel but US3 depends on data from US2
- **US4** depends on US3 (needs rendered cards to attach buttons to)

---

## Parallel Execution Opportunities

| Phase | Parallelizable Tasks |
|-------|---------------------|
| Phase 1 | T001-T008 (all independent file creation) |
| Phase 3 | T019+T024+T025 (photo, mood, location are independent UI components) |
| Phase 4 | T036+T038+T039 (dashboard, search, year filter are independent features) |
| Phase 5 | T042+T044+T045 (edit and delete are independent flows) |
