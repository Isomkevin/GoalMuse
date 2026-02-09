import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, setOnUnauthorized } from '../lib/api';
import type { User } from '../types';

const AUTH_USER_KEY = '@goalmuse/user';
const AUTH_TOKEN_KEY = '@goalmuse/token';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, displayName?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (displayName: string) => Promise<void>;
  updateNotificationPreferences: (prefs: Record<string, unknown>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  clearSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(async () => {
    setToken(null);
    setUser(null);
    try {
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
    } catch (_) {}
  }, []);

  useEffect(() => {
    setOnUnauthorized(clearSession);
    return () => setOnUnauthorized(null);
  }, [clearSession]);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        const rawUser = await AsyncStorage.getItem(AUTH_USER_KEY);
        if (storedToken && rawUser) {
          try {
            const refreshedUser = await authApi.me(storedToken);
            setUser(refreshedUser as User);
            setToken(storedToken);
          } catch {
            await clearSession();
          }
        }
      } catch (_) {}
      setIsLoading(false);
    })();
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { accessToken, user: u } = await authApi.login(email, password);
      const appUser: User = {
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        plan: u.plan,
        notificationPreferences: u.notificationPreferences,
      };
      setToken(accessToken);
      setUser(appUser);
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, accessToken);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(appUser));
      return true;
    } catch {
      return false;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      const { accessToken, user: u } = await authApi.register(email, password, displayName);
      const appUser: User = {
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        plan: u.plan,
        notificationPreferences: u.notificationPreferences,
      };
      setToken(accessToken);
      setUser(appUser);
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, accessToken);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(appUser));
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  const updateProfile = useCallback(
    async (displayName: string) => {
      if (!token || !user) return;
      try {
        const u = await authApi.updateProfile(token, displayName.trim());
        const appUser: User = {
          id: u.id,
          email: u.email,
          displayName: u.displayName,
          plan: u.plan,
          notificationPreferences: u.notificationPreferences,
        };
        setUser(appUser);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(appUser));
      } catch (_) {}
    },
    [token, user]
  );

  const updateNotificationPreferences = useCallback(
    async (prefs: Record<string, unknown>) => {
      if (!token || !user) return;
      try {
        const u = await authApi.updateProfile(token, user.displayName ?? user.email ?? '', prefs);
        const appUser: User = {
          ...user,
          notificationPreferences: u.notificationPreferences,
        };
        setUser(appUser);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(appUser));
      } catch (_) {}
    },
    [token, user]
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!token) return false;
      try {
        await authApi.changePassword(token, currentPassword, newPassword);
        return true;
      } catch {
        return false;
      }
    },
    [token]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        updateNotificationPreferences,
        changePassword,
        clearSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
