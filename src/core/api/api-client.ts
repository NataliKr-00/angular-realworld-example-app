import { jwtStorage } from '../auth/jwt-storage';
import { NETWORK_ERROR, toApiError, type ApiError } from './errors';

export const API_BASE_URL = 'https://api.realworld.show/api';

export type { ApiError };

type QueryValue = string | number | boolean | undefined;

export type ApiRequestOptions = {
  method?: string;
  body?: unknown;
  query?: Record<string, QueryValue>;
};

let onUnauthorized: (() => void) | undefined;

export function setUnauthorizedHandler(handler: (() => void) | undefined): void {
  onUnauthorized = handler;
}

function isUserEndpoint(path: string): boolean {
  return path.split('?')[0].endsWith('/user');
}

export async function apiClient<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`);

  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const token = jwtStorage.getToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Token ${token}`;
  }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw { ...NETWORK_ERROR };
  }

  if (!response.ok) {
    if (response.status === 401 && !isUserEndpoint(path)) {
      onUnauthorized?.();
    }

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    throw toApiError(body, response.status);
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}
