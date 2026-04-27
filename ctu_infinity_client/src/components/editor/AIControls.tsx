'use client';

import { useState } from 'react';
import type { AIAction } from './types';

interface AIControlsProps {
    onExecute: (action: AIAction, customPrompt?: string) => void;
    isLoading: boolean;
}

export default function AIControls({ onExecute, isLoading }: AIControlsProps) {
    const [selectedAction, setSelectedAction] = useState<AIAction>('improve');
    const [customPrompt, setCustomPrompt] = useState('');

    const aiActions = [
        { value: 'improve' as AIAction, label: 'Cải thiện văn bản', description: 'Làm văn bản rõ ràng hơn' },
        { value: 'continue' as AIAction, label: 'Tiếp tục viết', description: 'AI viết tiếp' },
        { value: 'summarize' as AIAction, label: 'Tóm tắt', description: 'Tạo summary' },
        { value: 'translate' as AIAction, label: 'Dịch thuật', description: 'Dịch Việt ↔ Anh' },
        { value: 'custom' as AIAction, label: 'Tùy chỉnh', description: 'Prompt tùy chỉnh' },
    ];

    const handleExecute = () => {
        if (selectedAction === 'custom' && !customPrompt.trim()) {
            alert('Vui lòng nhập prompt!');
            return;
        }
        onExecute(selectedAction, customPrompt);
        setCustomPrompt(''); // Clear after execute
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleExecute();
        }
    };

    return (
        <>
            {/* AI DROPDOWN - Góc trên trái */}
            <div className="ai-dropdown-container">
                <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value as AIAction)}
                    className="ai-dropdown"
                    disabled={isLoading}
                >
                    {aiActions.map((action) => (
                        <option key={action.value} value={action.value}>
                            {action.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* PROMPT INPUT - Dưới cùng */}
            <div className="ai-prompt-bar">
                <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tell AI what else needs to be changed..."
                    className="ai-prompt-input"
                    disabled={isLoading}
                />
                <button
                    onClick={handleExecute}
                    disabled={isLoading}
                    className="ai-prompt-submit"
                    title="Execute AI action"
                >
                    {isLoading ? (
                        <div className="spinner-small"></div>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 19V5M5 12l7-7 7 7" />
                        </svg>
                    )}
                </button>
            </div>
        </>
    );
}
