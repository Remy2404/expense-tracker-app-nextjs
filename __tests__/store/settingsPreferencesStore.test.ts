import { waitFor } from '@testing-library/react';

describe('useSettingsPreferencesStore', () => {
  beforeEach(() => {
    jest.resetModules();
    window.localStorage.clear();
  });

  it('hydrates saved reminder preferences after refresh', async () => {
    window.localStorage.setItem(
      'settings-preferences-web',
      JSON.stringify({
        state: {
          dailyReminder: true,
          reminderTime: '18:45',
        },
        version: 0,
      })
    );

    const { useSettingsPreferencesStore } = await import('@/store/settingsPreferencesStore');

    await waitFor(() => {
      expect(useSettingsPreferencesStore.getState().hasHydrated).toBe(true);
    });

    expect(useSettingsPreferencesStore.getState().dailyReminder).toBe(true);
    expect(useSettingsPreferencesStore.getState().reminderTime).toBe('18:45');
  });

  it('falls back to the default time when persisted data is invalid', async () => {
    window.localStorage.setItem(
      'settings-preferences-web',
      JSON.stringify({
        state: {
          dailyReminder: true,
          reminderTime: '25:99',
        },
        version: 0,
      })
    );

    const { useSettingsPreferencesStore } = await import('@/store/settingsPreferencesStore');

    await waitFor(() => {
      expect(useSettingsPreferencesStore.getState().hasHydrated).toBe(true);
    });

    expect(useSettingsPreferencesStore.getState().dailyReminder).toBe(true);
    expect(useSettingsPreferencesStore.getState().reminderTime).toBe('09:00');
  });
});
