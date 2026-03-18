import axios, { AxiosError, AxiosHeaders } from 'axios';
import { AiApiError } from '@/types/ai';

const DEFAULT_TIMEOUT_MS = 20_000;
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';
const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

const rawTimeout = Number(process.env.NEXT_PUBLIC_AI_API_TIMEOUT_MS);
const requestTimeoutMs =
  Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : DEFAULT_TIMEOUT_MS;

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_AI_API_URL ||
  'http://localhost:8080';
const csrfBootstrapUrl = `${apiBaseUrl}/api/auth/session`;

const normalizeMessage = (message: string) => message.trim() || 'AI request failed.';

let csrfBootstrapPromise: Promise<string | null> | null = null;

const readCookie = (name: string): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const encodedName = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie
    .split('; ')
    .find((existingCookie) => existingCookie.startsWith(encodedName));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(encodedName.length));
};

const ensureCsrfToken = async (): Promise<string | null> => {
  const existingToken = readCookie(CSRF_COOKIE_NAME);
  if (existingToken) {
    return existingToken;
  }

  if (!csrfBootstrapPromise) {
    csrfBootstrapPromise = fetch(csrfBootstrapUrl, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
      .then(() => readCookie(CSRF_COOKIE_NAME))
      .catch(() => null)
      .finally(() => {
        csrfBootstrapPromise = null;
      });
  }

  return csrfBootstrapPromise;
};

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

  const method = config.method?.toLowerCase();
  if (!method || !MUTATING_METHODS.has(method)) {
    return config;
  }

  const csrfToken = await ensureCsrfToken();
  if (!csrfToken) {
    return config;
  }

  const headers = AxiosHeaders.from(config.headers);
  headers.set(CSRF_HEADER_NAME, csrfToken);
  config.headers = headers;
  return config;
});

aiHttpClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toAiApiError(error))
);

export const normalizeAiApiError = (error: unknown): AiApiError => toAiApiError(error);
