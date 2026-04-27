import { Editor } from '@tiptap/react';

export type AIAction = 'improve' | 'continue' | 'summarize' | 'translate' | 'custom';

export interface AIMenuProps {
    editor: Editor;
    isOpen: boolean;
    onClose: () => void;
    selectedText: string;
}

export interface EditorToolbarProps {
    editor: Editor;
    onAIClick: () => void;
}

export interface AIRequest {
    prompt: string;
    context?: string;
    action: AIAction;
}

export interface AIResponse {
    content: string;
    error?: string;
}
