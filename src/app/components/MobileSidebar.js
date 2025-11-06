'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
// import { navItems } from '../config/navigation';
import Logo from './Logo';
// import { navItems } from './navigations';
import { getNavItems } from './navigations';

export default function MobileSidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex">
      <div 
        className="flex-1 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="w-80 h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-l border-slate-700/50 shadow-2xl animate-slide-in-right">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <Logo isCollapsed={false} />
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all duration-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={onClose}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <div className="w-2 h-2 bg-white rounded-full ml-auto animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}