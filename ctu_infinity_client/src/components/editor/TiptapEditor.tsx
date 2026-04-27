'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useState } from 'react';

import EditorToolbar from './EditorToolbar';
import AIControls from './AIControls';
import { callAI } from './aiService';
import type { AIAction } from './types';
import './TiptapEditor.css';

const lowlight = createLowlight(common);

interface TiptapEditorProps {
    initialContent?: string;
    onChange?: (content: string) => void;
    placeholder?: string;
    contextData?: {
        title?: string;
        location?: string;
        date?: string;
        [key: string]: any;
    };
}

export default function TiptapEditor({
    initialContent = '',
    onChange,
    placeholder = 'Bắt đầu viết...',
    contextData,
}: TiptapEditorProps) {
    const [isAILoading, setIsAILoading] = useState(false);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                codeBlock: false,
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Placeholder.configure({
                placeholder,
            }),
            Link.configure({
                openOnClick: false,
            }),
            Image,
            Highlight,
            TextStyle,
            Color,
            CodeBlockLowlight.configure({
                lowlight,
            }),
        ],
        content: initialContent,
        onUpdate: ({ editor }) => {
            if (onChange) {
                const htmlContent = editor.getHTML();

                console.log('📝 HTML Content:', htmlContent);
                console.log('📄 Plain Text:', editor.getText());
                console.log('📊 JSON Content:', editor.getJSON());

                onChange(htmlContent);
            }
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none',
            },
        },
    });

    const handleAIExecute = async (action: AIAction, customPrompt?: string) => {
        if (!editor) return;

        setIsAILoading(true);
        try {
            const { from, to } = editor.state.selection;
            const selectedText = editor.state.doc.textBetween(from, to, ' ');
            const editorContext = editor.getText();

            // 🎯 TẠO CONTEXT STRING TỪ FORM DATA
            let formContext = '';
            if (contextData) {
                const parts = [];
                if (contextData.title) parts.push(`Tên sự kiện: "${contextData.title}"`);
                if (contextData.location) parts.push(`Địa điểm: "${contextData.location}"`);
                if (contextData.date) {
                    const dateObj = new Date(contextData.date);
                    const formattedDate = dateObj.toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    parts.push(`Thời gian: ${formattedDate}`);
                }
                if (parts.length > 0) {
                    formContext = `\n\nThông tin sự kiện:\n${parts.join('\n')}`;
                }
            }

            console.log('🤖 AI Context:', formContext);

            let aiPrompt = customPrompt || selectedText || editorContext;

            // Nếu không có custom prompt, dùng default cho action
            if (!customPrompt) {
                if (action === 'improve') {
                    aiPrompt = `Improve this event description: ${selectedText || editorContext}${formContext}`;
                } else if (action === 'continue') {
                    aiPrompt = `Continue writing this event description: ${editorContext}${formContext}`;
                } else if (action === 'summarize') {
                    aiPrompt = `Summarize this event description: ${selectedText || editorContext}${formContext}`;
                } else if (action === 'translate') {
                    aiPrompt = `Translate this event description: ${selectedText || editorContext}${formContext}`;
                }
            } else {
                // Nếu có custom prompt, thêm context vào cuối
                aiPrompt = `${customPrompt}${formContext}`;
            }

            let accumulatedContent = '';

            await callAI(
                aiPrompt,
                action,
                editorContext + formContext, // Context đầy đủ
                (chunk) => {
                    accumulatedContent += chunk;
                    if (selectedText) {
                        // Replace selection
                        editor.chain().focus().deleteSelection().insertContent(accumulatedContent).run();
                    } else {
                        // Insert at cursor
                        editor.chain().focus().insertContent(chunk).run();
                    }
                }
            );
        } catch (error) {
            console.error('AI Error:', error);
            alert('Lỗi khi xử lý AI. Kiểm tra API key!');
        } finally {
            setIsAILoading(false);
        }
    };

    if (!editor) {
        return <div>Loading editor...</div>;
    }

    return (
        <div className="tiptap-editor-container">
            {/* AI DROPDOWN */}
            <AIControls
                onExecute={handleAIExecute}
                isLoading={isAILoading}
            />

            {/* TOOLBAR */}
            <EditorToolbar editor={editor} />

            {/* EDITOR CONTENT */}
            <div className="editor-content-wrapper">
                <EditorContent editor={editor} />
            </div>

            {/* AI LOADING OVERLAY */}
            {isAILoading && (
                <div className="ai-loading-overlay">
                    <div className="spinner"></div>
                    <p>AI đang xử lý...</p>
                </div>
            )}
        </div>
    );
}
