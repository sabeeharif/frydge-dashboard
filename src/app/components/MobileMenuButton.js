// components/MobileMenuButton.js
'use client';

import { Menu } from 'lucide-react';

export default function MobileMenuButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open menu"
      className="lg:hidden z-50 flex items-center justify-center w-10 h-10 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
    >
      <Menu size={20} strokeWidth={2.25} />
    </button>
  );
}
