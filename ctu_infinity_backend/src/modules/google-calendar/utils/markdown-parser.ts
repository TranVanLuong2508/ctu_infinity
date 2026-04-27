export function parseMarkdownToPlainText(markdown: string | undefined): string {
  if (!markdown) return '';

  let text = markdown;

  text = text.replace(/^#{1,6}\s+(.+)$/gm, '$1');
  text = text.replace(/\*\*(.+?)\*\*/g, '$1');
  text = text.replace(/__(.+?)__/g, '$1');
  text = text.replace(/\*(.+?)\*/g, '$1');
  text = text.replace(/_(.+?)_/g, '$1');
  text = text.replace(/~~(.+?)~~/g, '$1');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1');
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`(.+?)`/g, '$1');
  text = text.replace(/^>\s+(.+)$/gm, '$1');
  text = text.replace(/^[-*_]{3,}$/gm, '');
  text = text.replace(/^[*+-]\s+(.+)$/gm, '- $1');
  text = text.replace(/^\d+\.\s+(.+)$/gm, '- $1');
  text = text.replace(/\n{3,}/g, '\n\n');

  text = text.trim();

  return text;
}
