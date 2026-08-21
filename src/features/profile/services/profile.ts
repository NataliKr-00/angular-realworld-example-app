import { apiClient } from '../../../core/api/api-client';
import type { Profile } from '../models/profile.model';

export function followProfile(username: string): Promise<Profile> {
  return apiClient<{ profile: Profile }>(`/profiles/${username}/follow`, {
    method: 'POST',
    body: {},
  }).then(data => data.profile);
}

export function unfollowProfile(username: string): Promise<Profile> {
  return apiClient<{ profile: Profile }>(`/profiles/${username}/follow`, {
    method: 'DELETE',
  }).then(data => data.profile);
}
