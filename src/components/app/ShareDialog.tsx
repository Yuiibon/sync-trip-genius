import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { inviteMessage, inviteUrl } from "@/lib/tripsync/invite";
import { WhatsAppShareButton } from "@/components/app/WhatsAppShareButton";

export function InviteShare({
  token,
  tripName,
  destination,
}: {
  token: string;
  tripName: string;
  destination?: string | undefined;
}) {
  const [copied, setCopied] = useState(false);
  const url = inviteUrl(token);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Invite link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — long-press the link to copy it manually.");
    }
  }

  return (
    <div className="space-y-3">
      <Input readOnly value={url} className="font-mono text-xs sm:text-sm" onFocus={(e) => e.currentTarget.select()} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" className="flex-1" onClick={copy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />} Copy Link
        </Button>
        <WhatsAppShareButton
          className="flex-1"
          label="Share Invite via WhatsApp"
          message={inviteMessage(tripName, destination)}
          url={url}
        />
      </div>
    </div>
  );
}

export function ShareDialog({
  open,
  onOpenChange,
  token,
  tripName,
  destination,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  token: string | null;
  tripName: string;
  destination?: string | undefined;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share the invitation link</DialogTitle>
          <DialogDescription>
            Drop this in the group chat. Participants answer anonymously — no login, no app.
          </DialogDescription>
        </DialogHeader>
        {token ? <InviteShare token={token} tripName={tripName} destination={destination} /> : null}
      </DialogContent>
    </Dialog>
  );
}
