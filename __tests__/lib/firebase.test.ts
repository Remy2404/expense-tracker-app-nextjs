const mockInitializeApp = jest.fn(() => ({ name: '[DEFAULT]' }));
const mockGetApps = jest.fn(() => []);
const mockGetApp = jest.fn(() => ({ name: '[DEFAULT]' }));
const mockGetAuth = jest.fn(() => ({ currentUser: null }));
const mockSetPersistence = jest.fn(() => Promise.resolve());
const mockInMemoryPersistence = { type: 'NONE' };

jest.mock('firebase/app', () => ({
  getApp: mockGetApp,
  getApps: mockGetApps,
  initializeApp: mockInitializeApp,
}));

jest.mock('firebase/auth', () => ({
  getAuth: mockGetAuth,
  inMemoryPersistence: mockInMemoryPersistence,
  setPersistence: mockSetPersistence,
}));

describe('firebase auth persistence', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_FIREBASE_API_KEY: 'public-api-key',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo.firebaseapp.com',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-project',
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo.appspot.com',
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789',
      NEXT_PUBLIC_FIREBASE_APP_ID: '1:123456789:web:demo',
    };

    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('keeps firebase auth state out of browser storage', async () => {
    const legacyAuthKey = 'firebase:authUser:public-api-key:[DEFAULT]';
    window.localStorage.setItem(legacyAuthKey, '{"uid":"user-1"}');
    window.sessionStorage.setItem(legacyAuthKey, '{"uid":"user-1"}');
    window.localStorage.setItem('theme', 'dark');

    const firebaseModule = await import('../../lib/firebase');
    await firebaseModule.authPersistenceReady;

    expect(mockSetPersistence).toHaveBeenCalledWith(firebaseModule.auth, mockInMemoryPersistence);
    expect(window.localStorage.getItem(legacyAuthKey)).toBeNull();
    expect(window.sessionStorage.getItem(legacyAuthKey)).toBeNull();
    expect(window.localStorage.getItem('theme')).toBe('dark');
  });
});
