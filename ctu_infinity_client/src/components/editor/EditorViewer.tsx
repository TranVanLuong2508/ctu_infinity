'use client';

import './TiptapEditor.css';

interface EditorViewerProps {
    content: string; // HTML content từ database
    className?: string;
}

/**
 * Component để HIỂN THỊ nội dung HTML từ database
 * Sử dụng component này để render mô tả sự kiện đã lưu
 */
export default function EditorViewer({ content, className = '' }: EditorViewerProps) {
    return (
        <div className={`tiptap-editor-container ${className}`}>
            <div className="editor-content-wrapper">
                <div
                    className="ProseMirror prose prose-sm sm:prose lg:prose-lg xl:prose-2xl"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            </div>
        </div>
    );
}

/**
 * CÁCH SỬ DỤNG:
 * 
 * 1. Lấy content từ database (ví dụ: event.description)
 * 2. Pass vào component này
 * 
 * Example:
 * ```tsx
 * const event = await getEventFromDB(eventId);
 * 
 * <EditorViewer content={event.description} />
 * ```
 */
