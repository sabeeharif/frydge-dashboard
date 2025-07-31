"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/contexts/ToastContext";
import RecentActivity from "@/app/components/RecentActivity";
import StatsGrid from "@/app/components/StatsGrid";
import WelcomeSection from "@/app/components/WelcomeSection";

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const { error } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/session");
        const data = await response.json();

        if (!data.isLoggedIn) {
          error("Session expired. Please login again.");
          router.push("/");
        } else {
          setIsAuthenticated(true);
        }
      } catch (err) {
        error("Failed to verify session.");
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [router]);

 

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="p-8 space-y-8">
      <WelcomeSection />
      <StatsGrid />
      <RecentActivity />
    </div>
  );
}
