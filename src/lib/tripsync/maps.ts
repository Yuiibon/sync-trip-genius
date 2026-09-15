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
  s = s.split(/\s+(?:then|and then|before|after that|followed by)\s+/i)[0] ?? s;
  s = s.split(/[;.]|\s+[–—]\s+/)[0] ?? s;

  // Prefer explicit venue phrases without matching fragments such as the
  // "in" inside "check-in".
  s = s.replace(
    /^(?:visit|explore|tour of|check in(?:to)?|arrive (?:at|in)|head to|stroll through)\s+/i,
    "",
  );
  const venue = s.match(/\b(?:at|to)\s+(.+)$/i);
  if (venue?.[1]) s = venue[1];

  // Trim trailing parentheticals and filler.
  s = s.replace(/\([^)]*\)/g, "").trim();
  s = s.replace(/^(the|a|an)\s+/i, "").trim();
  s = s.replace(/[,\s]+$/, "");

  return s.length >= 3 ? s : text.trim();
}

function target(point: MapPoint) {
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
  params.set("dir_action", "navigate");
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Multi-waypoint route through an entire day's sequence of stops. */
export function mapsRouteUrl(points: MapPoint[]) {
  const stops = points.filter((p) => (p.address ?? p.query).trim().length > 0);
  if (stops.length === 0) return "https://www.google.com/maps";
  if (stops.length === 1) return mapsDirectionsUrl(stops[0]!);

  const start = stops[0]!;
  const end = stops[stops.length - 1]!;
  const mids = stops.slice(1, -1).slice(0, 9);

  const params = new URLSearchParams({
    api: "1",
    origin: target(start),
    destination: target(end),
    travelmode: "driving",
    dir_action: "navigate",
  });

  if (start.placeId) params.set("origin_place_id", start.placeId);
  if (end.placeId) params.set("destination_place_id", end.placeId);

  if (mids.length > 0) {
    params.set("waypoints", mids.map(target).join("|"));
    if (mids.every((point) => Boolean(point.placeId))) {
      params.set("waypoint_place_ids", mids.map((point) => point.placeId).join("|"));
    }
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Turns an itinerary day into map points anchored to the destination city. */
export function dayPoints(
  items: { time: string; text: string }[],
  destination: string,
): MapPoint[] {
  const city = (destination || "").split(",")[0]?.trim() || "";
  return items.map((item) => {
    const place = extractPlaceName(item.text);
    const genericStop =
      /\b(arriv|check[ -]?in|freshen|breakfast|lunch|dinner|briefing|checkout|return journey|group photo|souvenir|stay)\b/i.test(
        place,
      );
    const searchablePlace = genericStop ? city : place;
    const query = city && !searchablePlace.toLowerCase().includes(city.toLowerCase())
      ? `${searchablePlace}, ${city}`
      : searchablePlace;
    return { query, label: place, time: item.time };
  });
}

export const GOOGLE_MAPS_BROWSER_KEY =
  (import.meta.env["VITE_GOOGLE_MAPS_API_KEY"] as string | undefined) ??
  (import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"] as string | undefined) ??
  "";
