# Guildford Flames Ticket Tracker — Version 2

## Changes
- Uses the public Spektrix **instance-level** `/status?includeChildPlans=true` endpoint instead of a single seating area.
- Displays `available` directly as the public game-level availability snapshot.
- Handles failed requests without labelling a game sold out.
- Refreshes every five minutes while open.

## Important limitation
**Only Coventry Blaze on 22 November 2026 is configured.** No other instance IDs have been verified. Do not describe this as a full-season tracker yet. Add verified fixtures to `fixtures.json` using the same fields: `id`, `opponent`, `date` (ISO timestamp), `instanceId`, `bookingUrl`. The backend then checks each configured fixture automatically. Public API availability may not include every ticket category; verify against the ticketing interface.

## Updating the existing GitHub / Netlify site
Your existing repository has `flames-ticket-tracker/` as its application folder and a root `netlify.toml` pointing to it. **Replace the contents of that existing application folder** with the contents of this ZIP, preserving the folder name. Do not upload this ZIP as a ZIP file into GitHub. Keep the existing root `netlify.toml` unchanged. Commit to `main` and check the new Netlify deployment.

## Test
- Open `/api/availability` on your deployed Netlify domain and check `remaining` and `complete`.
- Open the homepage and use Refresh now.
- If the API fails, the UI will show unavailable, not zero.

## Security and reliability
Use only public endpoints, respect Spektrix/Spectrum access policies and rate limits. The public response is an availability snapshot, not confirmed ticket sales. The dashboard does not require a password by default; apply access controls separately if it must be private.
