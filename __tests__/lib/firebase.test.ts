const mockInitializeApp = jest.fn(() => ({ name: '[DEFAULT]' }));
const mockGetApps = jest.fn(() => []);
const mockGetApp = jest.fn(() => ({ name: '[DEFAULT]' }));
const mockGetAuth = jest.fn(() => ({ currentUser: null }));
const mockSetPersistence = jest.fn(() => Promise.resolve());
const mockBrowserLocalPersistence = { type: 'LOCAL' };
const mockInMemoryPersistence = { type: 'NONE' };

jest.mock('firebase/app', () => ({
  getApp: mockGetApp,
  getApps: mockGetApps,
  initializeApp: mockInitializeApp,
}));

jest.mock('firebase/auth', () => ({
  browserLocalPersistence: mockBrowserLocalPersistence,
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

  it('persists firebase auth state in browser local storage', async () => {
    window.localStorage.setItem('theme', 'dark');

    const firebaseModule = await import('../../lib/firebase');
    await firebaseModule.authPersistenceReady;

    expect(mockSetPersistence).toHaveBeenCalledWith(firebaseModule.auth, mockBrowserLocalPersistence);
    expect(window.localStorage.getItem('theme')).toBe('dark');
  });
});
