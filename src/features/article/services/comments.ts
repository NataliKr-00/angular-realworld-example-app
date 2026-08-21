import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../core/api/api-client';
import type { Comment } from '../models/comment.model';

export function fetchComments(slug: string): Promise<Comment[]> {
  return apiClient<{ comments: Comment[] }>(`/articles/${slug}/comments`).then(data => data.comments);
}

export function addComment(slug: string, body: string): Promise<Comment> {
  return apiClient<{ comment: Comment }>(`/articles/${slug}/comments`, {
    method: 'POST',
    body: { comment: { body } },
  }).then(data => data.comment);
}

export function deleteComment(commentId: string, slug: string): Promise<void> {
  return apiClient<void>(`/articles/${slug}/comments/${commentId}`, { method: 'DELETE' });
}

export function useComments(slug: string | undefined) {
  return useQuery({
    queryKey: ['comments', slug],
    queryFn: () => fetchComments(slug!),
    enabled: Boolean(slug),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
