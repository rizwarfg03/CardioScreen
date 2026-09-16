import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore, userStore } from '../api/client.js';

const AuthContext = createContext(null);

/**
 * Menyimpan sesi login di localStorage dan memvalidasinya ke backend
 * satu kali saat aplikasi dibuka, supaya token basi langsung ketahuan.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => userStore.get());
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  useEffect(() => {
    if (!tokenStore.get()) return;
    let active = true;
    api
      .me()
      .then((res) => {
        if (!active) return;
        setUser(res.user);
        userStore.set(res.user);
      })
      .catch(() => {
        tokenStore.clear();
        if (active) setUser(null);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (staffCode, password, role) => {
    const res = await api.login(staffCode, password, role);
    tokenStore.set(res.token);
    userStore.set(res.user);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Token mungkin sudah kedaluwarsa; sesi lokal tetap dibersihkan.
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>.');
  return ctx;
}
