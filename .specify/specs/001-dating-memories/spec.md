# Feature Specification: Dating Memories Journal
**Feature**: dating-memories-journal
**Version**: 2.0.0
**Date**: 2026-09-23
**Status**: Implemented
**Format**: Objective → Behavior → Constraints → Verification

---

## Overview

Dating Memories Journal is a private, cloud-powered web app for couples to log their dates as visual timeline memories. Each memory captures a photo, a one-sentence caption, an interactive location pin (with GPS coordinates via OpenStreetMap), and a mood emoji. Both partners access a single shared journal protected by Supabase Row-Level Security.

---

## User Story 1 (P1): Couple Account — Sign Up & Login

### Objective
Allow two partners to create and share a single joint account so both can contribute to the same memory journal.

### Behavior
- A **Sign Up** page collects: a shared email and a password
- After sign-up, the couple is redirected to their empty timeline
- A **Login** page accepts the shared email and password
- On successful login, the user is redirected to the timeline
- Session persists across browser refreshes via Supabase Auth tokens

### Constraints
- Email must be in valid format; password must be at least 6 characters (Supabase minimum)
- Duplicate email registration is rejected with a clear error message
- Passwords are never stored in plain text (managed by Supabase Auth)
- Row-Level Security ensures couples can only see their own data

### Verification
- After sign-up, refreshing the browser keeps the user logged in
- Logging in with invalid credentials shows a clear error without revealing which field is wrong
- Logging out clears the session and redirects to the login page

---

## User Story 2 (P1): Add a Memory

### Objective
Allow either partner to log a new date memory with all key details in a single, intuitive modal form.

### Behavior
- A prominent **"+" floating action button** is always visible on the timeline page
- Clicking it opens a glassmorphism modal with:
  - **Photo upload** — click-to-select with live preview; auto-compressed client-side
  - **Date picker** — defaults to today's date
  - **Caption field** — textarea for describing the moment
  - **Location picker** — text input with live OpenStreetMap Nominatim autocomplete dropdown; captures GPS coordinates (lat/lng) silently
  - **Mood emoji selector** — 8 curated mood emojis displayed as interactive 3D glass orbs (😍 🥰 😂 🌹 ✨ 🎉 ☕ 🌅)
- Clicking **"Save Memory"** validates, uploads photo to Supabase Storage, inserts record to Postgres, and reloads the timeline

### Constraints
- All fields (date, photo, caption, location, mood) are required
- Photo is compressed to max 800px width client-side before upload
- Photo is stored in Supabase Storage bucket under the user's email folder
- GPS coordinates (lat/lng) are captured when user selects a location from the autocomplete dropdown

### Verification
- Attempting to save with any field empty prevents submission
- After saving, the memory card appears on the timeline immediately without a page reload
- The saved memory shows the correct date, photo, location pill, mood emoji, and caption

---

## User Story 3 (P1): Visual Timeline with Dashboard

### Objective
Display all of the couple's memories in a beautiful, scrollable chronological timeline with live relationship stats and smart filtering.

### Behavior
- The main page renders all memories as cards anchored to a glowing vertical timeline line, sorted oldest-first
- Each **Memory Card** shows:
  - Photo (object-fit: contain with dark background)
  - Date (formatted as "Sep 14, 2026") with mood emoji prefix
  - Caption text
  - Location displayed as a glowing amber glass pill badge (📍 Location Name)
- A **Dashboard Panel** sits above the timeline showing:
  - Total Memories count
  - Total Unique Locations count
- A **Control Bar** provides:
  - Instant keyword search (filters by caption and location name)
  - Year dropdown filter (dynamically populated from data)
- If no memories exist, an illustrated empty state is shown

### Constraints
- Timeline renders with a CSS `::before` glowing vertical line connecting all cards
- Each card has a glowing anchor dot on the timeline
- Filtering is entirely client-side for instant response
- Dashboard auto-hides when no memories exist

### Verification
- All saved memories appear on the timeline in correct oldest-first order
- Typing in the search box instantly filters visible cards
- Changing the year dropdown hides cards from other years
- Stats update dynamically after add/edit/delete operations

---

## User Story 4 (P2): Edit & Delete Memories

### Objective
Allow users to modify or permanently remove any memory from the shared journal.

### Behavior
- Each memory card has an **Edit** and **Delete** button
- **Edit**: Opens the Add Memory modal pre-filled with the memory's existing data (date, caption, location, mood, photo preview). Submitting updates the record in Supabase without creating a duplicate.
- **Delete**: Shows a `window.confirm()` dialog. On confirmation, deletes the record from Supabase and reloads the timeline.

### Constraints
- Editing preserves the existing photo if no new photo is uploaded
- GPS coordinates are preserved during edit unless user selects a new location
- Delete is permanent and irreversible

### Verification
- Editing a memory and saving shows the updated content on the timeline
- Deleting a memory removes it from the timeline immediately
- Edit mode correctly switches the modal title to "Edit Memory ✏️" and button to "Update Memory"

---

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| Page load time (first timeline render) | < 2 seconds |
| Photo upload + compression | < 3 seconds on standard connection |
| Mobile responsiveness | Works on screens ≥ 320px wide |
| Browser support | Chrome, Firefox, Safari (latest 2 versions) |
| Security | Supabase RLS — zero-trust data isolation per user |

---

## Assumptions
- Supabase free tier is sufficient for the couple's usage volume
- OpenStreetMap Nominatim API remains free and does not require API keys
- Photos are stored in a public Supabase Storage bucket (RLS on database rows, not storage objects)
- Only one couple uses the app per Supabase project (single-tenant)
