"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoginPage from "./login/page";
import { AuthService } from "./lib/auth";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = () => {
      try {
        const isLoggedIn = AuthService.isLoggedIn();
        setIsLoggedIn(isLoggedIn);
        
        if (isLoggedIn) {
          router.push("/dashboard/overview");
        }
      } catch (error) {
        console.error("Session check failed:", error);
        setIsLoggedIn(false);
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

  if (isLoggedIn) {
    return null; // Will redirect to dashboard
  }

  return (
    <div>
      <LoginPage />
    </div>
  );
}