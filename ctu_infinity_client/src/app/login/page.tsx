'use client';

import type React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { AUTH_MESSAGES } from '@/constants/messages/authMessage';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { loginAction } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await authService.callLogin({ email, password });

      if (res && res.data) {
        loginAction({
          access_token: res.data.access_token,
          user: res.data.user,
        });

        toast.success(AUTH_MESSAGES.success);
        router.push('/dashboard');
      } else {
        toast.error(AUTH_MESSAGES.invalid);
      }
    } catch (error: any) {
      console.error('Login error:', error);

      // Xử lý lỗi từ API
      const errorMessage = error?.statusCode === 401 ? AUTH_MESSAGES.invalid : AUTH_MESSAGES.errorLogin
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background via-background to-secondary/20 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <Image
              src="/logo.png"
              alt="CTU Infinity"
              width={120}
              height={120}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-balance text-center">
            Quản lý Điểm Rèn Luyện
          </h1>
          <p className="text-muted-foreground text-center mt-2">
            Đại học Cần Thơ
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Đăng nhập</CardTitle>
            <CardDescription className="text-center">
              Nhập Email và mật khẩu để tiếp tục
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@ctu.edu.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="bg-background"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Bằng việc đăng nhập, bạn đồng ý với Điều khoản sử dụng
        </p>
      </div>
    </div>
  );
}
