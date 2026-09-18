# Feature Specifications: Dating Memories Journal

**Version**: 1.0.0  
**Date**: 2026-09-17  
**Format**: Objective → Behavior → Constraints → Verification

---

## Overview

Dating Memories Journal is a shared web app for couples to log their dates as visual timeline memories. Each memory captures a photo, a one-sentence caption, an interactive location pin, and a mood emoji. Both partners can access and contribute to a single shared journal.

---

## Feature 1: Couple Account — Sign Up & Login

### Objective
Allow two partners to create and share a single joint account so both can contribute to the same memory journal.

### Behavior
- A **Sign Up** page collects: Partner 1 name, Partner 2 name, a shared email, and a password
- After sign-up, the couple is taken directly to their empty timeline
- A **Login** page accepts the shared email and password
- On successful login, the user is redirected to the timeline
- A "Remember me" checkbox persists the session across browser refreshes

### Constraints
- Email must be in valid format; password must be at least 8 characters
- Duplicate email registration is rejected with a clear error message
- Session expires after 30 days of inactivity
- Passwords are never stored in plain text (hashed)

### Verification
- After sign-up, refreshing the browser keeps the user logged in (if "Remember me" checked)
- Logging in with invalid credentials shows "Invalid email or password" without revealing which is wrong
- Logging out clears the session and redirects to the login page

---

## Feature 2: Add a Memory

### Objective
Allow either partner to log a new date memory with all key details in a single, intuitive form.

### Behavior
- A prominent **"+ Add Memory"** button is always visible on the timeline page
- Clicking it opens a full-screen form (or modal) with:
  - **Date picker** — defaults to today's date
  - **Photo upload** — drag-and-drop or click to select; shows live preview immediately after selection
  - **Caption field** — single-sentence text input with a character counter
  - **Location picker** — an interactive Leaflet.js map; drag to place a pin; a text field shows the resolved place name
  - **Mood emoji selector** — a visual row of 8 curated mood emojis to tap/click (e.g., 😍 🥰 😊 🎉 🥂 💕 😂 🌟)
- Clicking **"Save Memory"** validates all fields and saves the memory
- After saving, the form closes and the new memory appears at the top of the timeline with a brief highlight animation

### Constraints
- All 5 fields (date, photo, caption, location, mood emoji) are **required**
- Caption maximum: 280 characters
- Future dates are not accepted; an error is shown inline
- Photo must be an image file (jpg, png, webp, gif); max size 10MB
- Photo is compressed to max 2MB client-side before saving
- Only one photo per memory (v1)

### Verification
- Attempting to save with any field empty highlights that field in red with a clear error message
- Uploading a non-image file shows: "Please upload an image file (JPG, PNG, WEBP)"
- After saving, the memory card appears on the timeline immediately without a page reload
- The saved memory shows the correct date, photo thumbnail, location name, mood emoji, and caption

---

## Feature 3: Visual Timeline

### Objective
Display all of the couple's memories in a beautiful, scrollable chronological timeline that feels like a visual love story.

### Behavior
- The main page renders all memories as cards, sorted newest-first
- Each **Memory Card** shows:
  - Photo thumbnail (cropped to a consistent aspect ratio)
  - Date (formatted as "September 14, 2026")
  - Location pin icon + place name
  - Mood emoji (large, prominent)
  - Caption preview (truncated at 100 characters with "..." if longer)
- Clicking a card opens the **Memory Detail View** (Feature 4)
- If the couple has no memories yet, an illustrated empty state is shown: "No memories yet — add your first date! 💕"

### Constraints
- Timeline must render first 10 memory cards in under 2 seconds
- If more than 20 memories exist, a "Load more" button appears at the bottom
- Timeline is responsive: cards stack in a single column on mobile, 2 columns on desktop
- Timeline must be accessible (keyboard-navigable cards, alt text on photos)

### Verification
- All saved memories appear on the timeline in correct newest-first order
- Deleting a memory from the detail view removes it from the timeline immediately
- On a fresh login, all previously saved memories are restored correctly
- Empty state is shown when no memories exist

---

## Feature 4: Memory Detail View

### Objective
Allow users to view the full details of any memory and optionally edit or delete it.

### Behavior
- Clicking a memory card navigates to a full-screen detail view
- The detail view shows:
  - Full-resolution photo (fills the top half; tap to expand to true full-screen)
  - Date in large, elegant typography
  - Mood emoji (large)
  - Full caption (no truncation)
  - Leaflet.js mini-map showing the exact pin location with the place name
- An **Edit** button (pencil icon) opens the Add Memory form pre-filled with current values
- A **Delete** button (trash icon) shows a confirmation dialog: "Delete this memory? This can't be undone."
- A **Back** button returns to the timeline, restoring the previous scroll position

### Constraints
- Back navigation must return to the exact scroll position on the timeline (no jumping to top)
- The delete confirmation must require an explicit "Yes, delete" click — not just one tap
- Editing and saving updates the memory in place without changing its position on the timeline (sort order is by original date, not edit date)

### Verification
- All fields saved during memory creation are correctly displayed in the detail view
- Deleting a memory removes it from the timeline and the detail view is closed
- Editing a memory and saving shows the updated content on both the detail view and the timeline card
- Back button returns to the timeline at the correct scroll position

---

## Feature 5: Location Pin (Map Integration)

### Objective
Allow users to mark the exact location of their date on an interactive map so it can be displayed on memory cards and the detail view.

### Behavior
- In the Add Memory form, a Leaflet.js map is embedded showing the user's approximate current location (via browser Geolocation API) or a default city center if permission is denied
- The user drags or taps the map to place a pin at the date location
- Below the map, a text field shows the resolved place name (e.g., "Millennium Park, Chicago") — editable by the user if the auto-resolved name is wrong or unavailable
- On memory cards: location is shown as a 📍 icon + place name text
- On the detail view: a small non-interactive Leaflet map shows the pin location

### Constraints
- If Geolocation is denied, the map defaults to a neutral starting view (e.g., center of the US)
- The place name text field is always editable — auto-resolution is a convenience, not a requirement
- Coordinates (lat/lng) are stored alongside the place name for map display
- Map tiles load asynchronously and never block saving the memory

### Verification
- Placing a pin on the map stores the correct coordinates
- The place name appears on the memory card after saving
- The detail view map pin is in the correct location matching the saved coordinates
- If no geolocation is available, the map still loads and functions correctly

---

## Non-Functional Requirements

| Requirement | Target |
|---|---|
| Page load time (first timeline render) | < 2 seconds |
| Photo upload + preview | < 1 second on local storage |
| Mobile responsiveness | Works on screens ≥ 320px wide |
| Browser support | Chrome, Firefox, Safari (latest 2 versions) |
| Accessibility | WCAG 2.1 AA for core flows |
