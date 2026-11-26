// app/dashboard/layout.js
"use client"
import { useState } from 'react';
import NavigationWrapper from '../components/NavigationWrapper';
import Topbar from '../components/Topbar';

export default function DashboardLayout({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <NavigationWrapper isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <Topbar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main Content - with proper spacing for fixed sidebar and topbar on desktop */}
      <main className="lg:ml-72 lg:pt-20 p-4 lg:p-8 pb-20 lg:pb-8 min-h-screen min-w-0 overflow-x-hidden">
        <div className="mx-auto w-full min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
}
