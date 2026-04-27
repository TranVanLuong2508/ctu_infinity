import { create } from 'zustand';
import { chatbotService, IChatMessage } from '@/services/chatbot.service';

type IEventLink = { eventName: string; eventUrl: string };

function escapeMarkdownText(text: string): string {
  // Escape tối thiểu để ReactMarkdown không vỡ format link khi eventName có ký tự đặc biệt
  return text.replace(/\\/g, '\\\\').replace(/\[/g, '\\[').replace(/\]/g, '\\]');
}

function extractEventLinks(payload: unknown): IEventLink[] {
  const linksByUrl = new Map<string, string>(); // url -> eventName
  const visited = new Set<unknown>();

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    if (visited.has(node)) return;
    visited.add(node);

    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }

    const obj = node as Record<string, unknown>;

    const eventUrl = obj.eventUrl;
    const eventName = obj.eventName ?? obj.eventTitle ?? obj.name;
    if (typeof eventUrl === 'string' && eventUrl.trim()) {
      const url = eventUrl.trim();
      const nameStr = typeof eventName === 'string' && eventName.trim() ? eventName.trim() : url;
      if (!linksByUrl.has(url)) linksByUrl.set(url, nameStr);
    }

    for (const value of Object.values(obj)) {
      walk(value);
    }
  };

  walk(payload);

  return Array.from(linksByUrl.entries()).map(([eventUrl, eventName]) => ({
    eventUrl,
    eventName,
  }));
}

interface IChatbotState {
  isOpen: boolean;
  isLoading: boolean;
  messages: IChatMessage[];
  inputValue: string;
}

interface IChatbotActions {
  toggleOpen: () => void;
  close: () => void;
  setInput: (value: string) => void;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
}

const initialState: IChatbotState = {
  isOpen: false,
  isLoading: false,
  messages: [],
  inputValue: '',
};

export const useChatbotStore = create<IChatbotState & IChatbotActions>(
  (set) => ({
    ...initialState,

    toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),

    close: () => set({ isOpen: false }),

    setInput: (value: string) => set({ inputValue: value }),

    clearMessages: () => set({ messages: [] }),

    sendMessage: async (message: string) => {
      const userMsg: IChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      };

      set((s) => ({
        messages: [...s.messages, userMsg],
        isLoading: true,
        inputValue: '',
      }));

      try {
        const res = await chatbotService.chat({ question: message });

        const answer = res?.data?.answer;
        const eventLinks = (res?.data as any)?.eventLinks as
          | Array<{ eventName?: string; eventUrl?: string }>
          | undefined;
        const answerWithLinks =
          answer && eventLinks?.length
            ? `${answer}\n\nLink sự kiện:\n${eventLinks
                .filter((l) => typeof l?.eventUrl === 'string' && l.eventUrl.trim())
                .map((l) => `- [${escapeMarkdownText(l.eventName ?? l.eventUrl!)}](${l.eventUrl})`)
                .join('\n')}`
            : answer;

        if (answerWithLinks) {
          const botMsg: IChatMessage = {
            id: crypto.randomUUID(),
            role: 'bot',
            content: answerWithLinks,
            timestamp: new Date(),
          };
          set((s) => ({ messages: [...s.messages, botMsg] }));
        } else {
          const errMsg: IChatMessage = {
            id: crypto.randomUUID(),
            role: 'bot',
            content:
              (res as any)?.message ||
              'Xin lỗi, tôi không thể xử lý yêu cầu của bạn lúc này.',
            timestamp: new Date(),
          };
          set((s) => ({ messages: [...s.messages, errMsg] }));
        }
      } catch (error: any) {
        const errContent =
          error?.response?.data?.message ||
          error?.response?.data?.EM ||
          'Có lỗi kết nối. Vui lòng thử lại sau.';
        const errMsg: IChatMessage = {
          id: crypto.randomUUID(),
          role: 'bot',
          content: errContent,
          timestamp: new Date(),
        };
        set((s) => ({ messages: [...s.messages, errMsg] }));
      } finally {
        set({ isLoading: false });
      }
    },
  }),
);
