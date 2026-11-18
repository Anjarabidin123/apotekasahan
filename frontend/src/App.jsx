import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { FakturInputPage } from './pages/FakturInputPage';
import { InventoriBatchPage } from './pages/InventoriBatchPage';
import { PengingatReturPage } from './pages/PengingatReturPage';
import { PenyesuaianStokPage } from './pages/PenyesuaianStokPage';
import { PengaturanPage } from './pages/PengaturanPage';
import { KalenderTenggatPage } from './pages/KalenderTenggatPage';
import { api } from './services/api';

function MainApp() {
  const { user, loading, isAdmin } = useAuth();
  const [activePage, setActivePage] = useState(() => localStorage.getItem('simaaf_default_page') || 'dashboard');
  const [tanggalAcuan, setTanggalAcuan] = useState('2026-10-31');
  const [urgentReturCount, setUrgentReturCount] = useState(0);
  const [preselectedBatch, setPreselectedBatch] = useState(null);
  const [focusedQuery, setFocusedQuery] = useState('');
  const [logoUrl, setLogoUrl] = useState(() => {
    const saved = localStorage.getItem('simaaf_logo_url') || '';
    return saved.startsWith('/logo-') ? '' : saved;
  });

  const handleLogoChange = (newUrl) => {
    setLogoUrl(newUrl);
    if (newUrl) {
      localStorage.setItem('simaaf_logo_url', newUrl);
    } else {
      localStorage.removeItem('simaaf_logo_url');
    }
  };

  // Muat data pengaturan & hitung badge pengingat mendesak
  const refreshBadgeAndSettings = async () => {
    try {
      const [settings, pengingat] = await Promise.all([
        api.getSettings(),
        api.getPengingat()
      ]);
      setTanggalAcuan(settings.tanggal_acuan);
      setUrgentReturCount(pengingat.ringkasan.total_mendesak_retur);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      refreshBadgeAndSettings();
      // Jika karyawan, arahkan default ke menu inventori atau faktur (bukan dashboard)
      if (!isAdmin && activePage === 'dashboard') {
        setActivePage('inventori');
      }
    }
  }, [user, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400 font-sans">
        Memulai SIMAAF Apotek Asahan Farma...
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage
        logoUrl={logoUrl}
        onSuccess={() => setActivePage(localStorage.getItem('simaaf_default_page') || 'dashboard')}
      />
    );
  }

  // Navigasi dengan context data
  const handleSelectBatchForAdjustment = (batch) => {
    setPreselectedBatch(batch);
    setFocusedQuery('');
    setActivePage('penyesuaian');
  };

  const handleNavigateMenu = (pageId, query = '') => {
    setFocusedQuery(typeof query === 'string' ? query : '');
    setActivePage(pageId);
  };

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Beranda';
      case 'faktur': return 'Input Faktur';
      case 'inventori': return 'Stok & Batch';
      case 'pengingat': return 'Pengingat Retur';
      case 'penyesuaian': return 'Stok Opname';
      case 'kalender': return 'Kalender PBF';
      case 'pengaturan': return 'Pengaturan';
      default: return 'SIMAAF';
    }
  };

  // Fallback if activePage is invalid
  const validPages = ['dashboard', 'faktur', 'inventori', 'pengingat', 'penyesuaian', 'kalender', 'pengaturan'];
  const currentPage = validPages.includes(activePage) ? activePage : (localStorage.getItem('simaaf_default_page') || 'dashboard');

  return (
    <Layout
      activePage={currentPage}
      setActivePage={(pageId) => handleNavigateMenu(pageId)}
      activePageTitle={getPageTitle()}
      tanggalAcuan={tanggalAcuan}
      urgentCount={urgentReturCount}
      logoUrl={logoUrl}
    >
      {currentPage === 'dashboard' && (
        <DashboardPage
          onNavigateToPengingat={(q) => handleNavigateMenu('pengingat', q)}
          onNavigateToInventori={(q) => handleNavigateMenu('inventori', q)}
          onNavigateToFaktur={() => handleNavigateMenu('faktur')}
          onNavigateToKalender={() => handleNavigateMenu('kalender')}
          onNavigateToPenyesuaian={(batch) =>
            batch && batch.id ? handleSelectBatchForAdjustment(batch) : handleNavigateMenu('penyesuaian')
          }
          onNavigateToPengaturan={() => handleNavigateMenu('pengaturan')}
          tanggalAcuan={tanggalAcuan}
        />
      )}

      {currentPage === 'faktur' && (
        <FakturInputPage
          onBatchSaved={() => {
            refreshBadgeAndSettings();
            handleNavigateMenu('inventori');
          }}
        />
      )}

      {currentPage === 'inventori' && (
        <InventoriBatchPage
          initialSearch={focusedQuery}
          onClearInitialSearch={() => setFocusedQuery('')}
          onSelectBatchForAdjustment={handleSelectBatchForAdjustment}
          onNavigateToFaktur={() => handleNavigateMenu('faktur')}
          onNavigateToPengingat={(q) => handleNavigateMenu('pengingat', q)}
        />
      )}

      {currentPage === 'pengingat' && (
        <PengingatReturPage
          initialSearch={focusedQuery}
          onClearInitialSearch={() => setFocusedQuery('')}
          onNavigateToPenyesuaian={handleSelectBatchForAdjustment}
        />
      )}

      {currentPage === 'penyesuaian' && (
        <PenyesuaianStokPage
          preselectedBatch={preselectedBatch}
        />
      )}

      {currentPage === 'kalender' && (
        <KalenderTenggatPage />
      )}

      {currentPage === 'pengaturan' && (
        <PengaturanPage
          onSettingsUpdated={refreshBadgeAndSettings}
          currentLogoUrl={logoUrl}
          onLogoChange={handleLogoChange}
        />
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
