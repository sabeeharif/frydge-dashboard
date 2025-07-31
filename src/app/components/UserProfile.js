"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../contexts/ToastContext";
// import { useToast } from "@/contexts/ToastContext";

export default function UserProfile({ isCollapsed }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const { success, error } = useToast();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      const response = await fetch("/api/logout", { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        success("Logged out successfully!");
        router.push("/");
      } else {
        error("Logout failed. Please try again.");
      }
    } catch (err) {
      console.error("Logout error:", err);
      error("Logout failed. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className={`relative group ${
      isCollapsed ? 'flex justify-center' : ''
    }`}>
      <div className={`flex items-center space-x-3 p-3 rounded-xl bg-slate-800/50 ${
        isCollapsed ? 'justify-center' : ''
      }`}>
        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">A</span>
        </div>
        {!isCollapsed && (
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Admin User</p>
            <p className="text-xs text-slate-400">admin@frydge.com</p>
          </div>
        )}
        {!isCollapsed && (
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="ml-2 p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Logout"
          >
            {isLoggingOut ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            )}
          </button>
        )}
      </div>
      
      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          <div className="bg-slate-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap shadow-lg border border-slate-700">
            <div className="font-medium">Admin User</div>
            <div className="text-slate-400">admin@frydge.com</div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="mt-1 w-full text-left text-red-400 hover:text-red-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
          {/* Tooltip arrow */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900"></div>
        </div>
      )}
    </div>
  );
}