import { Check, Copy, RotateCcw } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const defaultMessage = inviteMessage(tripName, destination);
  const [message, setMessage] = useState(defaultMessage);
  const url = inviteUrl(token);
  const finalMessage = message.trim() || defaultMessage;

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
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="invite-message">Message to participants</Label>
          {message !== defaultMessage ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setMessage(defaultMessage)}
            >
              <RotateCcw className="size-3" /> Reset
            </Button>
          ) : null}
        </div>
        <Textarea
          id="invite-message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a personal note for your group…"
        />
        <p className="text-xs text-muted-foreground">
          This note is sent along with the invite link when you share.
        </p>
      </div>

      <Input readOnly value={url} className="font-mono text-xs sm:text-sm" onFocus={(e) => e.currentTarget.select()} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" className="flex-1" onClick={copy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />} Copy Link
        </Button>
        <WhatsAppShareButton
          className="flex-1"
          label="Share Invite via WhatsApp"
          message={finalMessage}
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
