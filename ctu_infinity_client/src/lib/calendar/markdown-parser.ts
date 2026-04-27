/**
 * Parse markdown text thành plain text để hiển thị trong Google Calendar
 * Loại bỏ markdown syntax nhưng giữ nguyên nội dung
 */
export function parseMarkdownToPlainText(markdown: string | undefined): string {
  if (!markdown) return '';

  let text = markdown;

  // Loại bỏ headers (# ## ###)
  text = text.replace(/^#{1,6}\s+(.+)$/gm, '$1');

  // Loại bỏ bold (**text** hoặc __text__)
  text = text.replace(/\*\*(.+?)\*\*/g, '$1');
  text = text.replace(/__(.+?)__/g, '$1');

  // Loại bỏ italic (*text* hoặc _text_)
  text = text.replace(/\*(.+?)\*/g, '$1');
  text = text.replace(/_(.+?)_/g, '$1');

  // Loại bỏ strikethrough (~~text~~)
  text = text.replace(/~~(.+?)~~/g, '$1');

  // Chuyển links [text](url) thành "text (url)"
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

  // Loại bỏ images ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1');

  // Loại bỏ code blocks (```code```)
  text = text.replace(/```[\s\S]*?```/g, '');

  // Loại bỏ inline code (`code`)
  text = text.replace(/`(.+?)`/g, '$1');

  // Loại bỏ blockquotes (> text)
  text = text.replace(/^>\s+(.+)$/gm, '$1');

  // Loại bỏ horizontal rules (---, ***, ___)
  text = text.replace(/^[-*_]{3,}$/gm, '');

  // Chuyển unordered list thành plain text với dash
  text = text.replace(/^[*+-]\s+(.+)$/gm, '- $1');

  // Chuyển ordered list thành plain text
  text = text.replace(/^\d+\.\s+(.+)$/gm, '- $1');

  // Loại bỏ các dòng trống thừa (nhiều hơn 2 dòng trống liên tiếp)
  text = text.replace(/\n{3,}/g, '\n\n');

  // Trim whitespace
  text = text.trim();

  return text;
}
