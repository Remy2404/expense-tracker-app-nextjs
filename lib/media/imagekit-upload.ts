import { aiHttpClient } from '@/lib/api/http';

const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';
const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const DEFAULT_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

type UploadAuthResponse = {
  token: string;
  expire: number;
  signature: string;
  public_key: string;
  upload_folder: string;
  max_file_size_bytes?: number;
  allowed_mime_types?: string[];
  private_file?: boolean;
  use_unique_file_name?: boolean;
};

type SignedMediaUrlResponse = {
  path: string;
  url: string;
  expires_at_epoch_seconds: number;
};

type ImageKitUploadResponse = {
  filePath?: string;
  url?: string;
  message?: string;
};

export type UploadedReceipt = {
  path: string;
  previewUrl: string;
  sourceUrl?: string;
};

const normalizeErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  return fallback;
};

const ensureLeadingSlash = (value: string): string => (value.startsWith('/') ? value : `/${value}`);

const toUploadFileName = (file: File): string => {
  const trimmed = file.name.trim();
  if (trimmed) {
    return trimmed.replace(/\s+/g, '-');
  }
  const extension = file.type.includes('/') ? file.type.split('/')[1] : 'jpg';
  return `receipt-${Date.now()}.${extension}`;
};

const parseUploadFailure = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message || `Upload failed with status ${response.status}`;
  } catch {
    return `Upload failed with status ${response.status}`;
  }
};

const validateFile = (
  file: File,
  maxFileSizeBytes: number,
  allowedMimeTypes: string[]
): void => {
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error(`Unsupported file type. Allowed: ${allowedMimeTypes.join(', ')}`);
  }

  if (file.size > maxFileSizeBytes) {
    throw new Error(
      `File ${file.name} is too large. Max size is ${Math.floor(maxFileSizeBytes / (1024 * 1024))}MB.`
    );
  }
};

export const resolveReceiptPreviewUrl = async (pathOrUrl: string): Promise<string> => {
  if (!pathOrUrl) {
    return pathOrUrl;
  }
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const response = await aiHttpClient.get<SignedMediaUrlResponse>('/api/media/signed-url', {
    params: { path: ensureLeadingSlash(pathOrUrl) },
  });
  return response.data.url;
};

export const uploadReceiptFile = async (file: File): Promise<UploadedReceipt> => {
  const authResponse = await aiHttpClient.get<UploadAuthResponse>('/api/media/upload-auth');
  const auth = authResponse.data;

  const maxFileSizeBytes = auth.max_file_size_bytes || DEFAULT_MAX_FILE_SIZE_BYTES;
  const allowedMimeTypes = auth.allowed_mime_types?.length
    ? auth.allowed_mime_types
    : DEFAULT_ALLOWED_MIME_TYPES;
  validateFile(file, maxFileSizeBytes, allowedMimeTypes);

  const fileName = toUploadFileName(file);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', fileName);
  formData.append('token', auth.token);
  formData.append('expire', String(auth.expire));
  formData.append('signature', auth.signature);
  formData.append('publicKey', auth.public_key);
  formData.append('folder', auth.upload_folder);
  formData.append('isPrivateFile', String(auth.private_file ?? true));
  formData.append('useUniqueFileName', String(auth.use_unique_file_name ?? true));

  const uploadResponse = await fetch(IMAGEKIT_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error(await parseUploadFailure(uploadResponse));
  }

  const payload = (await uploadResponse.json()) as ImageKitUploadResponse;
  if (!payload.filePath) {
    throw new Error('Upload completed but file path was not returned by ImageKit.');
  }

  const canonicalPath = ensureLeadingSlash(payload.filePath);
  const previewUrl = await resolveReceiptPreviewUrl(canonicalPath);

  return {
    path: canonicalPath,
    previewUrl,
    sourceUrl: payload.url,
  };
};

export const toUploadErrorMessage = (error: unknown, fallback: string): string =>
  normalizeErrorMessage(error, fallback);
