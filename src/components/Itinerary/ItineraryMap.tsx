import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

import { GOOGLE_MAPS_BROWSER_KEY, type MapPoint } from "@/lib/tripsync/maps";

declare global {
  interface Window {
    google?: any;
    __tripsyncMapsReady?: boolean;
    __tripsyncMapsInit?: () => void;
  }
}

const TRACKING_ID = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] as
  | string
  | undefined;

function loadMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.__tripsyncMapsReady && window.google?.maps) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.getElementById("tripsync-google-maps") as HTMLScriptElement | null;
    const done = () => resolve();
    window.__tripsyncMapsInit = () => {
      window.__tripsyncMapsReady = true;
      done();
    };
    if (existing) {
      if (window.__tripsyncMapsReady) done();
      else existing.addEventListener("error", () => reject(new Error("maps failed")));
      return;
    }
    const script = document.createElement("script");
    script.id = "tripsync-google-maps";
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_BROWSER_KEY}&loading=async&callback=__tripsyncMapsInit${
      TRACKING_ID ? `&channel=${TRACKING_ID}` : ""
    }`;
    script.addEventListener("error", () => reject(new Error("maps failed")));
    document.head.appendChild(script);
  });
}

export type ItineraryMapProps = {
  points: MapPoint[];
  destination: string;
  activeIndex: number | null;
  onActiveChange?: (index: number | null) => void;
  className?: string;
};

export function ItineraryMap({
  points,
  destination,
  activeIndex,
  onActiveChange,
  className,
}: ItineraryMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const lineRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    GOOGLE_MAPS_BROWSER_KEY ? "loading" : "error",
  );

  useEffect(() => {
    if (!GOOGLE_MAPS_BROWSER_KEY) return;
    let cancelled = false;
    loadMaps()
      .then(() => !cancelled && setStatus("ready"))
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, []);

  // Place resolution happens through the authenticated server function.
  // The browser key is intentionally used only for map rendering because the
  // managed key does not authorize browser-side Geocoding or Places calls.
  const locatedPoints = points.filter(
    (point): point is MapPoint & { lat: number; lng: number } =>
      point.lat != null && point.lng != null,
  );

  useEffect(() => {
    if (status !== "ready" || !containerRef.current || !window.google?.maps) return;
    const google = window.google;

    if (!mapRef.current) {
      mapRef.current = new google.maps.Map(containerRef.current, {
        center: {
          lat: locatedPoints[0]?.lat ?? 20.5937,
          lng: locatedPoints[0]?.lng ?? 78.9629,
        },
        zoom: locatedPoints.length ? 12 : 5,
        mapTypeControl: false,
        streetViewControl: false,
        clickableIcons: false,
        styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
      });
    }

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    lineRef.current?.setMap(null);

    const bounds = new google.maps.LatLngBounds();
    locatedPoints.forEach((point, i) => {
      const position = { lat: point.lat, lng: point.lng };
      const marker = new google.maps.Marker({
        position,
        map: mapRef.current,
        label: { text: String(i + 1), color: "#ffffff", fontSize: "12px" },
        title: point.label,
      });
      marker.addListener("click", () => onActiveChange?.(points.indexOf(point)));
      markersRef.current.push(marker);
      bounds.extend(position);
    });

    if (locatedPoints.length > 1) {
      lineRef.current = new google.maps.Polyline({
        path: locatedPoints.map((p) => ({ lat: p.lat, lng: p.lng })),
        map: mapRef.current,
        strokeColor: "#0f9b8e",
        strokeOpacity: 0.8,
        strokeWeight: 3,
      });
      mapRef.current.fitBounds(bounds, 48);
    } else if (locatedPoints.length === 1) {
      mapRef.current.setCenter(bounds.getCenter());
      mapRef.current.setZoom(13);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, JSON.stringify(locatedPoints)]);

  useEffect(() => {
    if (status !== "ready" || !window.google?.maps) return;
    markersRef.current.forEach((marker, i) => {
      const point = locatedPoints[i];
      const isActive = point ? points.indexOf(point) === activeIndex : false;
      marker.setAnimation(isActive ? window.google.maps.Animation.BOUNCE : null);
      marker.setZIndex(isActive ? 999 : 1);
      if (isActive) mapRef.current?.panTo(marker.getPosition());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, status]);

  if (status === "error" || !GOOGLE_MAPS_BROWSER_KEY) {
    return (
      <div
        className={`grid place-items-center rounded-xl border border-dashed bg-muted p-6 text-center text-xs text-muted-foreground ${className ?? ""}`}
      >
        <div>
          <MapPin className="mx-auto mb-2 size-5 text-secondary" />
          <p className="font-medium text-foreground">{destination}</p>
          <p className="mt-1 max-w-xs">
            Interactive map unavailable — connect Google Maps to render live pins. Every stop still
            opens directly in Google Maps.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border ${className ?? ""}`}>
      <div ref={containerRef} className="size-full min-h-[260px]" />
      {status === "loading" && (
        <div className="absolute inset-0 grid place-items-center bg-muted text-xs text-muted-foreground">
          Loading map…
        </div>
      )}
      {status === "ready" && locatedPoints.length === 0 && (
        <div className="absolute inset-x-0 bottom-0 bg-card/90 p-2 text-center text-[11px] text-muted-foreground">
          Live pins are unavailable. Use the Google Maps buttons for these stops.
        </div>
      )}
    </div>
  );
}
