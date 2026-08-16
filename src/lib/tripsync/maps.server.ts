const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

export type GeocodedPlace = {
  query: string;
  lat: number | null;
  lng: number | null;
  address: string | null;
  placeId: string | null;
  name: string | null;
};

function credentials() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectorKey = process.env["GOOGLE_MAPS_API_KEY"];
  if (!lovableKey || !connectorKey) return null;
  return { lovableKey, connectorKey };
}

async function handle403(res: Response): Promise<never> {
  const details: Array<{ reason?: string }> = ((await res.json().catch(() => ({}))) as any)?.error
    ?.details ?? [];
  const reason = details.find((d) => d.reason)?.reason;
  if (reason === "API_KEY_HTTP_REFERRER_BLOCKED") {
    throw new Error(
      'Google Maps server key is referrer-restricted. Set the server key\'s application restrictions to "None" or "IP addresses".',
    );
  }
  if (reason === "API_KEY_SERVICE_BLOCKED") {
    throw new Error(
      "Google Maps server key does not allow this API. Add it to the key's allowed-APIs list.",
    );
  }
  throw new Error("Google Maps request was denied (403).");
}

/** Places API (New) text search — resolves real POIs (place id + address + coords). */
async function searchPlace(
  query: string,
  creds: { lovableKey: string; connectorKey: string },
): Promise<GeocodedPlace | null> {
  const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.lovableKey}`,
      "X-Connection-Api-Key": creds.connectorKey,
      "Content-Type": "application/json",
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
  });

  if (res.status === 403) await handle403(res);
  if (!res.ok) {
    console.error(`[maps] places searchText failed [${res.status}]: ${await res.text()}`);
    return null;
  }

  const json = (await res.json()) as {
    places?: {
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      location?: { latitude?: number; longitude?: number };
    }[];
  };
  const first = json.places?.[0];
  if (!first?.location?.latitude || !first.location.longitude) return null;
  return {
    query,
    lat: first.location.latitude,
    lng: first.location.longitude,
    address: first.formattedAddress ?? first.displayName?.text ?? null,
    placeId: first.id ?? null,
    name: first.displayName?.text ?? null,
  };
}

/** Geocoding fallback when text search finds no POI. */
async function geocodeOne(
  query: string,
  creds: { lovableKey: string; connectorKey: string },
): Promise<GeocodedPlace> {
  const res = await fetch(
    `${GATEWAY_URL}/maps/api/geocode/json?address=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${creds.lovableKey}`,
        "X-Connection-Api-Key": creds.connectorKey,
      },
    },
  );

  if (res.status === 403) await handle403(res);
  if (!res.ok) {
    console.error(`[maps] geocode failed [${res.status}]: ${await res.text()}`);
    return { query, lat: null, lng: null, address: null, placeId: null, name: null };
  }

  const json = (await res.json()) as {
    results?: {
      geometry?: { location?: { lat: number; lng: number } };
      formatted_address?: string;
      place_id?: string;
    }[];
  };
  const first = json.results?.[0];
  return {
    query,
    lat: first?.geometry?.location?.lat ?? null,
    lng: first?.geometry?.location?.lng ?? null,
    address: first?.formatted_address ?? null,
    placeId: first?.place_id ?? null,
    name: null,
  };
}

/** Resolves a small, bounded batch of place strings through the connector gateway. */
export async function geocodePlaces(queries: string[]): Promise<GeocodedPlace[]> {
  const creds = credentials();
  if (!creds) return [];

  // Bounded + deduplicated: Google Maps usage is metered.
  const unique = [...new Set(queries.map((q) => q.trim()).filter(Boolean))].slice(0, 12);
  const results: GeocodedPlace[] = [];
  for (const query of unique) {
    try {
      const hit = (await searchPlace(query, creds)) ?? (await geocodeOne(query, creds));
      results.push(hit);
    } catch (error) {
      console.error("[maps] resolve error", error);
      results.push({ query, lat: null, lng: null, address: null, placeId: null, name: null });
    }
  }
  return results;
}
