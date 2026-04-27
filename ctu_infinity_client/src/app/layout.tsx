import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/providers/AuthProvider';
import { Toaster } from '@/components/ui/sonner';
import { ClientProviders } from '@/providers/ClientProvider';
import { ChatbotWidget } from '@/components/chatbot/ChatbotWidget';

export const metadata: Metadata = {
  title: 'CTU Infinity',
  description: 'CTU Infinity',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ClientProviders>{children}</ClientProviders>
          <ChatbotWidget />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
