'use client';

import { authService } from '@/services/auth.service';
import { LoginInput } from '@/types/authen.type';
import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { AUTH_MESSAGES } from '@/constants/messages/authMessage';
import { Loader } from 'lucide-react';
import { useAppRouter } from '@/hooks/useAppRouter';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loginAction, setIsLoggingIn, isLoggingIn } = useAuthStore();
  const { goAdmin } = useAppRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const input: LoginInput = {
        email: email,
        password: password,
      };
      const loginResponse = await authService.callLogin(input);
      console.log('Check res', loginResponse);
      if (loginResponse && loginResponse.EC === 1) {
        if (loginResponse.data) {
          const loginData = loginResponse.data;
          loginAction(loginData);
        }
        setTimeout(() => {
          setIsLoggingIn(false);
          toast.success(AUTH_MESSAGES.success);
        }, 500);
        goAdmin();
      }
    } catch (error) {
      console.log('error login', error);
      setIsLoggingIn(false);
      toast.error(AUTH_MESSAGES.errorLogin);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow-sm"
        aria-label="Login form"
      >
        <h1 className="text-xl font-semibold mb-6 text-gray-900">Đăng nhập</h1>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="login@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mật khẩu
          </label>
          <input
            type="password"
            name="password"
            required
            value={password}
            autoComplete="off"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <Button
          type="submit"
          className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoggingIn ? (
            <>
              <Loader className="animate-spin text-white" size={20} />
              Đang đăng nhập...
            </>
          ) : (
            'Đăng nhập'
          )}
        </Button>
      </form>
    </div>
  );
}
