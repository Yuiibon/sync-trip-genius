import { renderItineraryEmail, type ItineraryEmailInput } from "./email-template";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

export async function sendItineraryEmailViaResend(args: {
  to: string[];
  cc: string[];
  payload: ItineraryEmailInput;
}) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableKey || !resendKey) {
    throw new Error(
      "Email delivery is not configured yet. Connect Resend to enable sending itineraries.",
    );
  }

  const from = process.env["RESEND_FROM"] ?? "Co-Journey <onboarding@resend.dev>";
  const { html, text, subject } = renderItineraryEmail(args.payload);

  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: args.to,
      ...(args.cc.length ? { cc: args.cc } : {}),
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[email] Resend request failed [${res.status}]: ${body}`);
    throw new Error(`Email provider failed [${res.status}]: ${body}`);
  }

  return (await res.json()) as { id?: string };
}
