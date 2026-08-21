import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../core/api/api-client';

export function fetchTags(): Promise<string[]> {
  return apiClient<{ tags: string[] }>('/tags').then(data => data.tags);
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
