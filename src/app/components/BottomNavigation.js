'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getNavItems } from './navigations';
// import { navItems } from '../config/navigation';

export default function BottomNavigation() {
  const pathname = usePathname();
  const [items, setItems] = useState([]);

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

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700/50 backdrop-blur-xl shadow-2xl z-40">
      <div className="flex items-center justify-around px-2 py-3">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-0 flex-1 ${
                isActive
                  ? 'text-blue-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className={`p-2 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-500/20 shadow-lg shadow-blue-500/25' 
                  : 'hover:bg-slate-800/50'
              }`}>
                <Icon size={18} />
              </div>
              <span className="text-xs font-medium truncate w-full text-center">
                {item.name}
              </span>
              {isActive && (
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}