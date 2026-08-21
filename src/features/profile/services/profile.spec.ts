import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '../../../core/api/api-client';
import type { Profile } from '../models/profile.model';
import { followProfile, unfollowProfile } from './profile';

function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

const mockProfile: Profile = {
  username: 'testuser',
  bio: 'Test bio',
  image: 'https://example.com/avatar.jpg',
  following: false,
};

describe('profile follow API', () => {
  beforeEach(() => {
    window.localStorage.removeItem('jwtToken');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.removeItem('jwtToken');
  });

  it('follows a user', async () => {
    const followed = { ...mockProfile, username: 'usertofollow', following: true };
    vi.mocked(fetch).mockReturnValue(jsonResponse({ profile: followed }));
    const profile = await followProfile('usertofollow');
    expect(profile.following).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/profiles/usertofollow/follow`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({}),
      }),
    );
  });

  it('unfollows a user', async () => {
    const unfollowed = { ...mockProfile, username: 'usertounfollow', following: false };
    vi.mocked(fetch).mockReturnValue(jsonResponse({ profile: unfollowed }));
    const profile = await unfollowProfile('usertounfollow');
    expect(profile.following).toBe(false);
    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/profiles/usertounfollow/follow`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
