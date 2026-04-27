'use client';

import { useAuthStore } from '@/stores/authStore';
import { NotPermitted } from './not-permitted';
import { useAppRouter } from '@/hooks/useAppRouter';
import { useEffect } from 'react';
import { Loading } from '../shared/Loading';

export const RoleBaseRoute = ({ children }: { children: React.ReactNode }) => {
  const { authUser } = useAuthStore();

  if (authUser.roleName !== 'NORMAL_USER') {
    return <>{children}</>;
  } else {
    return (
      <>
        <NotPermitted />
      </>
    );
  }
};

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { goLogin } = useAppRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      goLogin();
    }
  }, [isLoading]);

  return (
    <>
      {isLoading === true ? (
        <>
          <Loading />
        </>
      ) : (
        <>
          {isAuthenticated === true ? (
            <>
              <RoleBaseRoute>{children}</RoleBaseRoute>
            </>
          ) : null}
        </>
      )}
    </>
  );
};
