import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';

export function Layout({ children, activePage, setActivePage, activePageTitle, tanggalAcuan, urgentCount }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50/60 overflow-hidden font-sans">
      {/* Sidebar Desktop */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isCollapsed={isCollapsed}
        urgentCount={urgentCount}
      />

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Navbar
          onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
          activePageTitle={activePageTitle}
          tanggalAcuan={tanggalAcuan}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-28 md:pb-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </main>

        {/* Floating Mobile Bottom Navigation */}
        <BottomNav
          activePage={activePage}
          setActivePage={setActivePage}
          urgentCount={urgentCount}
        />
      </div>
    </div>
  );
}
