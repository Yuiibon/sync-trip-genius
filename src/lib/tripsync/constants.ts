export const INTERESTS = [
  { id: "beach", label: "Beach", emoji: "🏖" },
  { id: "trekking", label: "Trekking", emoji: "🥾" },
  { id: "adventure", label: "Adventure", emoji: "🏄" },
  { id: "food", label: "Food", emoji: "🍜" },
  { id: "shopping", label: "Shopping", emoji: "🛍" },
  { id: "history", label: "History", emoji: "🏛" },
  { id: "nature", label: "Nature", emoji: "🌿" },
  { id: "nightlife", label: "Nightlife", emoji: "🎵" },
  { id: "themeparks", label: "Theme Parks", emoji: "🎢" },
  { id: "photography", label: "Photography", emoji: "📸" },
  { id: "camping", label: "Camping", emoji: "🏕" },
  { id: "water", label: "Water Activities", emoji: "🏊" },
] as const;

export const BUDGET_RANGES = [
  { id: "under5", label: "Under ₹5,000", min: 3000, max: 5000 },
  { id: "5to8", label: "₹5,000 – ₹8,000", min: 5000, max: 8000 },
  { id: "8to12", label: "₹8,000 – ₹12,000", min: 8000, max: 12000 },
  { id: "12to20", label: "₹12,000 – ₹20,000", min: 12000, max: 20000 },
  { id: "20plus", label: "₹20,000+", min: 20000, max: 30000 },
] as const;

export const TRAVEL_STYLES = ["Budget", "Moderate", "Comfortable", "Luxury"] as const;
export const ACCOMMODATIONS = [
  "Hostel",
  "Budget Hotel",
  "Hotel",
  "Resort",
  "No Preference",
] as const;
export const TRANSPORTATION = ["Bus", "Train", "Flight", "Car", "No Preference"] as const;

export const TRIP_STATUS_LABEL: Record<string, string> = {
  collecting: "Collecting Responses",
  analyzing: "Analyzing",
  plans_ready: "Plans Ready",
  finalized: "Finalized",
};

export function interestLabel(id: string) {
  return INTERESTS.find((i) => i.id === id)?.label ?? id;
}

export function interestEmoji(id: string) {
  return INTERESTS.find((i) => i.id === id)?.emoji ?? "✨";
}

export function budgetLabel(id: string) {
  return BUDGET_RANGES.find((b) => b.id === id)?.label ?? id;
}

export function formatINR(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}
