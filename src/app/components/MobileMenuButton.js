// components/MobileMenuButton.js
'use client';

import { Menu } from 'lucide-react';

export default function MobileMenuButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl shadow-2xl border border-slate-700/50"
    >
      <Menu size={20} />
    </button>
  );
}