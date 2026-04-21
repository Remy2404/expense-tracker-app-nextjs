import { aiHttpClient } from './http';

export interface AuthSessionPayload {
  firebaseUid: string;
  email: string | null;
  role: string | null;
  expiresAtEpochSeconds: number | null;
  firebaseCustomToken: string | null;
}

const normalizeSessionPayload = (payload: Record<string, unknown>): AuthSessionPayload => ({
  firebaseUid: String(payload.firebaseUid ?? payload.firebase_uid ?? ''),
  email: typeof payload.email === 'string' ? payload.email : null,
  role: typeof payload.role === 'string' ? payload.role : null,
  expiresAtEpochSeconds:
    typeof payload.expiresAtEpochSeconds === 'number'
      ? payload.expiresAtEpochSeconds
      : typeof payload.expires_at_epoch_seconds === 'number'
        ? payload.expires_at_epoch_seconds
        : null,
  firebaseCustomToken:
    typeof payload.firebaseCustomToken === 'string'
      ? payload.firebaseCustomToken
      : typeof payload.firebase_custom_token === 'string'
        ? payload.firebase_custom_token
        : null,
});

export const authApi = {
  async createSession(idToken: string): Promise<AuthSessionPayload> {
    const response = await aiHttpClient.post(
      '/api/auth/session',
      { id_token: idToken }
    );
    return normalizeSessionPayload((response.data ?? {}) as Record<string, unknown>);
  },

  async getSession(): Promise<AuthSessionPayload> {
    const response = await aiHttpClient.get('/api/auth/session');
    return normalizeSessionPayload((response.data ?? {}) as Record<string, unknown>);
  },

  async logout(): Promise<void> {
    await aiHttpClient.post('/api/auth/logout');
  },
};
