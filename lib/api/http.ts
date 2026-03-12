import axios, { AxiosError, AxiosHeaders } from 'axios';
import { AiApiError } from '@/types/ai';

const DEFAULT_TIMEOUT_MS = 20_000;

const rawTimeout = Number(process.env.NEXT_PUBLIC_AI_API_TIMEOUT_MS);
const requestTimeoutMs =
  Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : DEFAULT_TIMEOUT_MS;

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_AI_API_URL ||
  'http://localhost:8080';

const normalizeMessage = (message: string) => message.trim() || 'AI request failed.';

const toAiApiError = (error: unknown): AiApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
    const detail = axiosError.response?.data?.detail ?? axiosError.response?.data?.message;
    return {
      message: normalizeMessage(detail ?? axiosError.message ?? 'AI request failed.'),
      status: axiosError.response?.status,
      details: detail,
    };
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return { message: normalizeMessage(String((error as { message: unknown }).message)) };
  }

  return { message: 'AI request failed.' };
};

export const aiHttpClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: requestTimeoutMs,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

aiHttpClient.interceptors.request.use(async (config) => {
  if (typeof window === 'undefined') {
    return config;
  }

  try {
    const { auth } = await import('@/lib/firebase');
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      return config;
    }

    const idToken = await firebaseUser.getIdToken();
    if (!idToken) {
      return config;
    }

    const headers = AxiosHeaders.from(config.headers);
    headers.set('Authorization', `Bearer ${idToken}`);
    config.headers = headers;
  } catch {
    // Ignore token attach failures and let the backend return 401 when needed.
  }

  return config;
});

aiHttpClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toAiApiError(error))
);

export const normalizeAiApiError = (error: unknown): AiApiError => toAiApiError(error);
