"use client";

import { useAuth } from "./AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = pathname.startsWith("/login") || pathname.startsWith("/register");

  useEffect(() => {
    if (!loading) {
      if (!user && !isPublicRoute) {
        router.push("/login");
      } else if (user && (pathname === "/" || isPublicRoute)) {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router, pathname, isPublicRoute]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600"></div>
      </div>
    );
  }

  // Prevent flashing content of protected routes before redirect
  if (!user && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}
