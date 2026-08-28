"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Spinner, EmptyState } from "@/components/ui";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && profile && profile.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-6 w-6 text-brand-500" />
      </div>
    );
  }

  if (!user || !profile || profile.role !== "admin") {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          title="Access denied"
          description="Only administrators can view this page."
        />
      </div>
    );
  }

  return <>{children}</>;
}
