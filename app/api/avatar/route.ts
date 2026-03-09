import { NextResponse } from 'next/server';

const ALLOWED_HOST_SUFFIX = 'googleusercontent.com';
const IMAGE_CONTENT_TYPE_PREFIX = 'image/';
const DEFAULT_CACHE_SECONDS = 60 * 60;

const buildErrorResponse = (message: string, status: number) =>
  NextResponse.json({ message }, { status });

const getAvatarUrl = (value: string | null): URL | null => {
  if (!value) {
    return null;
  }

  try {
    const parsedUrl = new URL(value);
    if (parsedUrl.protocol !== 'https:') {
      return null;
    }

    if (!parsedUrl.hostname.endsWith(ALLOWED_HOST_SUFFIX)) {
      return null;
    }

    return parsedUrl;
  } catch {
    return null;
  }
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const avatarUrl = getAvatarUrl(requestUrl.searchParams.get('url'));
  if (!avatarUrl) {
    return buildErrorResponse('Invalid avatar URL.', 400);
  }

  const upstreamResponse = await fetch(avatarUrl, {
    headers: {
      Accept: 'image/*',
    },
    cache: 'force-cache',
  });

  if (!upstreamResponse.ok) {
    return buildErrorResponse('Avatar fetch failed.', upstreamResponse.status);
  }

  const contentType = upstreamResponse.headers.get('content-type');
  if (!contentType || !contentType.startsWith(IMAGE_CONTENT_TYPE_PREFIX)) {
    return buildErrorResponse('Avatar response was not an image.', 502);
  }

  const cacheControl = upstreamResponse.headers.get('cache-control')
    ?? `public, max-age=${DEFAULT_CACHE_SECONDS}, s-maxage=${DEFAULT_CACHE_SECONDS}`;

  return new Response(await upstreamResponse.arrayBuffer(), {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
    },
  });
}
