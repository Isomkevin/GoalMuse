import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USE_MOCK_DATA_KEY = '@goalmuse/useMockData';

interface DemoContextValue {
  /** When true, show the "Using mock data for demo purposes" banner on the Settings page. */
  useMockData: boolean;
  setUseMockData: (value: boolean) => Promise<void>;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [useMockData, setUseMockDataState] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(USE_MOCK_DATA_KEY);
        setUseMockDataState(raw === 'true');
      } catch {
        setUseMockDataState(false);
      }
    })();
  }, []);

  const setUseMockData = useCallback(async (value: boolean) => {
    setUseMockDataState(value);
    try {
      await AsyncStorage.setItem(USE_MOCK_DATA_KEY, value ? 'true' : 'false');
    } catch {
      // persist failed; in-memory state still updated
    }
  }, []);

  return (
    <DemoContext.Provider value={{ useMockData, setUseMockData }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used within DemoProvider');
  return ctx;
}
