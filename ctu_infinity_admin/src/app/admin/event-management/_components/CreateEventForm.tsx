'use client';

import { useState, useEffect } from 'react';
import {
  eventMgmtApi,
  ICreateEventPayload,
} from '@/services/event-management.service';
import { categoryApi, ICategory } from '@/services/category.service';
import { organizerApi, IOrganizer } from '@/services/organizer.service';
import {
  academicYearApi,
  semestersApi,
  IAcademicYear,
  ISemester,
} from '@/services/academic-schedule.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface CreateEventFormProps {
  onClose: () => void;
  onSuccess: () => void;
  onToast: (ok: boolean, msg: string) => void;
}

interface FormData {
  eventName: string;
  description: string;
  location: string;
  academicYearId: string;
  semesterId: string;
  startDate: string;
  endDate: string;
  maxParticipants: string;
  categoryId: string;
  organizerId: string;
  requiresApproval: boolean;
}

const initialFormData: FormData = {
  eventName: '',
  description: '',
  location: '',
  academicYearId: '',
  semesterId: '',
  startDate: '',
  endDate: '',
  maxParticipants: '',
  categoryId: '',
  organizerId: '',
  requiresApproval: false,
};

export function CreateEventForm({
  onClose,
  onSuccess,
  onToast,
}: CreateEventFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [organizers, setOrganizers] = useState<IOrganizer[]>([]);
  const [academicYears, setAcademicYears] = useState<IAcademicYear[]>([]);
  const [allSemesters, setAllSemesters] = useState<ISemester[]>([]);
  const [filteredSemesters, setFilteredSemesters] = useState<ISemester[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // ── Load categories, organizers, academic years, semesters ───────────
  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, orgRes, yearRes, semRes] = await Promise.all([
          categoryApi.getAll(),
          organizerApi.getAll(),
          academicYearApi.getAll(),
          semestersApi.getAll(),
        ]);
        setCategories(catRes.data?.categories ?? []);
        setOrganizers(orgRes.data?.organizers ?? []);
        setAcademicYears(yearRes.data?.academicYears ?? []);
        setAllSemesters(semRes.data?.semesters ?? []);
      } catch (error) {
        console.error('Error loading data:', error);
        onToast(false, 'Không thể tải danh sách danh mục và ban tổ chức');
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, [onToast]);

  // ── Lọc học kỳ khi năm học thay đổi ─────────────────────────────────
  const handleYearChange = (yearId: string) => {
    setFormData((prev) => ({
      ...prev,
      academicYearId: yearId,
      semesterId: '',
    }));
    setFilteredSemesters(allSemesters.filter((s) => s.yearId === yearId));
  };

  // ── Handle input changes ─────────────────────────────────────────────
  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ── Validate form ────────────────────────────────────────────────────
  const validateForm = (): string | null => {
    if (!formData.eventName.trim()) {
      return 'Vui lòng nhập tên sự kiện';
    }
    if (!formData.startDate) {
      return 'Vui lòng chọn ngày bắt đầu';
    }
    if (!formData.endDate) {
      return 'Vui lòng chọn ngày kết thúc';
    }
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      return 'Ngày bắt đầu phải trước ngày kết thúc';
    }
    if (formData.maxParticipants && Number(formData.maxParticipants) < 1) {
      return 'Số lượng tham gia phải lớn hơn 0';
    }
    return null;
  };

  // ── Handle submit ────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateForm();
    if (error) {
      onToast(false, error);
      return;
    }

    setLoading(true);
    try {
      const payload: ICreateEventPayload = {
        eventName: formData.eventName.trim(),
        description: formData.description.trim() || undefined,
        location: formData.location.trim() || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        maxParticipants: formData.maxParticipants
          ? Number(formData.maxParticipants)
          : undefined,
        categoryIds: formData.categoryId ? [formData.categoryId] : undefined,
        organizerId: formData.organizerId || undefined,
        requiresApproval: formData.requiresApproval,
        semesterId: formData.semesterId || undefined,
      };

      await eventMgmtApi.create(payload);
      onToast(true, `Tạo sự kiện "${formData.eventName}" thành công`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string; EM?: string } };
      };
      const msg =
        error?.response?.data?.message ??
        error?.response?.data?.EM ??
        'Tạo sự kiện thất bại';
      onToast(false, msg);
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl p-6">
          <div className="text-center py-8 text-muted-foreground">
            Đang tải dữ liệu...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-xl font-bold">Tạo sự kiện mới</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Điền thông tin để tạo sự kiện (trạng thái mặc định: Chờ duyệt)
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="eventName">
              Tên sự kiện <span className="text-red-500">*</span>
            </Label>
            <Input
              id="eventName"
              placeholder="VD: Hội thảo khởi nghiệp 2024"
              value={formData.eventName}
              onChange={(e) => handleInputChange('eventName', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              placeholder="Mô tả chi tiết về sự kiện..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Địa điểm</Label>
            <Input
              id="location"
              placeholder="VD: Hội trường A, Trường Đại học Cần Thơ"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
            />
          </div>

          {/* Academic Year */}
          <div className="space-y-2">
            <Label htmlFor="academicYear">Năm học</Label>
            <Select
              value={formData.academicYearId}
              onValueChange={handleYearChange}
            >
              <SelectTrigger id="academicYear">
                <SelectValue placeholder="Chọn năm học (tuỳ chọn)" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((y) => (
                  <SelectItem key={y.yearId} value={y.yearId}>
                    {y.yearName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Semester */}
          <div className="space-y-2">
            <Label htmlFor="semester">
              Học kỳ
              {formData.academicYearId && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({filteredSemesters.length} học kỳ)
                </span>
              )}
            </Label>
            <Select
              value={formData.semesterId}
              onValueChange={(v) => handleInputChange('semesterId', v)}
              disabled={!formData.academicYearId}
            >
              <SelectTrigger id="semester">
                <SelectValue
                  placeholder={
                    formData.academicYearId
                      ? 'Chọn học kỳ (tuỳ chọn)'
                      : 'Chọn năm học trước'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredSemesters.map((s) => (
                  <SelectItem key={s.semesterId} value={s.semesterId}>
                    {s.semesterName}
                    {s.isCurrent && (
                      <span className="ml-2 text-xs text-green-600">
                        (Hiện tại)
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">
                Ngày kết thúc <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Max Participants */}
          <div className="space-y-2">
            <Label htmlFor="maxParticipants">Số lượng tham gia tối đa</Label>
            <Input
              id="maxParticipants"
              type="number"
              placeholder="Để trống nếu không giới hạn"
              min={1}
              value={formData.maxParticipants}
              onChange={(e) =>
                handleInputChange('maxParticipants', e.target.value)
              }
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Danh mục</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => handleInputChange('categoryId', value)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Chọn danh mục (tuỳ chọn)" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.categoryId} value={cat.categoryId}>
                    {cat.categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Organizer */}
          <div className="space-y-2">
            <Label htmlFor="organizer">Ban tổ chức</Label>
            <Select
              value={formData.organizerId}
              onValueChange={(value) => handleInputChange('organizerId', value)}
            >
              <SelectTrigger id="organizer">
                <SelectValue placeholder="Chọn ban tổ chức (tuỳ chọn)" />
              </SelectTrigger>
              <SelectContent>
                {organizers.map((org) => (
                  <SelectItem key={org.organizerId} value={org.organizerId}>
                    {org.organizerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Requires Approval */}
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="requiresApproval" className="cursor-pointer">
                Yêu cầu duyệt điểm danh
              </Label>
              <p className="text-xs text-muted-foreground">
                Nếu bật: Điểm danh cần admin duyệt mới cộng điểm
              </p>
            </div>
            <Switch
              id="requiresApproval"
              checked={formData.requiresApproval}
              onCheckedChange={(checked) =>
                handleInputChange('requiresApproval', checked)
              }
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Đang tạo...' : 'Tạo sự kiện'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
