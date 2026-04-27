'use client';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { User, LogOut, Bell, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { TabHeaderName } from '@/constants/path';
import { authService } from '@/services/auth.service';
import { AUTH_MESSAGES } from '@/constants/messages/authMessage';
import { toast } from 'sonner';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useEffect } from 'react';

export default function AdminHeader() {
  const { authUser, logOutAction } = useAuthStore();
  const { goLogin } = useAppRouter();
  const pathName = usePathname();
  const tabHeaderName = TabHeaderName[pathName];

  const haneleLogOut = async () => {
    try {
      const res = await authService.callLogout();

      if (res && res.EC === 1) {
        goLogin();
        toast.success(AUTH_MESSAGES.logoutSucess);
        logOutAction();
      }
    } catch (error) {
      toast.error('Đăng xuất thất bại. Vui lòng thử lại.');
      console.log('Error from log out:', error);
    }
  };

  return (
    <>
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b bg-white px-6 py-4">
        <SidebarTrigger />
        <h1 className="text-2xl font-bold flex-1 ">{tabHeaderName}</h1>
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-gray-100 hover:bg-gray-200 cursor-pointer">
              <User className="w-4 h-4 text-gray-700" />
              <span className="text-sm font-medium">
                {authUser.fullName ?? 'Tài khoản'}
              </span>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-48 mr-2">
            <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => {
                haneleLogOut();
              }}
              className="cursor-pointer text-red-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>{' '}
      </header>
    </>
  );
}
