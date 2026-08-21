import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('renders markdown to HTML', () => {
    const html = renderMarkdown('# Hello');
    expect(html).toContain('<h1>');
    expect(html).toContain('Hello');
  });

  it('sanitizes script tags', () => {
    const html = renderMarkdown('<script>alert("xss")</script>');
    expect(html).not.toContain('<script>');
  });
});
