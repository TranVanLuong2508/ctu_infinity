'use client';

import { useEffect, useRef } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChatbotStore } from '@/stores/chatbotStore';
import { useAuthStore } from '@/stores/authStore';
import { IChatMessage } from '@/services/chatbot.service';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';

// ─── Typing indicator ────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

// ─── Single message bubble ────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: IChatMessage }) {
  const router = useRouter();
  const closeChatbot = useChatbotStore((s) => s.close);
  const isUser = msg.role === 'user';
  const time = msg.timestamp
    ? new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })
    : '';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="flex flex-col gap-1 max-w-[80%]">
        <div
          className={
            isUser
              ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2 text-sm'
              : 'bg-muted text-foreground rounded-2xl rounded-bl-sm px-4 py-2 text-sm'
          }
        >
          {isUser ? (
            msg.content
          ) : (
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="underline text-blue-600 dark:text-blue-400"
                    onClick={(e) => {
                      if (!href) return;
                      e.preventDefault();
                      router.push(href);
                      closeChatbot();
                    }}
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {msg.content}
            </ReactMarkdown>
          )}
        </div>
        <p
          className={`text-xs text-muted-foreground ${isUser ? 'text-right' : 'text-left'}`}
        >
          {time}
        </p>
      </div>
    </div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────
export function ChatbotWidget() {
  const { isAuthenticated } = useAuthStore();
  const {
    isOpen,
    isLoading,
    messages,
    inputValue,
    toggleOpen,
    close,
    setInput,
    sendMessage,
  } = useChatbotStore();

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Xử lý sự kiện click ra bên ngoài để đóng Chatbot
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isOpen &&
        widgetRef.current &&
        !widgetRef.current.contains(event.target as Node)
      ) {
        close();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, close]);

  // Tự scroll xuống khi có tin mới hoặc loading indicator thay đổi
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input khi mở chatbot
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Không render nếu chưa đăng nhập
  if (!isAuthenticated) return null;

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;
    sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div ref={widgetRef} className="fixed sm:bottom-6 sm:right-6 bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {/* Cửa sổ chat */}
      {isOpen && (
        <div
          className={[
            'flex flex-col',
            'w-[340px] max-w-[calc(100vw-2rem)] h-[400px] max-h-[60vh] sm:w-[360px] sm:h-[520px] sm:max-h-[80vh]',
            'rounded-2xl shadow-2xl border border-border bg-card',
            'transition-all duration-200 ease-in-out',
          ].join(' ')}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground rounded-t-2xl shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">Infinity Bot</p>
                <p className="text-xs opacity-75">Hỗ trợ tư vấn</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8"
              onClick={close}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-2">
                <Bot className="w-10 h-10 opacity-30" />
                <p className="text-sm">Xin chào! Tôi có thể giúp bạn về điểm rèn luyện và sự kiện.</p>
              </div>
            )}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-border p-3 flex items-center gap-2 shrink-0">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhắn tin với trợ lý..."
              disabled={isLoading}
              className="flex-1 text-sm"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <Button
        size="icon"
        className="w-14 h-14 rounded-full shadow-lg"
        onClick={toggleOpen}
        aria-label={isOpen ? 'Đóng chatbot' : 'Mở chatbot'}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </Button>
    </div>
  );
}
