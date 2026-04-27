import { appPath } from '@/constants/path';
import { useRouter } from 'next/navigation';

export const useAppRouter = () => {
  const router = useRouter();

  return {
    goLogin: () => router.push(appPath.LOGIN),
    goDashboard: () => router.push(appPath.DASHBOARD),
    replaceLogin: () => router.replace(appPath.LOGIN),
  };
};
