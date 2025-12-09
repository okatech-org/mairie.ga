import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type InactivityTimeout = 5 | 15 | 30 | 60 | 0; // 0 = disabled

interface SessionConfigState {
  inactivityTimeout: InactivityTimeout; // in minutes
  setInactivityTimeout: (timeout: InactivityTimeout) => void;
}

export const useSessionConfigStore = create<SessionConfigState>()(
  persist(
    (set) => ({
      inactivityTimeout: 15, // Default 15 minutes
      setInactivityTimeout: (timeout) => set({ inactivityTimeout: timeout }),
    }),
    {
      name: 'session-config',
    }
  )
);
