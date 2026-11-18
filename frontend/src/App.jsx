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
  const [activePage, setActivePage] = useState('dashboard');
  const [tanggalAcuan, setTanggalAcuan] = useState('2026-10-31');
  const [urgentReturCount, setUrgentReturCount] = useState(0);
  const [preselectedBatch, setPreselectedBatch] = useState(null);
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('simaaf_logo_url') || '/logo-asahan.svg');

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
    return <LoginPage onSuccess={() => setActivePage('dashboard')} />;
  }

  // Navigasi dengan context data
  const handleSelectBatchForAdjustment = (batch) => {
    setPreselectedBatch(batch);
    setActivePage('penyesuaian');
  };

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Dashboard Ringkasan Inventori';
      case 'faktur': return 'Penerimaan Obat & Ekstraksi Faktur';
      case 'inventori': return 'Tabel Persediaan & Agregasi Batch';
      case 'pengingat': return 'Pusat Pengingat Tenggat Retur & Kedaluwarsa';
      case 'penyesuaian': return 'Penyesuaian Stok (Cek Fisik Rak)';
      case 'kalender': return 'Kalender Jadwal Jatuh Tempo';
      case 'pengaturan': return 'Pengaturan Aturan Retur Distributor';
      default: return 'SIMAAF';
    }
  };

  return (
    <Layout
      activePage={activePage}
      setActivePage={setActivePage}
      activePageTitle={getPageTitle()}
      tanggalAcuan={tanggalAcuan}
      urgentCount={urgentReturCount}
      logoUrl={logoUrl}
    >
      {activePage === 'dashboard' && (
        <DashboardPage
          onNavigateToPengingat={() => setActivePage('pengingat')}
          onNavigateToInventori={() => setActivePage('inventori')}
          onNavigateToFaktur={() => setActivePage('faktur')}
          onNavigateToKalender={() => setActivePage('kalender')}
        />
      )}

      {activePage === 'faktur' && (
        <FakturInputPage
          onBatchSaved={() => {
            refreshBadgeAndSettings();
            setActivePage('inventori');
          }}
        />
      )}

      {activePage === 'inventori' && (
        <InventoriBatchPage
          onSelectBatchForAdjustment={handleSelectBatchForAdjustment}
        />
      )}

      {activePage === 'pengingat' && (
        <PengingatReturPage
          onNavigateToPenyesuaian={handleSelectBatchForAdjustment}
        />
      )}

      {activePage === 'penyesuaian' && (
        <PenyesuaianStokPage
          preselectedBatch={preselectedBatch}
        />
      )}

      {activePage === 'kalender' && (
        <KalenderTenggatPage />
      )}

      {activePage === 'pengaturan' && (
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
