import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '../../../core/api/api-client';
import { fetchTags } from './tags';

function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

const mockTags = ['angular', 'typescript', 'testing', 'rxjs', 'javascript'];

describe('tags API', () => {
  beforeEach(() => {
    window.localStorage.removeItem('jwtToken');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.removeItem('jwtToken');
  });

  it('fetches all tags', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse({ tags: mockTags }));
    const tags = await fetchTags();
    expect(tags).toEqual(mockTags);
    expect(tags.length).toBe(5);
    expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/tags`, expect.objectContaining({ method: 'GET' }));
  });

  it('extracts tags array from the response wrapper', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse({ tags: mockTags }));
    const tags = await fetchTags();
    expect(Array.isArray(tags)).toBe(true);
    expect((tags as { tags?: string[] }).tags).toBeUndefined();
  });

  it('handles an empty tags list', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse({ tags: [] }));
    const tags = await fetchTags();
    expect(tags).toEqual([]);
  });

  it('handles a server error', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse({ errors: { tags: ['failed'] } }, 500));
    await expect(fetchTags()).rejects.toMatchObject({ status: 500 });
  });

  it('handles a network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(fetchTags()).rejects.toMatchObject({ status: 0 });
  });
});
