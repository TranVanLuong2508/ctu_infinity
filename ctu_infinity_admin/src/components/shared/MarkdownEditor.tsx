'use client';

import { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Quote,
  Code,
  ImageIcon,
} from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Nhập nội dung...',
  minHeight = '300px',
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = useCallback(
    (before: string, after: string = '', placeholder: string = '') => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const textToInsert = selectedText || placeholder;

      const newText =
        value.substring(0, start) +
        before +
        textToInsert +
        after +
        value.substring(end);

      onChange(newText);

      // Set cursor position after insertion
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + before.length + textToInsert.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [value, onChange],
  );

  const toolbarButtons = [
    {
      icon: <Bold className="h-4 w-4" />,
      title: 'Đậm (Ctrl+B)',
      action: () => insertText('**', '**', 'văn bản đậm'),
    },
    {
      icon: <Italic className="h-4 w-4" />,
      title: 'Nghiêng (Ctrl+I)',
      action: () => insertText('*', '*', 'văn bản nghiêng'),
    },
    {
      icon: <Underline className="h-4 w-4" />,
      title: 'Gạch chân',
      action: () => insertText('<u>', '</u>', 'văn bản gạch chân'),
    },
    { separator: true },
    {
      icon: <Heading1 className="h-4 w-4" />,
      title: 'Tiêu đề 1',
      action: () => insertText('# ', '', 'Tiêu đề 1'),
    },
    {
      icon: <Heading2 className="h-4 w-4" />,
      title: 'Tiêu đề 2',
      action: () => insertText('## ', '', 'Tiêu đề 2'),
    },
    {
      icon: <Heading3 className="h-4 w-4" />,
      title: 'Tiêu đề 3',
      action: () => insertText('### ', '', 'Tiêu đề 3'),
    },
    { separator: true },
    {
      icon: <List className="h-4 w-4" />,
      title: 'Danh sách không thứ tự',
      action: () => insertText('- ', '', 'Mục danh sách'),
    },
    {
      icon: <ListOrdered className="h-4 w-4" />,
      title: 'Danh sách có thứ tự',
      action: () => insertText('1. ', '', 'Mục danh sách'),
    },
    { separator: true },
    {
      icon: <Link className="h-4 w-4" />,
      title: 'Liên kết',
      action: () => insertText('[', '](url)', 'văn bản liên kết'),
    },
    {
      icon: <ImageIcon className="h-4 w-4" />,
      title: 'Hình ảnh',
      action: () => insertText('![', '](url)', 'mô tả hình ảnh'),
    },
    { separator: true },
    {
      icon: <Quote className="h-4 w-4" />,
      title: 'Trích dẫn',
      action: () => insertText('> ', '', 'Trích dẫn'),
    },
    {
      icon: <Code className="h-4 w-4" />,
      title: 'Code',
      action: () => insertText('`', '`', 'code'),
    },
  ];

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border border-border rounded-md bg-muted/30">
        {toolbarButtons.map((button, index) =>
          button.separator ? (
            <div key={`sep-${index}`} className="w-px h-6 bg-border mx-1" />
          ) : (
            <Button
              key={index}
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={button.action}
              title={button.title}
            >
              {button.icon}
            </Button>
          ),
        )}
      </div>

      {/* Editor */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y font-mono"
        style={{ minHeight }}
        onKeyDown={(e) => {
          if (e.ctrlKey || e.metaKey) {
            if (e.key === 'b') {
              e.preventDefault();
              insertText('**', '**', 'văn bản đậm');
            } else if (e.key === 'i') {
              e.preventDefault();
              insertText('*', '*', 'văn bản nghiêng');
            }
          }
        }}
      />

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        💡 Hỗ trợ Markdown: **đậm**, *nghiêng*, [liên kết](url), ![ảnh](url)
      </p>
    </div>
  );
}
