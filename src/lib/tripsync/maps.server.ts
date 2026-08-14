const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

export type GeocodedPlace = {
  query: string;
  lat: number | null;
  lng: number | null;
  address: string | null;
};

function credentials() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectorKey = process.env["GOOGLE_MAPS_API_KEY"];
  if (!lovableKey || !connectorKey) return null;
  return { lovableKey, connectorKey };
}

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

  if (res.status === 403) {
    const details: Array<{ reason?: string }> = ((await res.json()) as any)?.error?.details ?? [];
    const reason = details.find((d) => d.reason)?.reason;
    if (reason === "API_KEY_HTTP_REFERRER_BLOCKED") {
      throw new Error(
        'Google Maps server key is referrer-restricted. Set the server key\'s application restrictions to "None" or "IP addresses".',
      );
    }
    if (reason === "API_KEY_SERVICE_BLOCKED") {
      throw new Error(
        "Google Maps server key does not allow the Geocoding API. Add it to the key's allowed-APIs list.",
      );
    }
    throw new Error("Google Maps request was denied (403).");
  }

  if (!res.ok) {
    const body = await res.text();
    console.error(`[maps] geocode failed [${res.status}]: ${body}`);
    throw new Error(`Geocoding failed [${res.status}]`);
  }

  const json = (await res.json()) as {
    results?: { geometry?: { location?: { lat: number; lng: number } }; formatted_address?: string }[];
  };
  const first = json.results?.[0];
  return {
    query,
    lat: first?.geometry?.location?.lat ?? null,
    lng: first?.geometry?.location?.lng ?? null,
    address: first?.formatted_address ?? null,
  };
}

/** Geocodes a small, bounded batch of place strings through the connector gateway. */
export async function geocodePlaces(queries: string[]): Promise<GeocodedPlace[]> {
  const creds = credentials();
  if (!creds) return [];

  // Bounded + deduplicated: Google Maps usage is metered.
  const unique = [...new Set(queries.map((q) => q.trim()).filter(Boolean))].slice(0, 12);
  const results: GeocodedPlace[] = [];
  for (const query of unique) {
    try {
      results.push(await geocodeOne(query, creds));
    } catch (error) {
      console.error("[maps] geocode error", error);
      results.push({ query, lat: null, lng: null, address: null });
    }
  }
  return results;
}
