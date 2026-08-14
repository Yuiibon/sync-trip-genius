/** Google Maps deep-link helpers (no API key needed for these URLs). */

export type MapPoint = {
  /** Human readable query used for search / directions links. */
  query: string;
  label: string;
  time?: string;
  lat?: number;
  lng?: number;
};

function target(point: MapPoint) {
  return point.lat != null && point.lng != null ? `${point.lat},${point.lng}` : point.query;
}

export function mapsSearchUrl(point: MapPoint) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(target(point))}`;
}

export function mapsDirectionsUrl(point: MapPoint, origin?: string) {
  const params = new URLSearchParams({ api: "1", destination: target(point) });
  if (origin) params.set("origin", origin);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Multi-waypoint route through an entire day's sequence of stops. */
export function mapsRouteUrl(points: MapPoint[]) {
  const stops = points.filter((p) => p.query.trim().length > 0);
  if (stops.length === 0) return "https://www.google.com/maps";
  if (stops.length === 1) return mapsDirectionsUrl(stops[0]!);
  const origin = target(stops[0]!);
  const destination = target(stops[stops.length - 1]!);
  const waypoints = stops.slice(1, -1).map(target);
  const params = new URLSearchParams({ api: "1", origin, destination, travelmode: "driving" });
  if (waypoints.length) params.set("waypoints", waypoints.join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Turns an itinerary day into map points anchored to the destination city. */
export function dayPoints(
  items: { time: string; text: string }[],
  destination: string,
): MapPoint[] {
  const city = destination.split(",")[0]!.trim();
  return items.map((item) => ({
    query: `${item.text}, ${city}`,
    label: item.text,
    time: item.time,
  }));
}

export const GOOGLE_MAPS_BROWSER_KEY =
  (import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"] as string | undefined) ??
  (import.meta.env["VITE_GOOGLE_MAPS_API_KEY"] as string | undefined) ??
  "";
