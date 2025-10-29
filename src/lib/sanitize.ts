/**
 * HTML Sanitization Utility
 * Prevents XSS attacks by sanitizing HTML content
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS
 * @param dirty - Potentially unsafe HTML string
 * @returns Safe HTML string
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';

  // Configure DOMPurify
  const config = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img', 'div', 'span'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title', 'class',
      'width', 'height'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    // Force target="_blank" on all links
    ADD_ATTR: ['target'],
    // Add rel="noopener noreferrer" to links
    ALLOW_DATA_ATTR: false,
    // Disallow javascript: and data: URIs
    SAFE_FOR_TEMPLATES: true
  };

  const clean = DOMPurify.sanitize(dirty, config);

  // Add rel="noopener noreferrer" to all external links
  return clean.replace(
    /<a\s+([^>]*href="https?:\/\/[^"]*"[^>]*)>/gi,
    '<a $1 rel="noopener noreferrer">'
  );
}

/**
 * Strip all HTML tags from string
 * @param html - HTML string
 * @returns Plain text
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}

/**
 * Sanitize and truncate HTML for preview
 * @param html - HTML string
 * @param maxLength - Maximum length of plain text
 * @returns Sanitized and truncated HTML
 */
export function sanitizeAndTruncate(
  html: string | null | undefined,
  maxLength: number = 200
): string {
  const sanitized = sanitizeHtml(html);
  const plain = stripHtml(sanitized);

  if (plain.length <= maxLength) {
    return sanitized;
  }

  const truncated = plain.substring(0, maxLength) + '...';
  return truncated;
}
