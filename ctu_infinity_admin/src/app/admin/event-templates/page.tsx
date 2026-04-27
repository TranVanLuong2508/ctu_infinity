'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { templateApi, EventTemplate } from '@/services/eventTemplate.service';
import { TemplateManager } from '../events/_components/TemplateManager';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { useAuthStore } from '@/stores/authStore';

export default function EventTemplatesPage() {
  const router = useRouter();
  const { authUser } = useAuthStore();
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<EventTemplate | null>(null);

  const isOrganizer = authUser?.roleName === 'ORGANIZER';
  const organizerId = isOrganizer ? String(authUser?.userId) : undefined;

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await templateApi.list(organizerId);
      setTemplates(res.data?.templates ?? []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [organizerId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleSelect = (tpl: EventTemplate) => {
    setSelected(tpl);
    // Điều hướng đến trang tạo sự kiện (template đã chọn)
    router.push('/admin/event-management/create');
  };

  return (
    <div className="flex flex-col h-full w-full">
      <AdminHeader />
      <main className="flex-1 overflow-auto p-6">
        <TemplateManager
          templates={templates}
          selected={selected}
          loading={loading}
          onRefresh={loadTemplates}
          onSelect={handleSelect}
          organizerId={organizerId}
          isOrganizer={isOrganizer}
        />
      </main>
    </div>
  );
}
