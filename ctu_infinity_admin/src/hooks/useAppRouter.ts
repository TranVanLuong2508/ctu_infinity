import { appPath } from '@/constants/path';
import { useRouter } from 'next/navigation';

export const useAppRouter = () => {
  const router = useRouter();

  return {
    goAdmin: () => router.push(appPath.ADMIN),
    goLogin: () => router.push(appPath.LOGIN),
    replaceLogin: () => router.replace(appPath.LOGIN),
  };
};
