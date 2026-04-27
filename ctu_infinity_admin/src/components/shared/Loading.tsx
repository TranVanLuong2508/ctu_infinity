'use client';

import { Loader2 } from 'lucide-react';

export const Loading = () => {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />

        <p className="text-gray-700 text-base font-medium">
          Đang tải dữ liệu, vui lòng chờ...
        </p>
      </div>
    </div>
  );
};
