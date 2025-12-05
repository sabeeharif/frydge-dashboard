// components/Sidebar.js
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
// import { navItems } from '../config/navigation';
import UserProfile from './UserProfile';
import Logo from './Logo';
import { getNavItems } from './navigations';

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [items, setItems] = useState([]);

  // Read nav items from localStorage on mount and when storage changes
  useEffect(() => {
    const load = () => setItems(getNavItems());
    load();
    const onStorage = (e) => {
      if (e.key === 'frydge-auth-token' || e.key === 'frydge-user-data') {
        load();
      }
    };
    window.addEventListener('storage', onStorage);
    // Also listen for custom events from AuthService if any in future
    window.addEventListener('auth:updated', load);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('auth:updated', load);
    };
  }, []);

  return (
    <aside className={`hidden lg:flex flex-col fixed left-0 top-0 z-30 transition-all duration-300 ease-in-out ${
      isCollapsed ? 'w-20' : 'w-72'
    } h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 shadow-2xl`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
        <Logo isCollapsed={isCollapsed} />
        
        <button
          onClick={() => {
            setIsCollapsed(!isCollapsed);
            // Dispatch custom event for topbar to listen
            window.dispatchEvent(new CustomEvent('sidebarToggle', { 
              detail: { isCollapsed: !isCollapsed } 
            }));
          }}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-blue-900/50 hover:to-purple-900/50'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.name : ''}
            >
              <Icon size={20} className={`${isActive ? 'text-white' : ''} transition-colors duration-200`} />
              {!isCollapsed && (
                <span className="font-medium transition-all duration-200">
                  {item.name}
                </span>
              )}
              {isActive && !isCollapsed && (
                <div className="w-2 h-2 bg-white rounded-full ml-auto animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50">
        <UserProfile isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
}
