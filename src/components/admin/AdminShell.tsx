import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";

import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full border px-4 py-2 text-sm transition-colors ${
    isActive
      ? "border-primary/30 bg-primary/10 text-primary"
      : "border-white/10 bg-black/20 text-slate-300 hover:border-primary/20 hover:text-white"
  }`;

export const AdminShell = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => {
  const { adminProfile, signOut } = useAdminAuth();

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[28px] border border-primary/15 bg-[radial-gradient(circle_at_top_left,rgba(245,181,43,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(12,12,12,0.96))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
                Supabase-backed admin
              </Badge>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                {description}
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <div className="text-sm text-slate-300">
                <p className="font-medium text-white">{adminProfile?.full_name || adminProfile?.email}</p>
                <p className="text-slate-400">{adminProfile?.role ?? "admin"}</p>
              </div>
              <Button variant="outline" className="border-white/10 bg-black/20" onClick={() => void signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <NavLink to="/admin/leads" className={navLinkClass}>
              Leads
            </NavLink>
            <NavLink to="/admin/leads/tasks" className={navLinkClass}>
              Tasks
            </NavLink>
            <NavLink to="/admin/funnel-dashboard" className={navLinkClass}>
              Funnel dashboard
            </NavLink>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
};
