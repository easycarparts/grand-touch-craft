import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAdminAuth } from "@/components/admin/AdminAuthProvider";

export const RequireAdmin = ({ children }: { children: ReactElement }) => {
  const location = useLocation();
  const { loading, user, adminProfile } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-slate-300">
        Loading admin access...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (!adminProfile?.is_active) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname, unauthorized: true }} />;
  }

  return children;
};
