# Fix destination-locked plans and Google Maps

## Changes
- Lock all three generated plans to the trip’s selected destination, while varying only style, activities, pacing, and budget.
- Detect and replace previously saved plans whose destination differs from the trip destination, so old Goa/Pondicherry results do not remain on an Ooty trip.
- Resolve itinerary stops through authenticated Google Places requests and use official place IDs, addresses, and coordinates for markers and links.
- Remove browser-side geocoding that the managed map key cannot authorize; keep the browser key only for rendering the interactive map.
- Make individual search, directions, and full-day route links work without an API key and degrade safely when a stop cannot be resolved.
- Document the local VS Code setup for a referrer-restricted browser map key.

## Verification
- Check an Ooty trip returns three Ooty-only plans and creates an Ooty itinerary.
- Open the itinerary in the browser, switch days, verify markers/routes, and inspect all Google Maps links.
- Check desktop and mobile layouts and confirm there are no build or runtime errors.

## Technical details
- Google Places remains server-side and bounded to 12 deduplicated stops per day.
- Maps JavaScript loads asynchronously with the configured browser key; local development uses `VITE_GOOGLE_MAPS_API_KEY` in `.env.local`.
- Existing mismatched generated data is repaired using the current trip destination rather than relying only on new trip creation.
