// components/NavigationWrapper.js
'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import MobileSidebar from './MobileSidebar';
import BottomNavigation from './BottomNavigation';
import MobileMenuButton from './MobileMenuButton';

export default function NavigationWrapper() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Listen for sidebar toggle events
    const handleSidebarToggle = (e) => {
      setSidebarCollapsed(e.detail.isCollapsed);
      
      // Update main content margin
      const mainElement = document.querySelector('main');
      if (mainElement && window.innerWidth >= 1024) {
        mainElement.style.marginLeft = e.detail.isCollapsed ? '80px' : '288px';
      }
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle);
    
    // Handle window resize
    const handleResize = () => {
      const mainElement = document.querySelector('main');
      if (mainElement) {
        if (window.innerWidth >= 1024) {
          mainElement.style.marginLeft = sidebarCollapsed ? '80px' : '288px';
        } else {
          mainElement.style.marginLeft = '0';
        }
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle);
      window.removeEventListener('resize', handleResize);
    };
  }, [sidebarCollapsed]);

  return (
    <>
      <Sidebar />
      <MobileMenuButton onClick={() => setIsMobileOpen(true)} />
      <MobileSidebar 
        isOpen={isMobileOpen} 
        onClose={() => setIsMobileOpen(false)} 
      />
      <BottomNavigation />
    </>
  );
}