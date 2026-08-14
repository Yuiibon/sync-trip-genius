import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { sendItineraryEmail } from "@/lib/tripsync/email.functions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SendEmailModal({ tripId, tripName }: { tripId: string; tripName: string }) {
  const { user } = useAuth();
  const send = useServerFn(sendItineraryEmail);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [cc, setCc] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  function addEmail() {
    const value = draft.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (cc.includes(value) || value === user?.email) {
      setDraft("");
      return;
    }
    setCc((prev) => [...prev, value]);
    setDraft("");
  }

  async function handleSend() {
    if (!user?.email) {
      toast.error("No email on your account");
      return;
    }
    setSending(true);
    try {
      const result = await send({
        data: { tripId, recipients: [user.email, ...cc], appUrl: window.location.origin },
      });
      toast.success(`Itinerary sent to ${result.recipients.length} recipient(s)`);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the itinerary");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Mail className="size-4" /> Send to Email
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send itinerary to email</DialogTitle>
          <DialogDescription>
            We'll email the full plan for “{tripName}” — schedule, budget and maps links.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Your registered email</Label>
            <Input value={user?.email ?? ""} readOnly className="bg-muted" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cc">CC participants (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="cc"
                type="email"
                placeholder="friend@example.com"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addEmail();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addEmail}>
                <Plus className="size-4" />
              </Button>
            </div>
            {cc.length > 0 && (
              <ul className="flex flex-wrap gap-1.5 pt-1">
                {cc.map((email) => (
                  <li
                    key={email}
                    className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"
                  >
                    {email}
                    <button
                      type="button"
                      aria-label={`Remove ${email}`}
                      onClick={() => setCc((prev) => prev.filter((e) => e !== email))}
                    >
                      <X className="size-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? "Sending…" : "Send itinerary"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
