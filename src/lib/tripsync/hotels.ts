/**
 * Deterministic stay recommendations per plan.
 *
 * Hotels are derived from the plan's destination and budget tier so the same
 * plan always renders the same options (no random flicker between renders).
 */

export type HotelOption = {
  id: string;
  name: string;
  city: string;
  photo: string;
  rating: number;
  reviews: number;
  /** Per person, per night. */
  pricePerNight: number;
  amenities: string[];
  tier: "value" | "comfort" | "premium";
};

const PHOTOS = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=70",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=70",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=70",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=70",
  "https://images.unsplash.com/photo-1444201983204-c43cbd584d93?auto=format&fit=crop&w=800&q=70",
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=70",
];

const TIERS = [
  {
    tier: "value" as const,
    suffix: "Backpackers Hostel",
    share: 0.18,
    rating: 4.2,
    reviews: 640,
    amenities: ["Free Wi-Fi", "Breakfast Included", "Group Dorms"],
  },
  {
    tier: "comfort" as const,
    suffix: "Grand Stay Hotel",
    share: 0.3,
    rating: 4.6,
    reviews: 1820,
    amenities: ["Free Wi-Fi", "Pool", "Breakfast Included", "AC Rooms"],
  },
  {
    tier: "premium" as const,
    suffix: "Boutique Resort",
    share: 0.44,
    rating: 4.8,
    reviews: 940,
    amenities: ["Free Wi-Fi", "Pool", "Spa", "Airport Pickup"],
  },
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** 3 stays sized to the plan's per-person budget for the whole trip. */
export function hotelOptions(plan: {
  id?: string;
  plan_name: string;
  destination: string;
  duration: number;
  estimated_budget: number;
}): HotelOption[] {
  const city = plan.destination.split(",")[0]!.trim();
  const nights = Math.max(1, plan.duration - 1);
  const seed = hash(`${plan.id ?? ""}${plan.plan_name}${plan.destination}`);

  return TIERS.map((t, i) => {
    const perNight = Math.max(
      450,
      Math.round(((plan.estimated_budget * t.share) / nights) / 50) * 50,
    );
    return {
      id: `${t.tier}-${i}`,
      name: `${city} ${t.suffix}`,
      city: plan.destination,
      photo: PHOTOS[(seed + i) % PHOTOS.length]!,
      rating: t.rating,
      reviews: t.reviews + ((seed >> (i + 1)) % 400),
      pricePerNight: perNight,
      amenities: t.amenities,
      tier: t.tier,
    };
  });
}

/** Trip cost per person once a stay is chosen (base plan already includes ~34% stay). */
export function planTotalWithHotel(
  plan: { duration: number; estimated_budget: number },
  hotel: HotelOption | null,
) {
  if (!hotel) return plan.estimated_budget;
  const nights = Math.max(1, plan.duration - 1);
  const baseStay = plan.estimated_budget * 0.34;
  return Math.max(0, Math.round(plan.estimated_budget - baseStay + hotel.pricePerNight * nights));
}
