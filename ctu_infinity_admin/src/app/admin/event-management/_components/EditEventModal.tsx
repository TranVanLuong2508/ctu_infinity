'use client';

import { useState, useEffect } from 'react';
import {
  eventMgmtApi,
  IEvent,
  IUpdateEventPayload,
} from '@/services/event-management.service';
import { categoryApi, ICategory } from '@/services/category.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface Props {
  event: IEvent;
  onClose: () => void;
  onSuccess: () => void;
  onToast: (ok: boolean, msg: string) => void;
}

/** Chuyển ISO string → giá trị cho input[type=datetime-local] (YYYY-MM-DDThh:mm) */
function toLocalDatetime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export function EditEventModal({ event, onClose, onSuccess, onToast }: Props) {
  const [form, setForm] = useState({
    eventName: event.eventName,
    description: event.description ?? '',
    location: event.location ?? '',
    startDate: toLocalDatetime(event.startDate),
    endDate: toLocalDatetime(event.endDate),
    registrationDeadline: toLocalDatetime(event.registrationDeadline),
    maxParticipants: event.maxParticipants?.toString() ?? '',
    requiresApproval: event.requiresApproval,
    categoryIds: (event.categories ?? []).map((c) => c.categoryId),
  });
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    categoryApi
      .getAll()
      .then((res) => setCategories(res.data?.categories ?? []))
      .catch(() => {});
  }, []);

  const toggleCategory = (id: string) =>
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(id)
        ? f.categoryIds.filter((c) => c !== id)
        : [...f.categoryIds, id],
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.eventName.trim()) {
      onToast(false, 'Vui lòng nhập tên sự kiện');
      return;
    }
    if (!form.startDate || !form.endDate) {
      onToast(false, 'Vui lòng nhập thời gian sự kiện');
      return;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      onToast(false, 'Thời gian kết thúc phải sau thời gian bắt đầu');
      return;
    }
    if (
      form.registrationDeadline &&
      new Date(form.registrationDeadline) >= new Date(form.startDate)
    ) {
      onToast(false, 'Hạn đăng ký phải trước thời gian bắt đầu sự kiện');
      return;
    }

    const payload: IUpdateEventPayload = {
      eventName: form.eventName.trim(),
      description: form.description.trim() || undefined,
      location: form.location.trim() || undefined,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      registrationDeadline: form.registrationDeadline
        ? new Date(form.registrationDeadline).toISOString()
        : undefined,
      maxParticipants: form.maxParticipants
        ? parseInt(form.maxParticipants, 10)
        : undefined,
      requiresApproval: form.requiresApproval,
      categoryIds: form.categoryIds.length > 0 ? form.categoryIds : undefined,
    };

    setSubmitting(true);
    try {
      await eventMgmtApi.update(event.eventId, payload);
      onToast(true, `Đã cập nhật sự kiện "${form.eventName.trim()}" thành công`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string; EM?: string } };
      };
      const msg =
        error?.response?.data?.EM ??
        error?.response?.data?.message ??
        'Cập nhật thất bại';
      onToast(false, msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold">Chỉnh sửa sự kiện</h2>
            <p className="text-sm text-muted-foreground truncate max-w-sm">
              {event.eventName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Tên sự kiện */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">
              Tên sự kiện <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-name"
              value={form.eventName}
              onChange={(e) =>
                setForm((f) => ({ ...f, eventName: e.target.value }))
              }
              placeholder="Nhập tên sự kiện"
            />
          </div>

          {/* Mô tả */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-desc">Mô tả</Label>
            <Textarea
              id="edit-desc"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Mô tả nội dung sự kiện..."
              rows={4}
            />
          </div>

          {/* Địa điểm */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-loc">Địa điểm</Label>
            <Input
              id="edit-loc"
              value={form.location}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
              placeholder="Địa điểm tổ chức"
            />
          </div>

          {/* Thời gian bắt đầu / kết thúc */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-start">
                Bắt đầu <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-start"
                type="datetime-local"
                value={form.startDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-end">
                Kết thúc <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-end"
                type="datetime-local"
                value={form.endDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endDate: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Hạn đăng ký / Số lượng tối đa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-deadline">Hạn đăng ký</Label>
              <Input
                id="edit-deadline"
                type="datetime-local"
                value={form.registrationDeadline}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    registrationDeadline: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-max">Số lượng tối đa</Label>
              <Input
                id="edit-max"
                type="number"
                min={1}
                value={form.maxParticipants}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maxParticipants: e.target.value }))
                }
                placeholder="Không giới hạn"
              />
            </div>
          </div>

          {/* Danh mục */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <Label>Danh mục</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.categoryId}
                    type="button"
                    onClick={() => toggleCategory(cat.categoryId)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      form.categoryIds.includes(cat.categoryId)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {cat.categoryName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Yêu cầu duyệt điểm danh */}
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Yêu cầu duyệt điểm danh</p>
              <p className="text-xs text-muted-foreground">
                Điểm danh sẽ cần admin xét duyệt trước khi cộng điểm
              </p>
            </div>
            <Switch
              checked={form.requiresApproval}
              onCheckedChange={(v) =>
                setForm((f) => ({ ...f, requiresApproval: v }))
              }
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
