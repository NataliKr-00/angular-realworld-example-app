import { marked } from 'marked';
import DOMPurify from 'dompurify';

export function renderMarkdown(content: string): string {
  const html = marked.parse(content, { async: false });
  return DOMPurify.sanitize(html);
}
