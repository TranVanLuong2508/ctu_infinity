import privateAxios from '@/lib/axios/privateAxios';

export interface IChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export interface IChatbotChatPayload {
  question: string;
}

export interface IChatbotChatData {
  answer: string;
  data: unknown[];
  eventLinks?: Array<{
    eventId?: string;
    eventName?: string;
    eventUrl?: string;
  }>;
}

export interface IChatbotChatResponse {
  statusCode: number;
  message: string;
  data: IChatbotChatData;
}

export const chatbotService = {
  chat: (payload: IChatbotChatPayload): Promise<IChatbotChatResponse> => {
    return privateAxios.post('/chatbot/chat', payload);
  },
};
