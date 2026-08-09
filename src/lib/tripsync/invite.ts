const KEY = "tripsync_anon_token";

/**
 * Stable per-browser anonymous identifier. Used only to stop duplicate
 * submissions/votes — it is never linked to a person.
 */
export function getAnonToken(): string {
  if (typeof window === "undefined") return "";
  let token = window.localStorage.getItem(KEY);
  if (!token) {
    token = `anon_${crypto.randomUUID()}`;
    window.localStorage.setItem(KEY, token);
  }
  return token;
}

export function makeInviteToken(destination: string) {
  const prefix = (destination.replace(/[^a-zA-Z]/g, "").slice(0, 3) || "TRP").toUpperCase();
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rest = "";
  for (let i = 0; i < 5; i++) rest += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${prefix}${rest}`;
}

export function inviteUrl(token: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/join/${token}`;
}

export function whatsappShareUrl(url: string, tripName: string) {
  const message = `Hey! We're planning "${tripName}" together. Please fill out your availability, budget and interests using this link:\n\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
