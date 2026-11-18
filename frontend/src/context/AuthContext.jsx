import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cek sesi aktif saat aplikasi dibuka
    const active = api.getCurrentUser();
    if (active) {
      setUser(active);
    } else {
      // Default sesi awal untuk mempermudah demonstrasi jika belum login
      // Pengguna bisa logout dan login ulang lewat LoginPage
      const defaultAdmin = { id: 1, nama: 'Ibu Anni (Komisaris)', email: 'admin@apotek.local', role: 'admin' };
      setUser(defaultAdmin);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    setUser(res.data);
    return res.data;
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
