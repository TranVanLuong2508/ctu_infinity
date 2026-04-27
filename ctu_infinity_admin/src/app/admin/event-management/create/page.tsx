'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { templateApi, EventTemplate } from '@/services/eventTemplate.service';
import { EventCreateFormWithUpload } from './_components/EventCreateFormWithUpload';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/layout/AdminHeader';

export default function CreateEventPage() {
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [loadingTpl, setLoadingTpl] = useState(false);
  const router = useRouter();

  const loadTemplates = useCallback(async () => {
    setLoadingTpl(true);
    try {
      const res = await templateApi.list();
      setTemplates(res.data?.templates ?? []);
    } catch {
      /* silent */
    } finally {
      setLoadingTpl(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleSuccess = () => {
    toast.success('Tạo sự kiện thành công!');
    setTimeout(() => {
      router.push('/admin/event-management');
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full w-full">
      <AdminHeader />

      {/* Main */}
      <main className="flex-1 overflow-hidden p-6">
        {/* Back navigation */}
        <button
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground transition-colors text-sm mb-6 flex items-center gap-1"
        >
          ← Quay lại
        </button>
        <EventCreateFormWithUpload
          templates={templates}
          onToast={(ok, msg) => ok ? toast.success(msg) : toast.error(msg)}
          onSuccess={handleSuccess}
        />
      </main>
    </div>
  );
}
