'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { templateApi, EventTemplate } from '@/services/eventTemplate.service';
import { TemplateManager } from './_components/TemplateManager';
import { EventCreateForm } from './_components/EventCreateForm';
import AdminHeader from '@/components/admin/layout/AdminHeader';

type Tab = 'form' | 'templates';

export default function EventManagementPage() {
    const [tab, setTab] = useState<Tab>('form');
    const [templates, setTemplates] = useState<EventTemplate[]>([]);
    const [loadingTpl, setLoadingTpl] = useState(false);
    const [selectedTpl, setSelectedTpl] = useState<EventTemplate | null>(null);

    const loadTemplates = useCallback(async () => {
        setLoadingTpl(true);
        try {
            const res = await templateApi.list();
            setTemplates(res.data?.templates ?? []);
        } catch { /* silent */ }
        finally { setLoadingTpl(false); }
    }, []);

    useEffect(() => { loadTemplates(); }, [loadTemplates]);

    const handleSelectTemplate = (tpl: EventTemplate) => {
        setSelectedTpl(tpl);
        setTab('form');
    };

    return (
        <div className="flex flex-col h-full w-full">
            <AdminHeader />

            {/* Main */}
            <main className="flex-1 overflow-auto p-6">
                {/* Tab switcher */}
                <div className="inline-flex rounded-lg border border-border bg-muted p-1 mb-6 max-w-sm w-full">
                    {([
                        { value: 'form', label: `Tạo sự kiện` },
                        { value: 'templates', label: `Template (${templates.length})` },
                    ] as const).map((t) => (
                        <button
                            key={t.value}
                            onClick={() => setTab(t.value)}
                            className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${tab === t.value
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {tab === 'form' && (
                    <EventCreateForm
                        templates={templates}
                        initialTemplate={selectedTpl}
                        onToast={(ok, msg) => ok ? toast.success(msg) : toast.error(msg)}
                    />
                )}

                {tab === 'templates' && (
                    <TemplateManager
                        templates={templates}
                        selected={selectedTpl}
                        loading={loadingTpl}
                        onRefresh={loadTemplates}
                        onSelect={handleSelectTemplate}
                    />
                )}
            </main>
        </div>
    );
}
