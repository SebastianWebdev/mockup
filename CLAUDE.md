# Prosecco Admin – Creative Management Panel (Mockup)

## What is this?

This is an **interactive UI mockup** (not a production app) for the Prosecco internal admin panel. Prosecco is our internal service for managing ad creatives (video files) that get uploaded to multiple advertising platforms.

The mockup was built to explore and validate a **new design direction** before implementing it in the real codebase. It runs as a standalone Vite + React app with no backend — all data is generated client-side with simulated server delays.

## Context: What problem does Prosecco solve?

Our ad operations team uploads ~8,000 video creatives per week across multiple platforms (Google, Facebook, TikTok, AppLovin, Apple). Each platform has multiple **account names** (e.g. "Google - US Main", "FB - EU Lookalike"), and each creative gets uploaded to each account independently. The panel lets the team monitor upload statuses, retry failures, and filter through the massive volume of creatives.

## Design decisions captured in this mockup

### Old design (being replaced)
- Left sidebar with platform list (Google, Facebook, TikTok, etc.)
- Selecting a platform showed uploads for that platform only
- Creative was not the central entity — platform was

### New design (this mockup)
- **Creative-centric grid layout** — each card represents one video file
- Platforms and their account names are shown **inside each card** as collapsible sections
- Upload status is tracked **per account name**, not per platform
- This gives a holistic view of each creative's upload state across all platforms at once

### Key UI elements

- **Card grid** with video preview, metadata, and platform status breakdown
- **Platform → Account Name hierarchy** — each platform collapses to reveal per-account upload statuses
- **Upload statuses**: Uploaded, Uploading, Not Uploaded (queued), Upload Error, Removing, Partially Deleted, Delete Error, Skipped
- **Skipped** status is grey (not red) — indicates the file doesn't meet platform requirements (e.g. wrong resolution), with expandable reason text
- **Error actions**: Retry on errors, Cancel on removing
- **Links per platform** — optional external link to the ad platform's library
- **Video Details** — collapsible section with campaigns, impressions, clicks, CTR (secondary info)

### Filters (simulating server-side)
- **Status** — filter by upload state across accounts
- **Account Name** — custom dropdown grouped by platform
- **Ratio** — auto-detected from file metadata (9:16, 16:9, 1:1, 4:5)
- **Created After** — date picker
- **Search** — debounced text search (350ms)

All filters simulate server-side behavior: changing any filter resets the list, shows a loading state, and fetches fresh results. This matches the real implementation plan where the backend returns pre-filtered paginated data.

### Infinite scroll
- IntersectionObserver-based lazy loading
- 24 items per batch with simulated network delay
- Header shows "Showing X of Y creatives" with server-reported total
- Stale response protection via fetchId ref

### App selector
- Top-right dropdown to switch between apps (games we run ads for)
- Changing app reloads all data

## Tech stack (mockup only)

- React 19 + Vite
- Zero dependencies beyond react/react-dom
- All styling is inline (no CSS framework) — intentional for mockup portability
- Custom dropdown components (no native `<select>`)

## How to run

```bash
npm install
npm run dev
```

Opens at `localhost:3000`.

## What this is NOT

- This is not production code — no real API, no auth, no error boundaries
- Data is randomly generated on each load
- The simulated "server" is just a setTimeout + filter on a generated pool
- Inline styles are for mockup convenience — real implementation will use our existing MUI-based component library
