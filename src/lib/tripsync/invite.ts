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

/** Pre-filled invite message sent by the organizer to friends. */
export function inviteMessage(tripName: string, destination?: string) {
  const where = destination?.trim() ? destination.trim() : tripName;
  return `Hey! 🌴 I'm setting up our trip to ${where} on Co-Journey! Tap the link below to pick your free dates, budget and favourite spots so the AI can build our ideal plan:`;
}

/** Pre-filled message for a finalized itinerary. */
export function itineraryMessage(destination: string) {
  return `🎉 Our group trip to ${destination} is locked in! Check out the finalized stay, daily itinerary and route map here:`;
}

export function whatsappShareUrl(url: string, tripName: string, destination?: string) {
  return buildWhatsAppUrl(inviteMessage(tripName, destination), url);
}

export function shareText(message: string, url: string) {
  return `${message}\n\nJoin here: ${url}`;
}

export function buildWhatsAppUrl(message: string, url: string) {
  return `https://wa.me/?text=${encodeURIComponent(shareText(message, url))}`;
}

/**
 * Opens WhatsApp with a pre-filled message. Uses the native share sheet on
 * mobile when available, otherwise falls back to the wa.me deep link.
 */
export async function shareToWhatsApp(message: string, url: string, title = "Co-Journey") {
  const waUrl = buildWhatsAppUrl(message, url);
  const isMobile =
    typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile && typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text: `${message}\n\nJoin here: ${url}` });
      return;
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return;
    }
  }

  const win = window.open(waUrl, "_blank", "noopener,noreferrer");
  if (!win) window.location.href = waUrl;
}
