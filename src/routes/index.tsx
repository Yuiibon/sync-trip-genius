import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Compass,
  Link2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

import heroImage from "@/assets/hero.jpg";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TripSync AI — Plan Together. Decide Faster. Travel Better." },
      {
        name: "description",
        content:
          "One WhatsApp link collects everyone's dates, budget and interests anonymously. TripSync AI turns them into compatible trip plans and a final itinerary.",
      },
      { property: "og:title", content: "TripSync AI — Plan Together. Decide Faster. Travel Better." },
      {
        property: "og:description",
        content:
          "Share one link, collect anonymous group preferences, and let AI build the trip plan that works for everyone.",
      },
    ],
  }),
  component: Landing,
});

const STEPS = [
  {
    icon: Compass,
    title: "Create the trip",
    text: "Destination, rough dates, days and a budget band. Takes under a minute.",
  },
  {
    icon: MessageCircle,
    title: "Share one WhatsApp link",
    text: "No app, no signup for your group. They just tap the link you drop in the chat.",
  },
  {
    icon: BarChart3,
    title: "Collect anonymous answers",
    text: "Availability, budget, interests and travel style — nobody sees who said what.",
  },
  {
    icon: Sparkles,
    title: "Get 3 compatible plans",
    text: "Each plan is scored on availability, budget and interest match, with reasons.",
  },
];

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "Availability heatmap",
    text: "See instantly which dates the largest share of your group can actually make.",
  },
  {
    icon: Wallet,
    title: "Budget reality check",
    text: "Plans are priced against the group's real budget distribution, not a guess.",
  },
  {
    icon: Users,
    title: "Anonymous group voting",
    text: "The same link lets everyone vote on the shortlisted plans. No awkwardness.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy by default",
    text: "No phone numbers, no accounts, no personal data stored for participants.",
  },
  {
    icon: Link2,
    title: "One link, everything",
    text: "Invitation, preference form and voting all live behind a single short URL.",
  },
  {
    icon: Sparkles,
    title: "AI itinerary",
    text: "Day-by-day plan, budget breakdown, packing list and tips once you finalize.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="glass-panel sticky top-0 z-40 border-b">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/signup">Create a Trip</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="bg-hero-glow relative overflow-hidden">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div className="animate-rise">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-soft">
                <Sparkles className="size-3.5 text-secondary" />
                AI group compatibility engine
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
                Plan Together.
                <br />
                Decide Faster.
                <br />
                <span className="text-gradient-brand">Travel Better.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
                TripSync AI brings everyone's availability, budget, and interests together to
                create the trip plan that actually works for the whole group.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/signup">
                    Create a Trip <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#how-it-works">How It Works</a>
                </Button>
              </div>
              <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
                {[
                  { k: "0", v: "Logins for your group" },
                  { k: "1", v: "Link to share" },
                  { k: "3", v: "Scored plans back" },
                ].map((s) => (
                  <div key={s.v}>
                    <dt className="font-display text-3xl font-bold text-foreground">{s.k}</dt>
                    <dd className="mt-1 text-xs text-muted-foreground">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-secondary/10 blur-3xl" />
              <img
                src={heroImage}
                alt="TripSync AI dashboard showing an itinerary timeline, availability heatmap and connected group members"
                width={1600}
                height={1200}
                className="w-full rounded-3xl shadow-lift"
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-24">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold sm:text-4xl">How it works</h2>
            <p className="mt-3 text-muted-foreground">
              The whole point: one link goes into the group chat, everyone answers honestly
              because it's anonymous, and the plan comes back already agreed on.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="card-surface card-interactive p-6">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-muted text-secondary">
                    <s.icon className="size-5" />
                  </span>
                  <span className="font-display text-3xl font-bold text-border">0{i + 1}</span>
                </div>
                <h3 className="mt-5 text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="border-y bg-muted/40">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold sm:text-4xl">Built for the messy part of travel</h2>
              <p className="mt-3 text-muted-foreground">
                Not the booking. The seven-day argument in the group chat before it.
              </p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="card-surface card-interactive p-6">
                  <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent-foreground">
                    <f.icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-base font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="bg-brand relative overflow-hidden rounded-3xl px-6 py-14 text-center shadow-lift sm:px-12">
            <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-secondary/25 blur-3xl" />
            <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl">
              Stop polling the group chat.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Create your trip, drop the link, and come back to three plans your friends already
              agree on.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to="/signup">
                  Create a Trip <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/login">I already have an account</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Logo />
          <p className="text-xs text-muted-foreground">
            One link → everyone responds anonymously → AI finds the best plan for the group.
          </p>
        </div>
      </footer>
    </div>
  );
}
