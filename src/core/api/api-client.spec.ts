import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL, apiClient, setUnauthorizedHandler } from './api-client';
import { jwtStorage } from '../auth/jwt-storage';

function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve(
    new Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

describe('apiClient', () => {
  beforeEach(() => {
    window.localStorage.removeItem('jwtToken');
    setUnauthorizedHandler(undefined);
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setUnauthorizedHandler(undefined);
    window.localStorage.removeItem('jwtToken');
  });

  it('prefixes the RealWorld API origin', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse({ ok: true }));
    await apiClient('/articles');
    expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/articles`, expect.any(Object));
  });

  it('attaches Token authorization when a JWT is stored', async () => {
    jwtStorage.saveToken('jwt-1');
    vi.mocked(fetch).mockReturnValue(jsonResponse({ ok: true }));
    await apiClient('/articles');
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/articles`,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Token jwt-1' }),
      }),
    );
  });

  it('purges auth on 401 except for GET /user', async () => {
    const unauthorized = vi.fn();
    setUnauthorizedHandler(unauthorized);
    vi.mocked(fetch).mockReturnValue(jsonResponse({ errors: { unauthorized: ['no'] } }, 401));

    await expect(apiClient('/articles')).rejects.toMatchObject({ status: 401 });
    expect(unauthorized).toHaveBeenCalledTimes(1);

    unauthorized.mockClear();
    await expect(apiClient('/user')).rejects.toMatchObject({ status: 401 });
    expect(unauthorized).not.toHaveBeenCalled();
  });

  it('normalizes a missing error body', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse(null, 500));
    await expect(apiClient('/articles')).rejects.toMatchObject({
      status: 500,
      errors: { network: ['Unable to connect. Please check your internet connection.'] },
    });
  });

  it('returns a network error when fetch throws', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(apiClient('/articles')).rejects.toMatchObject({
      status: 0,
      errors: { network: ['Unable to connect. Please check your internet connection.'] },
    });
  });
});
