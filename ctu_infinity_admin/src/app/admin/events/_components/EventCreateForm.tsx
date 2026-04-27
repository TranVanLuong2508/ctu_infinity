'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  templateApi,
  eventApi,
  EventTemplate,
} from '@/services/eventTemplate.service';

type Mode = 'manual' | 'template' | 'ai';

interface EventForm {
  eventName: string;
  organizer: string;
  location: string;
  startDate: string;
  endDate: string;
  maxParticipants: string;
  organizerId: string;
}

const MODES: { value: Mode; label: string }[] = [
  { value: 'manual', label: 'Viết tay' },
  { value: 'template', label: 'Template' },
  { value: 'ai', label: 'AI Prompt' },
];

const INPUT_CLS =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

interface Props {
  templates: EventTemplate[];
  initialTemplate?: EventTemplate | null;
  onToast: (ok: boolean, msg: string) => void;
}

export function EventCreateForm({
  templates,
  initialTemplate,
  onToast,
}: Props) {
  const [form, setForm] = useState<EventForm>({
    eventName: '',
    organizer: '',
    location: '',
    startDate: '',
    endDate: '',
    maxParticipants: '',
    organizerId: '',
  });
  const [mode, setMode] = useState<Mode>(
    initialTemplate ? 'template' : 'manual',
  );
  const [selectedTpl, setSelectedTpl] = useState<EventTemplate | null>(
    initialTemplate ?? null,
  );
  const [manualMd, setManualMd] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generated, setGenerated] = useState('');
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewRendered, setPreviewRendered] = useState(true);

  const f = (k: keyof EventForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const finalMd = mode === 'manual' ? manualMd : generated;

  const handleGenerate = async () => {
    if (!selectedTpl) {
      onToast(false, 'Chọn template trước!');
      return;
    }
    if (mode === 'ai' && !aiPrompt.trim()) {
      onToast(false, 'Nhập yêu cầu AI!');
      return;
    }
    setGenerating(true);
    try {
      const res = await templateApi.apply({
        templateId: selectedTpl.id,
        eventName: form.eventName || undefined,
        organizer: form.organizer || undefined,
        location: form.location || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        maxParticipants: form.maxParticipants
          ? Number(form.maxParticipants)
          : undefined,
        aiPrompt: mode === 'ai' ? aiPrompt : undefined,
      });
      setGenerated(res.data?.description ?? '');
    } catch (e: any) {
      onToast(false, e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.eventName || !form.startDate || !form.endDate) {
      onToast(false, 'Thiếu: Tên sự kiện, Ngày bắt đầu, Ngày kết thúc');
      return;
    }
    setSubmitting(true);
    try {
      await eventApi.create({
        eventName: form.eventName,
        description: finalMd || undefined,
        location: form.location || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        maxParticipants: form.maxParticipants
          ? Number(form.maxParticipants)
          : undefined,
        organizerId: form.organizerId || undefined,
      });
      onToast(true, '✅ Tạo sự kiện thành công!');
      setForm({
        eventName: '',
        organizer: '',
        location: '',
        startDate: '',
        endDate: '',
        maxParticipants: '',
        organizerId: '',
      });
      setManualMd('');
      setGenerated('');
    } catch (e: any) {
      onToast(false, e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* ── Left: form ─────────────────────────────────────────────── */}
      <div className="space-y-5">
        {/* Event info */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Thông tin sự kiện</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Tên sự kiện <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.eventName}
                onChange={f('eventName')}
                placeholder="VD: Ngày hội Hiến máu tình nguyện CTU 2025"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Ban tổ chức
                </label>
                <Input
                  value={form.organizer}
                  onChange={f('organizer')}
                  placeholder="VD: Đoàn Thanh niên CTU"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Địa điểm
                </label>
                <Input
                  value={form.location}
                  onChange={f('location')}
                  placeholder="VD: Hội trường A, CTU"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Ngày bắt đầu <span className="text-destructive">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={f('startDate')}
                  className={INPUT_CLS}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Ngày kết thúc <span className="text-destructive">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={f('endDate')}
                  className={INPUT_CLS}
                />
              </div>
            </div>
            <div className="w-36 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Số người tối đa
              </label>
              <Input
                type="number"
                value={form.maxParticipants}
                onChange={f('maxParticipants')}
                placeholder="200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Description mode */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Mô tả sự kiện</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode selector */}
            <div className="flex gap-2">
              {MODES.map((m) => (
                <Button
                  key={m.value}
                  variant={mode === m.value ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setMode(m.value);
                    setGenerated('');
                  }}
                >
                  {m.label}
                </Button>
              ))}
            </div>

            {/* Manual */}
            {mode === 'manual' && (
              <textarea
                value={manualMd}
                onChange={(e) => setManualMd(e.target.value)}
                rows={12}
                placeholder="Nhập markdown mô tả sự kiện…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            )}

            {/* Template */}
            {mode === 'template' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Chọn template
                  </label>
                  <select
                    value={selectedTpl?.id ?? ''}
                    onChange={(e) => {
                      setSelectedTpl(
                        templates.find((t) => t.id === e.target.value) ?? null,
                      );
                      setGenerated('');
                    }}
                    className={INPUT_CLS}
                  >
                    <option value="">-- Chọn template --</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                        {t.type ? ` (${t.type})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedTpl && (
                  <p className="text-xs text-muted-foreground">
                    Biến:{' '}
                    {selectedTpl.variables.map((v) => (
                      <code
                        key={v}
                        className="mx-0.5 bg-muted px-1 py-0.5 rounded text-primary text-xs"
                      >{`{{${v}}}`}</code>
                    ))}
                  </p>
                )}
                <Button
                  onClick={handleGenerate}
                  disabled={!selectedTpl || generating}
                  size="sm"
                >
                  {generating ? 'Đang áp dụng…' : 'Áp dụng template'}
                </Button>
              </div>
            )}

            {/* AI */}
            {mode === 'ai' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Template gốc <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={selectedTpl?.id ?? ''}
                    onChange={(e) => {
                      setSelectedTpl(
                        templates.find((t) => t.id === e.target.value) ?? null,
                      );
                      setGenerated('');
                    }}
                    className={INPUT_CLS}
                  >
                    <option value="">
                      -- Chọn template để AI cải thiện --
                    </option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                        {t.type ? ` (${t.type})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Yêu cầu AI
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={3}
                    placeholder="VD: Nhấn mạnh đây là lần thứ 10, khuyến khích sinh viên năm nhất…"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  />
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={!selectedTpl || !aiPrompt.trim() || generating}
                  size="sm"
                >
                  {generating ? '⏳ AI đang sinh…' : '✨ Sinh mô tả bằng AI'}
                </Button>
              </div>
            )}

            {/* Generated result */}
            {generated && mode !== 'manual' && (
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <Badge
                    variant="outline"
                    className="text-xs text-green-600 dark:text-green-400 border-green-300 dark:border-green-700"
                  >
                    ✅ Mô tả đã tạo
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setManualMd(generated);
                      setMode('manual');
                    }}
                  >
                    Chỉnh sửa →
                  </Button>
                </div>
                <textarea
                  value={generated}
                  onChange={(e) => setGenerated(e.target.value)}
                  rows={7}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
          onClick={handleSubmit}
          disabled={
            submitting || !form.eventName || !form.startDate || !form.endDate
          }
        >
          {submitting ? 'Đang tạo…' : 'Tạo sự kiện'}
        </Button>
      </div>

      {/* ── Right: preview ──────────────────────────────────────────── */}
      <div className="lg:sticky lg:top-20">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Xem trước mô tả</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setPreviewRendered((v) => !v)}
              >
                {previewRendered ? 'Xem raw' : 'Xem render'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {previewRendered ? (
              finalMd ? (
                <div className="md-preview text-sm text-foreground leading-relaxed">
                  <ReactMarkdown>{finalMd}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                  <span className="text-3xl">📄</span>
                  <p className="text-sm">Chưa có nội dung</p>
                </div>
              )
            ) : (
              <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-words min-h-40">
                {finalMd || '(trống)'}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
