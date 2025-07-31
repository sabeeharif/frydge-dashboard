"use client";

import { useState, useEffect } from "react";

export default function Topbar() {
  const [sidebarWidth, setSidebarWidth] = useState(288);
  const [leftOffset, setLeftOffset] = useState("0");

  useEffect(() => {
    const handleResize = () => {
      const isLargeScreen = window.innerWidth >= 1024;
      setLeftOffset(isLargeScreen ? `${sidebarWidth}px` : "0");
    };

    handleResize(); // Set initial offset on mount

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
      className="lg:fixed lg:top-0 lg:z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm transition-all duration-300"
      style={{
        left: leftOffset,
        right: "0",
      }}
    >
      <div className="flex items-center justify-between px-6 py-4 lg:px-8">
        <div className="lg:block hidden"></div>
        <div className="flex items-center space-x-4 ml-auto lg:ml-0">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
          </div>
        </div>
      </div>
    </header>
  );
}
