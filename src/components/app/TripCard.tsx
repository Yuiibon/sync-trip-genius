import { Link } from "@tanstack/react-router";
import { CalendarDays, Loader2, MapPin, Share2, Trash2, Users } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TRIP_STATUS_LABEL, formatINR } from "@/lib/tripsync/constants";
import type { Trip } from "@/lib/tripsync/queries";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "finalized"
      ? "bg-success/12 text-success border-success/25"
      : status === "plans_ready"
        ? "bg-secondary/15 text-secondary border-secondary/30"
        : status === "analyzing"
          ? "bg-accent-soft text-accent-foreground border-accent/40"
          : "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", tone)}>
      {TRIP_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

export function TripCard({
  trip,
  responseCount,
  onShare,
  onDelete,
}: {
  trip: Trip;
  responseCount: number;
  onShare?: (trip: Trip) => void;
  onDelete?: (trip: Trip) => Promise<void> | void;
}) {
  const [deleting, setDeleting] = useState(false);
  const pct = trip.participant_count
    ? Math.min(100, Math.round((responseCount / trip.participant_count) * 100))
    : 0;

  async function confirmDelete() {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(trip);
    } finally {
      setDeleting(false);
    }
  }


  return (
    <div className="card-surface card-interactive flex flex-col p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{trip.trip_name}</h3>
          <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" /> {trip.destination}
          </p>
        </div>
        <StatusBadge status={trip.status} />
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5" /> {trip.duration} days
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="size-3.5" /> {trip.participant_count} participants
        </span>
        <span>
          {formatINR(trip.budget_min)} – {formatINR(trip.budget_max)}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-muted-foreground">Responses</span>
          <span>
            {responseCount}/{trip.participant_count}
          </span>
        </div>
        <Progress value={pct} className="mt-2 h-2" />
      </div>

      <div className="mt-5 flex gap-2">
        <Button asChild size="sm" className="flex-1">
          <Link to="/trips/$id" params={{ id: trip.id }}>
            View Trip
          </Link>
        </Button>
        {onShare ? (
          <Button size="sm" variant="outline" onClick={() => onShare(trip)}>
            <Share2 className="size-4" /> Share Link
          </Button>
        ) : null}
        {onDelete ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                aria-label={`Delete ${trip.trip_name}`}
                disabled={deleting}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete “{trip.trip_name}”?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the trip along with its responses, plans, votes and
                  itinerary. The invite link will stop working.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete trip
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>
    </div>
  );
}
