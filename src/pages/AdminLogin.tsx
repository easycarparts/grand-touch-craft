import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const AdminLogin = () => {
  const location = useLocation();
  const from = useMemo(
    () => (location.state as { from?: string } | null)?.from || "/admin/funnel-dashboard",
    [location.state],
  );
  const { adminProfile, bootstrapAvailable, loading, signIn, signUp, user } = useAdminAuth();

  const [mode, setMode] = useState<"signin" | "signup">(bootstrapAvailable ? "signup" : "signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (bootstrapAvailable) {
      setMode("signup");
    }
  }, [bootstrapAvailable]);

  if (!loading && adminProfile && user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async () => {
    setErrorMessage("");
    setNoticeMessage("");
    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        if (!fullName.trim()) {
          throw new Error("Add your full name for the first admin account.");
        }

        await signUp({
          email,
          password,
          fullName,
        });

        setNoticeMessage(
          "Admin signup submitted. If email confirmation is enabled in Supabase, confirm it first, then sign in here.",
        );
      } else {
        await signIn({
          email,
          password,
        });
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Admin auth failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-[28px] border border-primary/15 bg-[radial-gradient(circle_at_top_left,rgba(245,181,43,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(12,12,12,0.96))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
          <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
            Protected admin access
          </Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Grand Touch Admin
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            Sign in to reach the funnel dashboard and the lead desk. The first authenticated user
            can bootstrap the owner account automatically.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-6">
            <div className="flex gap-3">
              <Button
                type="button"
                variant={mode === "signin" ? "default" : "outline"}
                className={mode === "signin" ? "" : "border-white/10 bg-black/20"}
                onClick={() => setMode("signin")}
              >
                Sign in
              </Button>
              <Button
                type="button"
                variant={mode === "signup" ? "default" : "outline"}
                className={mode === "signup" ? "" : "border-white/10 bg-black/20"}
                onClick={() => setMode("signup")}
                disabled={!bootstrapAvailable}
              >
                First admin
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              {mode === "signup" ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/78">Full name</label>
                  <Input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Sean"
                    className="h-12 border-white/10 bg-[rgba(255,255,255,0.06)] text-white placeholder:text-white/35"
                  />
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-sm font-medium text-white/78">Email</label>
                <Input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@grandtouchauto.ae"
                  autoComplete="email"
                  className="h-12 border-white/10 bg-[rgba(255,255,255,0.06)] text-white placeholder:text-white/35"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/78">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Your password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  className="h-12 border-white/10 bg-[rgba(255,255,255,0.06)] text-white placeholder:text-white/35"
                />
              </div>

              {errorMessage ? <p className="text-sm text-red-400">{errorMessage}</p> : null}
              {noticeMessage ? <p className="text-sm text-emerald-300">{noticeMessage}</p> : null}

              <Button className="w-full" size="lg" onClick={() => void handleSubmit()} disabled={isSubmitting}>
                {isSubmitting
                  ? "Working..."
                  : mode === "signup"
                    ? "Create the first admin account"
                    : "Sign in to admin"}
              </Button>
            </div>
          </Card>

          <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(10,10,10,0.96))] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">What this unlocks</p>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
              <p>The admin area is now designed to sit on Supabase Auth instead of local-only visibility.</p>
              <p>The first signed-in admin can bootstrap the owner role automatically.</p>
              <p>Once you are in, the funnel dashboard and the CRM lead list both read from Supabase-backed tables.</p>
              <p>
                If your hosted Supabase project requires email confirmation, create the account first,
                confirm it in email, then return here to sign in.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
