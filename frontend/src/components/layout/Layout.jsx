import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export function Layout({
  children,
  activePage,
  setActivePage,
  activePageTitle,
  tanggalAcuan,
  urgentCount,
  logoUrl,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-[100dvh] w-full max-w-full bg-[#eef1f9] overflow-hidden font-sans relative">
      {/* Latar atmosfer halus terinspirasi desain Orely */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,rgba(199,210,254,0.4),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(191,219,254,0.35),transparent_55%)]"
      />
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isCollapsed={isCollapsed}
        urgentCount={urgentCount}
        logoUrl={logoUrl}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 w-full max-w-full">
        <Header
          onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
          onSelectPage={setActivePage}
          activePageTitle={activePageTitle}
          tanggalAcuan={tanggalAcuan}
          urgentCount={urgentCount}
          logoUrl={logoUrl}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full bg-[#ebf0fa] shadow-[inset_3px_3px_12px_rgba(15,23,42,0.04)] px-3 sm:px-4 lg:px-5 pt-3 pb-20 md:pb-5">
          <div className="w-full max-w-[1600px] mx-auto space-y-3">
            {children}
          </div>
        </main>

        <BottomNav
          activePage={activePage}
          setActivePage={setActivePage}
          urgentCount={urgentCount}
        />
      </div>
    </div>
  );
}
