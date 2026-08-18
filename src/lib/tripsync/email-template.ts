import type { GeneratedItinerary } from "./engine";
import { formatINR } from "./constants";
import { dayPoints, mapsRouteUrl } from "./maps";

export type ItineraryEmailInput = {
  tripName: string;
  destination: string;
  dates: string | null;
  duration: number;
  participantCount: number;
  perPersonBudget: number;
  compatibilityScore: number;
  itinerary: GeneratedItinerary;
  appUrl: string;
};

const NAVY = "#111a2e";
const TEAL = "#0f9b8e";
const AMBER = "#f5a524";
const MUTED = "#5b6478";

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderItineraryEmail(input: ItineraryEmailInput) {
  const {
    tripName,
    destination,
    dates,
    duration,
    participantCount,
    perPersonBudget,
    compatibilityScore,
    itinerary,
    appUrl,
  } = input;

  const total = perPersonBudget * Math.max(1, participantCount);
  const day1 = itinerary.days[0];
  const day1Route = day1 ? mapsRouteUrl(dayPoints(day1.items, destination)) : null;

  const days = itinerary.days
    .map((day) => {
      const route = mapsRouteUrl(dayPoints(day.items, destination));
      const rows = day.items
        .map(
          (item) => `
            <tr>
              <td style="padding:6px 12px 6px 0;color:${MUTED};font-size:12px;white-space:nowrap;vertical-align:top;">${esc(item.time)}</td>
              <td style="padding:6px 0;color:${NAVY};font-size:14px;">${esc(item.text)}</td>
            </tr>`,
        )
        .join("");
      return `
        <div style="border:1px solid #e6e9f0;border-radius:14px;padding:18px;margin-bottom:14px;">
          <p style="margin:0 0 10px;font-size:15px;font-weight:700;color:${NAVY};">Day ${day.day} — ${esc(day.title)}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows}</table>
          <a href="${route}" style="display:inline-block;margin-top:12px;font-size:12px;font-weight:600;color:${TEAL};text-decoration:none;">Open Day ${day.day} route in Google Maps →</a>
        </div>`;
    })
    .join("");

  const budget = itinerary.budget_breakdown
    .map(
      (b) => `
        <tr>
          <td style="padding:6px 0;color:${MUTED};font-size:13px;">${esc(b.label)}</td>
          <td style="padding:6px 0;text-align:right;color:${NAVY};font-size:13px;font-weight:600;">${formatINR(b.amount)}</td>
        </tr>`,
    )
    .join("");

  const packing = itinerary.packing_list
    .map((p) => `<li style="margin-bottom:4px;">${esc(p)}</li>`)
    .join("");

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px 12px;background:#f5f7fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(17,26,46,0.08);">
    <tr><td style="background:${NAVY};padding:28px 28px 24px;color:#ffffff;">
      <p style="margin:0;font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:${AMBER};">Co-Journey</p>
      <h1 style="margin:8px 0 6px;font-size:26px;line-height:1.2;">${esc(tripName)}</h1>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.75);">${esc(destination)} · ${duration} days${dates ? ` · ${esc(dates)}` : ""}</p>
      <p style="margin:14px 0 0;font-size:13px;color:rgba(255,255,255,0.75);">${participantCount} travellers · ${compatibilityScore}% group match</p>
    </td></tr>

    <tr><td style="padding:24px 28px 8px;">
      <p style="margin:0 0 18px;font-size:14px;color:${MUTED};line-height:1.6;">${esc(itinerary.summary)}</p>
      <div style="border-radius:14px;background:#f2fbfa;padding:16px;margin-bottom:22px;">
        <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:${NAVY};">Budget highlights</p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          ${budget}
          <tr><td style="padding-top:8px;border-top:1px solid #d8ece9;color:${NAVY};font-size:13px;font-weight:700;">Per person</td><td style="padding-top:8px;border-top:1px solid #d8ece9;text-align:right;color:${NAVY};font-size:13px;font-weight:700;">${formatINR(perPersonBudget)}</td></tr>
          <tr><td style="color:${MUTED};font-size:13px;">Group total (${participantCount})</td><td style="text-align:right;color:${MUTED};font-size:13px;">${formatINR(total)}</td></tr>
        </table>
      </div>
      <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:${NAVY};">Day-by-day plan</p>
      ${days}
    </td></tr>

    <tr><td style="padding:0 28px 8px;">
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:${NAVY};">Packing list</p>
      <ul style="margin:0 0 20px;padding-left:18px;color:${MUTED};font-size:13px;">${packing}</ul>
    </td></tr>

    <tr><td style="padding:0 28px 32px;text-align:center;">
      <a href="${appUrl}" style="display:inline-block;background:${TEAL};color:#ffffff;font-size:14px;font-weight:700;padding:14px 26px;border-radius:12px;text-decoration:none;">Open the live trip dashboard</a>
      ${day1Route ? `<p style="margin:14px 0 0;"><a href="${day1Route}" style="color:${NAVY};font-size:13px;font-weight:600;text-decoration:none;">Open Day 1 route in Google Maps →</a></p>` : ""}
      <p style="margin:20px 0 0;font-size:11px;color:${MUTED};">Sent by Co-Journey · plan trips together, effortlessly.</p>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    `${tripName} — ${destination}`,
    `${duration} days${dates ? ` · ${dates}` : ""} · ${formatINR(perPersonBudget)} per person`,
    "",
    itinerary.summary,
    "",
    ...itinerary.days.flatMap((d) => [
      `Day ${d.day} — ${d.title}`,
      ...d.items.map((i) => `  ${i.time}: ${i.text}`),
      "",
    ]),
    appUrl,
  ].join("\n");

  return { html, text, subject: `Your Co-Journey itinerary — ${tripName} (${destination})` };
}
