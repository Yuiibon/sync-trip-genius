import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildWhatsAppUrl, shareText } from "@/lib/tripsync/invite";

type Props = {
  message: string;
  url: string;
  label?: string;
  className?: string;
  size?: "sm" | "default" | "lg";
};

export function WhatsAppShareButton({
  message,
  url,
  label = "Share on WhatsApp",
  className,
  size = "default",
}: Props) {
  const waUrl = buildWhatsAppUrl(message, url);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    const isMobile = !!nav && /Android|iPhone|iPad|iPod/i.test(nav.userAgent);

    // Mobile: prefer the native share sheet (works inside embedded web views).
    if (isMobile && nav?.share) {
      e.preventDefault();
      nav
        .share({ title: "TripSync AI", text: shareText(message, url) })
        .catch(() => window.open(waUrl, "_blank", "noopener,noreferrer"));
      return;
    }

    // Desktop: let the anchor's native target="_blank" navigation happen.
    // If the surrounding frame blocks it, fall back to copying the message.
    setTimeout(() => {
      if (document.visibilityState === "visible" && document.hasFocus()) {
        nav?.clipboard
          ?.writeText(shareText(message, url))
          .then(() =>
            toast.info("If WhatsApp didn't open, the invite message was copied — paste it in chat."),
          )
          .catch(() => undefined);
      }
    }, 1200);
  }

  return (
    <Button
      asChild
      size={size}
      className={cn("bg-[#25D366] text-white hover:bg-[#1eb955]", className)}
    >
      <a href={waUrl} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
        <MessageCircle className="size-4" /> {label}
      </a>
    </Button>
  );
}
