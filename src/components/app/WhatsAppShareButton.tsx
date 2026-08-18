import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { shareToWhatsApp } from "@/lib/tripsync/invite";

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
  return (
    <Button
      type="button"
      size={size}
      className={cn("bg-[#25D366] text-white hover:bg-[#1eb955]", className)}
      onClick={() => void shareToWhatsApp(message, url)}
    >
      <MessageCircle className="size-4" /> {label}
    </Button>
  );
}
