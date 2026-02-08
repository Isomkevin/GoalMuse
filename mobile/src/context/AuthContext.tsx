import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';

const AUTH_KEY = '@goalmuse/user';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, displayName?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (displayName: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(AUTH_KEY);
        if (raw) setUser(JSON.parse(raw));
      } catch (_) {}
      setIsLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    // Mock: accept demo@goalmuse.app or any email
    const u: User = {
      id: '1',
      email,
      displayName: email.split('@')[0] || 'User',
    };
    setUser(u);
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(u));
    return true;
  }, []);

  const register = useCallback(async (email: string, _password: string, displayName?: string) => {
    const u: User = {
      id: Date.now().toString(),
      email,
      displayName: displayName || email.split('@')[0] || 'User',
    };
    setUser(u);
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(u));
    return true;
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(AUTH_KEY);
  }, []);

  const updateProfile = useCallback(async (displayName: string) => {
    const raw = await AsyncStorage.getItem(AUTH_KEY);
    if (!raw) return;
    const prev = JSON.parse(raw) as User;
    const updated = { ...prev, displayName: displayName.trim() || prev.displayName };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(updated));
    setUser(updated);
  }, []);

  const changePassword = useCallback(async (_current: string, _new: string) => {
    // Mock: always succeed; real app would call API
    return true;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
