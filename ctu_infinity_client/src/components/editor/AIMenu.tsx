'use client';

import { useState } from 'react';
import { AIMenuProps, AIAction } from './types';
import { callAI } from './aiService';

export default function AIMenu({ editor, isOpen, onClose, selectedText }: AIMenuProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);

    if (!isOpen) return null;

    const handleAIAction = async (action: AIAction, prompt?: string) => {
        setIsLoading(true);
        try {
            const finalPrompt = prompt || selectedText || editor.getText();
            const context = editor.getText();

            let aiPrompt = finalPrompt;

            if (action === 'improve') {
                aiPrompt = `Improve this text: ${finalPrompt}`;
            } else if (action === 'continue') {
                aiPrompt = `Continue this text: ${finalPrompt}`;
            } else if (action === 'summarize') {
                aiPrompt = `Summarize this text: ${finalPrompt}`;
            } else if (action === 'translate') {
                aiPrompt = `Translate this text: ${finalPrompt}`;
            }

            let accumulatedContent = '';

            await callAI(
                aiPrompt,
                action,
                context,
                (chunk) => {
                    accumulatedContent += chunk;
                    // Cập nhật editor trong real-time
                    if (selectedText) {
                        editor.chain().focus().deleteSelection().insertContent(accumulatedContent).run();
                    } else {
                        editor.chain().focus().insertContent(chunk).run();
                    }
                }
            );

            onClose();
            setShowCustomInput(false);
            setCustomPrompt('');
        } catch (error) {
            console.error('AI Action Error:', error);
            alert('Failed to process AI request. Please check your API key.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="ai-menu-overlay" onClick={onClose}>
            <div className="ai-menu" onClick={(e) => e.stopPropagation()}>
                <div className="ai-menu-header">
                    <h3>✨ AI Assistant</h3>
                    <button onClick={onClose} className="close-button">×</button>
                </div>

                <div className="ai-menu-content">
                    {isLoading ? (
                        <div className="ai-loading">
                            <div className="spinner"></div>
                            <p>AI đang xử lý...</p>
                        </div>
                    ) : showCustomInput ? (
                        <div className="custom-prompt-section">
                            <textarea
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder="Nhập yêu cầu của bạn..."
                                className="custom-prompt-input"
                                rows={4}
                                autoFocus
                            />
                            <div className="custom-prompt-buttons">
                                <button
                                    onClick={() => {
                                        setShowCustomInput(false);
                                        setCustomPrompt('');
                                    }}
                                    className="cancel-button"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={() => handleAIAction('custom', customPrompt)}
                                    className="submit-button"
                                    disabled={!customPrompt.trim()}
                                >
                                    Thực hiện
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="ai-actions">
                            <button
                                onClick={() => handleAIAction('improve')}
                                className="ai-action-button"
                            >
                                <div>
                                    <strong>Cải thiện văn bản</strong>
                                    <p>Làm cho văn bản rõ ràng và chuyên nghiệp hơn</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handleAIAction('continue')}
                                className="ai-action-button"
                            >
                                <div>
                                    <strong>Tiếp tục viết</strong>
                                    <p>AI sẽ tiếp tục viết dựa trên ngữ cảnh</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handleAIAction('summarize')}
                                className="ai-action-button"
                            >
                                <div>
                                    <strong>Tóm tắt</strong>
                                    <p>Tạo bản tóm tắt ngắn gọn</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handleAIAction('translate')}
                                className="ai-action-button"
                            >
                                <div>
                                    <strong>Dịch thuật</strong>
                                    <p>Dịch sang tiếng Việt hoặc tiếng Anh</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setShowCustomInput(true)}
                                className="ai-action-button custom"
                            >
                                <div>
                                    <strong>Yêu cầu tùy chỉnh</strong>
                                    <p>Nhập yêu cầu của riêng bạn</p>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
