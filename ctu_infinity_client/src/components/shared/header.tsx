'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Bell, QrCode } from 'lucide-react';
import { UserDropdown } from '@/components/shared/user-dropdown';
import { SubscriptionSettingsModal } from '@/components/dashboard/subscription-settings-modal';
import { useAuthStore } from '@/stores/authStore';

export function Header() {
  const router = useRouter();
  const { authUser, isAuthenticated, isLoading } = useAuthStore();
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isAuthenticated || !authUser) return null;

  return (
    <>
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 w-full">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 h-16">
              <Link href="/dashboard" aria-label="Về trang dashboard" className="h-full py-1">
                <Image
                  src="/logo.png"
                  alt="CTU Infinity"
                  width={64}
                  height={64}
                  className="object-contain h-full w-auto"
                />
              </Link>
              <div>
                <h1 className="text-xl font-bold">Quản lý Điểm Rèn Luyện</h1>
                <p className="text-sm text-muted-foreground">
                  Xin chào, {authUser.fullName || authUser.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="px-2 sm:px-3"
              >
                <Bell className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Thông báo</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/scan-qr')}
                className="px-2 sm:px-3"
              >
                <QrCode className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Quét QR</span>
              </Button>
              <UserDropdown />
            </div>
          </div>
        </div>
      </header>

      <SubscriptionSettingsModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
      />
    </>
  );
}
