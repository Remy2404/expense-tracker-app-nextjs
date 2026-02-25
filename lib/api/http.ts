import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { auth } from '@/lib/firebase';
import { AiApiError } from '@/types/ai';

const DEFAULT_TIMEOUT_MS = 20_000;
const TOKEN_TTL_MS = 50 * 60 * 1000; // 50 minutes - slightly less than Firebase's 1 hour limit

const rawTimeout = Number(process.env.NEXT_PUBLIC_AI_API_TIMEOUT_MS);
const requestTimeoutMs =
  Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : DEFAULT_TIMEOUT_MS;

const aiApiBaseUrl = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8080';

let cachedToken: string | null = null;
let cachedTokenExpiry = 0;

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

const getValidFirebaseToken = async (forceRefresh = false): Promise<string | null> => {
  const now = Date.now();
  if (!forceRefresh && cachedToken && cachedTokenExpiry > now) {
    return cachedToken;
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    cachedToken = null;
    cachedTokenExpiry = 0;
    return null;
  }

  // Force refresh to get a new token if the current one might be expired
  const token = await currentUser.getIdToken(forceRefresh);
  cachedToken = token;
  cachedTokenExpiry = now + TOKEN_TTL_MS;
  return token;
};

const onRequest = async (
  config: InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig> => {
  const token = await getValidFirebaseToken();
  if (!token) {
    throw new Error('You must be signed in to use AI features.');
  }

  config.headers = config.headers ?? {};
  config.headers.Authorization = `Bearer ${token}`;
  return config;
};

const onResponseError = (error: unknown) => {
  // If we get a 401 (Unauthorized) or 403 (Forbidden), clear the cached token
  // so the next request will fetch a fresh one from Firebase
  if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
    cachedToken = null;
    cachedTokenExpiry = 0;
  }
  return Promise.reject(toAiApiError(error));
};

export const aiHttpClient = axios.create({
  baseURL: aiApiBaseUrl,
  timeout: requestTimeoutMs,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

aiHttpClient.interceptors.request.use(onRequest, onResponseError);
aiHttpClient.interceptors.response.use((response) => response, onResponseError);

export const normalizeAiApiError = (error: unknown): AiApiError => toAiApiError(error);
