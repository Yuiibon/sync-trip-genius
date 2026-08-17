import { ExternalLink, Navigation, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/tripsync/constants";
import { directionsUrlFor, searchUrlFor } from "@/lib/tripsync/maps";
import type { HotelOption } from "@/lib/tripsync/hotels";
import { cn } from "@/lib/utils";

export function HotelPicker({
  hotels,
  selectedId,
  onSelect,
  nights,
  readOnly = false,
}: {
  hotels: HotelOption[];
  selectedId: string | null;
  onSelect?: (hotel: HotelOption) => void;
  nights: number;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Select stay</h4>
        <span className="text-[11px] text-muted-foreground">{nights} nights</span>
      </div>
      <div className="flex snap-x gap-3 overflow-x-auto pb-1">
        {hotels.map((hotel) => {
          const active = hotel.id === selectedId;
          return (
            <article
              key={hotel.id}
              className={cn(
                "w-56 shrink-0 snap-start overflow-hidden rounded-xl border bg-card transition-colors",
                active ? "border-secondary ring-2 ring-secondary/40" : "hover:border-muted-foreground/30",
              )}
            >
              <div className="relative h-24 w-full overflow-hidden bg-muted">
                <img
                  src={hotel.photo}
                  alt={`${hotel.name} in ${hotel.city}`}
                  loading="lazy"
                  className="size-full object-cover"
                />
                {active ? (
                  <span className="absolute left-2 top-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                    Active Stay
                  </span>
                ) : null}
              </div>
              <div className="space-y-2 p-3">
                <p className="truncate text-sm font-semibold">{hotel.name}</p>
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Star className="size-3 fill-current text-secondary" />
                  {hotel.rating.toFixed(1)} · {hotel.reviews.toLocaleString("en-IN")} reviews
                </p>
                <p className="text-sm font-medium">
                  {formatINR(hotel.pricePerNight)}
                  <span className="text-[11px] font-normal text-muted-foreground"> /night/person</span>
                </p>
                <div className="flex flex-wrap gap-1">
                  {hotel.amenities.slice(0, 3).map((a) => (
                    <span key={a} className="rounded-full bg-muted px-2 py-0.5 text-[10px]">
                      {a}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-[11px]">
                    <a
                      href={searchUrlFor(hotel.name, hotel.city)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="size-3" /> Maps
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-[11px]">
                    <a
                      href={directionsUrlFor(hotel.name, hotel.city)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Navigation className="size-3" /> Directions
                    </a>
                  </Button>
                </div>
                {readOnly ? null : (
                  <Button
                    size="sm"
                    variant={active ? "secondary" : "outline"}
                    className="w-full text-[11px]"
                    onClick={() => onSelect?.(hotel)}
                  >
                    {active ? "Selected stay" : "Select hotel"}
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
