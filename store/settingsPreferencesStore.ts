import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const SETTINGS_PREFERENCES_STORAGE_KEY = 'settings-preferences-web';
const DEFAULT_REMINDER_TIME = '09:00';
const REMINDER_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

type SettingsPreferencesState = {
  dailyReminder: boolean;
  reminderTime: string;
  hasHydrated: boolean;
  setDailyReminder: (value: boolean) => void;
  setReminderTime: (value: string) => void;
  setHasHydrated: (value: boolean) => void;
};

const normalizeReminderTime = (value: string | null | undefined): string => {
  if (!value) {
    return DEFAULT_REMINDER_TIME;
  }

  return REMINDER_TIME_PATTERN.test(value) ? value : DEFAULT_REMINDER_TIME;
};

export const useSettingsPreferencesStore = create<SettingsPreferencesState>()(
  persist(
    (set) => ({
      dailyReminder: false,
      reminderTime: DEFAULT_REMINDER_TIME,
      hasHydrated: false,

      setDailyReminder: (value) => set({ dailyReminder: value }),
      setReminderTime: (value) => set({ reminderTime: normalizeReminderTime(value) }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: SETTINGS_PREFERENCES_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        dailyReminder: state.dailyReminder,
        reminderTime: state.reminderTime,
      }),
      merge: (persistedState, currentState) => {
        const state = persistedState as Partial<SettingsPreferencesState> | undefined;

        return {
          ...currentState,
          ...state,
          reminderTime: normalizeReminderTime(state?.reminderTime),
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
