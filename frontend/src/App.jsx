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
  const [pageHistory, setPageHistory] = useState([]);
  const [tanggalAcuan, setTanggalAcuan] = useState('2026-10-31');
  const [urgentReturCount, setUrgentReturCount] = useState(0);
  const [dataVersion, setDataVersion] = useState(0);
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
      setDataVersion((v) => v + 1);
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
    } else {
      setPageHistory([]);
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
        onSuccess={() => {
          setPageHistory([]);
          setActivePage(localStorage.getItem('simaaf_default_page') || 'dashboard');
        }}
      />
    );
  }

  const validPages = ['dashboard', 'faktur', 'inventori', 'pengingat', 'penyesuaian', 'kalender', 'pengaturan'];
  const currentPage = validPages.includes(activePage) ? activePage : (localStorage.getItem('simaaf_default_page') || 'dashboard');

  // Navigasi dengan context data
  const handleSelectBatchForAdjustment = (batch) => {
    setPreselectedBatch(batch);
    setFocusedQuery('');
    if (currentPage !== 'penyesuaian') {
      setPageHistory((prev) => [...prev.slice(-19), currentPage]);
    }
    setActivePage('penyesuaian');
  };

  const handleNavigateMenu = (pageId, query = '') => {
    setFocusedQuery(typeof query === 'string' ? query : '');
    if (pageId === 'dashboard') {
      setPageHistory([]);
    } else if (pageId !== currentPage) {
      setPageHistory((prev) => [...prev.slice(-19), currentPage]);
    }
    setActivePage(pageId);
  };

  const handleNavigateBack = () => {
    setFocusedQuery('');
    if (pageHistory.length === 0) {
      setActivePage(isAdmin ? 'dashboard' : 'inventori');
      return;
    }
    const previousPage = pageHistory[pageHistory.length - 1];
    setPageHistory((prev) => prev.slice(0, -1));
    setActivePage(previousPage);
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

  return (
    <Layout
      activePage={currentPage}
      setActivePage={(pageId, query) => handleNavigateMenu(pageId, query)}
      activePageTitle={getPageTitle()}
      showBackButton={currentPage !== 'dashboard'}
      onBack={handleNavigateBack}
      tanggalAcuan={tanggalAcuan}
      urgentCount={urgentReturCount}
      dataVersion={dataVersion}
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
          onDataChanged={refreshBadgeAndSettings}
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
          onDataChanged={refreshBadgeAndSettings}
        />
      )}

      {currentPage === 'pengingat' && (
        <PengingatReturPage
          initialSearch={focusedQuery}
          onClearInitialSearch={() => setFocusedQuery('')}
          onNavigateToPenyesuaian={handleSelectBatchForAdjustment}
          onDataChanged={refreshBadgeAndSettings}
        />
      )}

      {currentPage === 'penyesuaian' && (
        <PenyesuaianStokPage
          preselectedBatch={preselectedBatch}
          onDataChanged={refreshBadgeAndSettings}
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
