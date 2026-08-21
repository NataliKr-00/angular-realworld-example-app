import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '../../../core/api/api-client';
import type { Comment } from '../models/comment.model';
import { addComment, deleteComment, fetchComments } from './comments';

function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve(
    new Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

const mockComment: Comment = {
  id: '1',
  body: 'Test comment',
  createdAt: '2024-01-01',
  author: {
    username: 'testuser',
    bio: 'Test bio',
    image: 'https://example.com/avatar.jpg',
    following: false,
  },
};

const mockComments: Comment[] = [
  mockComment,
  {
    ...mockComment,
    id: '2',
    body: 'Second comment',
  },
];

describe('comments API', () => {
  beforeEach(() => {
    window.localStorage.removeItem('jwtToken');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.removeItem('jwtToken');
  });

  describe('fetchComments', () => {
    it('fetches all comments for an article', async () => {
      vi.mocked(fetch).mockReturnValue(jsonResponse({ comments: mockComments }));
      const comments = await fetchComments('test-article');
      expect(comments).toEqual(mockComments);
      expect(comments.length).toBe(2);
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/articles/test-article/comments`,
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('extracts comments array from the response wrapper', async () => {
      vi.mocked(fetch).mockReturnValue(jsonResponse({ comments: mockComments }));
      const comments = await fetchComments('test-article');
      expect(Array.isArray(comments)).toBe(true);
      expect((comments as { comments?: Comment[] }).comments).toBeUndefined();
    });

    it('handles an empty comments list', async () => {
      vi.mocked(fetch).mockReturnValue(jsonResponse({ comments: [] }));
      const comments = await fetchComments('article-no-comments');
      expect(comments).toEqual([]);
    });

    it('handles article not found', async () => {
      vi.mocked(fetch).mockReturnValue(jsonResponse({ errors: { article: ['not found'] } }, 404));
      await expect(fetchComments('nonexistent')).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('addComment', () => {
    it('adds a new comment to an article', async () => {
      const commentBody = 'This is a new comment';
      vi.mocked(fetch).mockReturnValue(jsonResponse({ comment: { ...mockComment, body: commentBody } }));
      const comment = await addComment('test-article', commentBody);
      expect(comment.body).toBe(commentBody);
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/articles/test-article/comments`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ comment: { body: commentBody } }),
        }),
      );
    });

    it('handles an empty comment body', async () => {
      vi.mocked(fetch).mockReturnValue(jsonResponse({ errors: { body: ["can't be blank"] } }, 422));
      await expect(addComment('test-article', '')).rejects.toMatchObject({ status: 422 });
    });
  });

  describe('deleteComment', () => {
    it('deletes a comment', async () => {
      vi.mocked(fetch).mockReturnValue(jsonResponse(null, 204));
      await deleteComment('123', 'test-article');
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/articles/test-article/comments/123`,
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('handles unauthorized delete', async () => {
      vi.mocked(fetch).mockReturnValue(jsonResponse({ errors: { comment: ['forbidden'] } }, 403));
      await expect(deleteComment('123', 'test-article')).rejects.toMatchObject({ status: 403 });
    });
  });
});
