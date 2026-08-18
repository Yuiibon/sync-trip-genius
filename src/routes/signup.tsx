import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";

import { AuthLayout } from "@/routes/login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signup")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Create Your Organizer Account — Co-Journey" },
      {
        name: "description",
        content:
          "Sign up as a trip organizer on Co-Journey and start collecting anonymous group preferences with one link.",
      },
      { property: "og:title", content: "Create Your Organizer Account — Co-Journey" },
      {
        property: "og:description",
        content: "Start planning group trips that everyone actually agrees on.",
      },
    ],
  }),
  component: SignupPage,
});

const schema = z
  .object({
    name: z.string().trim().min(2, "Enter your name").max(80),
    email: z.string().trim().email("Enter a valid email").max(255),
    password: z.string().min(6, "Password must be at least 6 characters").max(72),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name: parsed.data.name },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      await supabase
        .from("profiles")
        .upsert({ id: data.session.user.id, name: parsed.data.name, email: parsed.data.email });
      toast.success("Account created!");
      navigate({ to: "/dashboard" });
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We sent you a confirmation link. Click it to activate your organizer account."
      >
        <Button asChild className="w-full" size="lg">
          <Link to="/login">Back to login</Link>
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Organizers sign up here. Your participants never need an account."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={form.name} onChange={set("name")} placeholder="Aditi Sharma" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={set("password")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm Password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={set("confirm")}
            required
          />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Create Account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-secondary hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
