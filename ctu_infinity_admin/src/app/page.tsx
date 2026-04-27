import { appPath } from '@/constants/path';
import { redirect } from 'next/navigation';

export default function Home() {
  redirect(appPath.LOGIN);
}
