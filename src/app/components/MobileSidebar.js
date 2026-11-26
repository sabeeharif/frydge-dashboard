'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import Logo from './Logo';
import UserProfile from './UserProfile';
import { getNavItems } from './navigations';
import { useEffect, useState } from 'react';

export default function MobileSidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const [items, setItems] = useState([]);

  // Always call hooks (never after an early return)
  useEffect(() => {
    const load = () => setItems(getNavItems());
    load();
    const onStorage = (e) => {
      if (e.key === 'frydge-auth-token' || e.key === 'frydge-user-data') {
        load();
      }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('auth:updated', load);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('auth:updated', load);
    };
  }, []);

  // Lock page scroll while drawer is open; close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div
      className={`lg:hidden fixed inset-0 z-50 ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Drawer — opens from left (hamburger side) */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`absolute left-0 top-0 flex h-full w-[min(20rem,85vw)] flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-700/50 shrink-0">
          <Logo isCollapsed={false} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-1.5">
          {items?.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={onClose}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon size={20} className="shrink-0" />
                <span className="font-medium truncate">{item.name}</span>
                {isActive && (
                  <div className="w-2 h-2 bg-white rounded-full ml-auto shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-700/50 shrink-0">
          <UserProfile isCollapsed={false} />
        </div>
      </aside>
    </div>
  );
}
