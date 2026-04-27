'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { useAppRouter } from '@/hooks/useAppRouter';
import { usePathname } from 'next/navigation';
import { appPath } from '@/constants/path';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathName = usePathname();

  const {
    fetchAccountAction,
    resetAuthAction,
    isRefreshToken,
    errorRefreshToken,
    setRefreshTokenAction,
    setLoading,
  } = useAuthStore();

  const { goLogin, goAdmin } = useAppRouter();

  const fetchAccount = async () => {
    try {
      const accessToken = useAuthStore.getState().access_token;

      // setLoading(false);
      if (accessToken) {
        setLoading(true);
        const res = await authService.callFetchAccount();
        if (res && res.data) {
          fetchAccountAction(res.data.user);
          if (pathName === appPath.HOME || pathName === appPath.LOGIN) {
            goAdmin();
          }
        } else {
          resetAuthAction();
          goLogin();
        }
        setLoading(false);
      }
    } catch (errr) {
      console.log(errr);
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAccount();
  }, []);

  useEffect(() => {
    if (isRefreshToken) {
      toast.error(errorRefreshToken);
      setRefreshTokenAction(false, '');
      goLogin();
    }
  }, [isRefreshToken]);

  return <>{children}</>;
}
