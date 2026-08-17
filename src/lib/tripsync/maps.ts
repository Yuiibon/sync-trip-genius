/** Google Maps deep-link helpers (no API key needed for these URLs). */

export type MapPoint = {
  /** Human readable query used for search / directions links. */
  query: string;
  label: string;
  time?: string;
  lat?: number;
  lng?: number;
  /** Google place id, when the stop has been resolved server-side. */
  placeId?: string;
  /** Resolved formatted address, preferred over the raw query in links. */
  address?: string;
};

/**
 * Turns a free-form itinerary line ("Breakfast at Cafe Mambo, then head to Baga Beach")
 * into a short, searchable place name.
 */
export function extractPlaceName(text: string): string {
  let s = text.trim();

  // Drop a leading time marker: "09:00 – Visit ..."
  s = s.replace(/^\s*\d{1,2}[:.]\d{2}\s*(am|pm)?\s*[–—\-:]\s*/i, "");

  // Keep only the first clause — the rest is usually narrative.
  s = s.split(/\s+(?:then|and then|before|after that|followed by)\s+/i)[0]!;
  s = s.split(/[;.]|\s+[–—]\s+/)[0]!;

  // Prefer the object of a leading action verb / preposition.
  const m = s.match(
    /\b(?:at|to|in|visit|explore|tour of|check in(?:to)?|arrive at|head to|stroll through)\s+(.+)$/i,
  );
  if (m?.[1]) s = m[1];

  // Trim trailing parentheticals and filler.
  s = s.replace(/\([^)]*\)/g, "").trim();
  s = s.replace(/^(the|a|an)\s+/i, "").trim();
  s = s.replace(/[,\s]+$/, "");

  return s.length >= 3 ? s : text.trim();
}

function target(point: MapPoint) {
  if (point.lat != null && point.lng != null) return `${point.lat},${point.lng}`;
  return point.address ?? point.query;
}

export function mapsSearchUrl(point: MapPoint) {
  const params = new URLSearchParams({
    api: "1",
    query: point.address ?? point.query,
  });
  if (point.placeId) params.set("query_place_id", point.placeId);
  else if (point.lat != null && point.lng != null) params.set("query", `${point.lat},${point.lng}`);
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function mapsDirectionsUrl(point: MapPoint, origin?: string) {
  const params = new URLSearchParams({
    api: "1",
    destination: point.address ?? point.query,
  });
  if (point.placeId) params.set("destination_place_id", point.placeId);
  else params.set("destination", target(point));
  if (origin) params.set("origin", origin);
  params.set("travelmode", "driving");
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Multi-waypoint route through an entire day's sequence of stops. */
export function mapsRouteUrl(points: MapPoint[]) {
  const stops = points.filter((p) => (p.address ?? p.query).trim().length > 0);
  if (stops.length === 0) return "https://www.google.com/maps";
  if (stops.length === 1) return mapsDirectionsUrl(stops[0]!);
  const origin = target(stops[0]!);
  const destination = target(stops[stops.length - 1]!);
  const waypoints = stops.slice(1, -1).map(target);
  const params = new URLSearchParams({ api: "1", origin, destination, travelmode: "driving" });
  if (waypoints.length) params.set("waypoints", waypoints.slice(0, 9).join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Turns an itinerary day into map points anchored to the destination city. */
export function dayPoints(
  items: { time: string; text: string }[],
  destination: string,
): MapPoint[] {
  const city = destination.split(",")[0]!.trim();
  return items.map((item) => {
    const place = extractPlaceName(item.text);
    const query = place.toLowerCase().includes(city.toLowerCase()) ? place : `${place}, ${city}`;
    return { query, label: place, time: item.time };
  });
}

export const GOOGLE_MAPS_BROWSER_KEY =
  (import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"] as string | undefined) ??
  (import.meta.env["VITE_GOOGLE_MAPS_API_KEY"] as string | undefined) ??
  "";
