# Guildford Flames Ticket Tracker — phase 1

## What's working
- Netlify-ready responsive dashboard.
- Netlify Function retrieves one publicly visible Spektrix area for Coventry Blaze, 22 Nov 2026.
- Refreshes every five minutes while dashboard is open.
- Clearly distinguishes partial area counts from verified game totals.
- Handles upstream failures without falsely declaring sold out.

## Deploy
1. Extract ZIP to a folder.
2. Push folder to a GitHub repository.
3. In Netlify choose **Add new project → Import an existing project** and select the repository.
4. Publish directory: `.`; functions directory: `netlify/functions`; no build command needed.
5. Deploy, then visit `/api/availability` to test the backend and the site root for the dashboard.

**Important:** Netlify drag-and-drop static deployment will NOT build the serverless function. Use Git deployment or the Netlify CLI (`netlify deploy --build --prod`).

## Expand to all fixtures
Edit `fixtures.json`. Add every upcoming fixture with its Spektrix instance ID, booking URL, and each unique area ID. Set `areasComplete: true` **only after** verifying all ticket-selling areas (including standing allocations) are covered, and that areas are not overlapping parent/child counts. Otherwise the dashboard intentionally labels the game total unknown. Fixture discovery is NOT automated in this prototype.

## Access and accuracy
The API was shown responding in a Safari Private Window, but access from Netlify servers has not been verified. The dashboard does not bypass authentication or access controls. Respect the ticket provider's terms, request limits, and any restrictions. Only count `available` as currently bookable, not tickets sold. For public deployment, consider Netlify site access controls.

## API response
`GET /api/availability` returns JSON with per-game tracked area counts, `remaining` only when `areasComplete` is true and every request succeeded, and an `updatedAt` timestamp.
