"use client";

import { useState, useEffect } from "react";
import MobileMenuButton from "./MobileMenuButton";

export default function Topbar({ isMobileOpen, setIsMobileOpen }) {
  const [sidebarWidth, setSidebarWidth] = useState(288);
  const [leftOffset, setLeftOffset] = useState("0");

  useEffect(() => {
    const handleResize = () => {
      const isLargeScreen = window.innerWidth >= 1024;
      setLeftOffset(isLargeScreen ? `${sidebarWidth}px` : "0");
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarWidth]);

  useEffect(() => {
    const handleSidebarChange = (e) => {
      const newWidth = e.detail.isCollapsed ? 80 : 288;
      setSidebarWidth(newWidth);
      if (window.innerWidth >= 1024) {
        setLeftOffset(`${newWidth}px`);
      }
    };

    window.addEventListener("sidebarToggle", handleSidebarChange);
    return () => window.removeEventListener("sidebarToggle", handleSidebarChange);
  }, []);

  return (
    <header
      className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-sm transition-all duration-300 lg:fixed lg:top-0 lg:z-20 lg:bg-white/80 lg:backdrop-blur-xl lg:border-slate-200/50"
      style={{
        left: leftOffset,
        right: "0",
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 lg:px-8 lg:py-4">
        {/* Mobile only: hamburger + brand */}
        <div className="flex items-center gap-3 min-w-0 lg:hidden">
          <MobileMenuButton onClick={() => setIsMobileOpen(true)} />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="text-lg font-bold text-slate-800 tracking-tight">
              Frydge
            </span>
          </div>
        </div>

        {/* Desktop spacer (previous layout) */}
        <div className="hidden lg:block" />

        {/* Avatar — previous desktop style; compact on mobile */}
        <div className="flex items-center space-x-4 ml-auto lg:ml-0">
          <div className="relative">
            <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 lg:w-4 lg:h-4 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
          </div>
        </div>
      </div>
    </header>
  );
}
