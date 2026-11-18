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
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleSelectPage = (pageId) => {
    setActivePage(pageId);
    setIsMobileOpen(false);
  };

  return (
    <div className="flex h-[100dvh] w-full max-w-full bg-slate-50/60 overflow-hidden font-sans">
      <Sidebar
        activePage={activePage}
        setActivePage={handleSelectPage}
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        urgentCount={urgentCount}
        logoUrl={logoUrl}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative w-full max-w-full">
        <Header
          onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
          onOpenMobile={() => setIsMobileOpen(true)}
          activePageTitle={activePageTitle}
          tanggalAcuan={tanggalAcuan}
          logoUrl={logoUrl}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full p-4 sm:p-6 lg:p-8 pb-28 md:pb-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </main>

        <BottomNav
          activePage={activePage}
          setActivePage={handleSelectPage}
          urgentCount={urgentCount}
        />
      </div>
    </div>
  );
}
