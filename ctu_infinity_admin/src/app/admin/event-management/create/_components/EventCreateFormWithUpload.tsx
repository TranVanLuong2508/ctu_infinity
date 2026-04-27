'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  templateApi,
  eventApi,
  EventTemplate,
} from '@/services/eventTemplate.service';
import { categoryApi, ICategory } from '@/services/category.service';
import { organizerApi, IOrganizer } from '@/services/organizer.service';
import {
  academicYearApi,
  semestersApi,
  IAcademicYear,
  ISemester,
} from '@/services/academic-schedule.service';
import { aiService } from '@/services/ai.service';
import { MarkdownEditor } from '@/components/shared/MarkdownEditor';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import privateAxios from '@/lib/axios/privateAxios';
import Image from 'next/image';
import { formatDateTime } from '@/utils/formateDate';

type Mode = 'manual' | 'template' | 'ai';

interface EventForm {
  eventName: string;
  location: string;
  academicYearId: string;
  semesterId: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxParticipants: string;
  categoryIds: string[];
  organizerId: string;
  requiresApproval: boolean;
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
  onSuccess?: () => void;
}

export function EventCreateFormWithUpload({
  templates,
  initialTemplate,
  onToast,
  onSuccess,
}: Props) {
  const [form, setForm] = useState<EventForm>({
    eventName: '',
    location: '',
    academicYearId: '',
    semesterId: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    maxParticipants: '',
    categoryIds: [],
    organizerId: '',
    requiresApproval: false,
  });
  const [mode, setMode] = useState<Mode>(
    initialTemplate ? 'template' : 'manual',
  );
  const [selectedTpl, setSelectedTpl] = useState<EventTemplate | null>(
    initialTemplate ?? null,
  );
  const [manualMd, setManualMd] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [improvePrompt, setImprovePrompt] = useState('');
  const [showImproveAI, setShowImproveAI] = useState(false);
  const [generated, setGenerated] = useState('');
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewRendered, setPreviewRendered] = useState(true);

  // File upload state
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categories, Organizers, Academic Years, Semesters
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [organizers, setOrganizers] = useState<IOrganizer[]>([]);
  const [academicYears, setAcademicYears] = useState<IAcademicYear[]>([]);
  const [allSemesters, setAllSemesters] = useState<ISemester[]>([]);
  const [filteredSemesters, setFilteredSemesters] = useState<ISemester[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const f =
    (k: keyof EventForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string) =>
      setForm((p) => ({
        ...p,
        [k]: typeof e === 'string' ? e : e.target.value,
      }));

  const finalMd = mode === 'manual' ? manualMd : generated;

  // Load categories, organizers, academic years, semesters
  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, orgRes, yearRes, semRes] = await Promise.all([
          categoryApi.getAll(),
          organizerApi.getAll(),
          academicYearApi.getAll(),
          semestersApi.getAll(),
        ]);
        setCategories(catRes.data?.categories || []);
        setOrganizers(orgRes.data?.organizers || []);
        setAcademicYears(yearRes.data?.academicYears ?? []);
        setAllSemesters(semRes.data?.semesters ?? []);
      } catch (error) {
        console.error('Error loading data:', error);
        onToast(false, 'Không thể tải danh sách danh mục và ban tổ chức');
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, [onToast]);

  const handleYearChange = (yearId: string) => {
    setForm((p) => ({ ...p, academicYearId: yearId, semesterId: '' }));
    setFilteredSemesters(allSemesters.filter((s) => s.yearId === yearId));
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onToast(false, 'Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      onToast(false, 'Kích thước file không được vượt quá 5MB');
      return;
    }

    setPosterFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPosterPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload file to server
  const handleUploadFile = async () => {
    if (!posterFile) {
      onToast(false, 'Vui lòng chọn file trước');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', posterFile);

      const res = await privateAxios.post('/file/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.url) {
        setPosterUrl(res.data.url);
        onToast(true, 'Upload poster thành công!');
      } else {
        throw new Error('Không nhận được URL từ server');
      }
    } catch (e: any) {
      onToast(false, e.response?.data?.message || 'Upload thất bại');
    } finally {
      setUploading(false);
    }
  };

  // Remove poster
  const handleRemovePoster = () => {
    setPosterFile(null);
    setPosterPreview(null);
    setPosterUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Build context đầy đủ 9 trường từ form, resolve ID → display name.
   * Context chỉ chứa event facts, không nhúng nội dung đã generate.
   */
  const buildEventContext = (): string => {
    const selectedOrganizer = organizers.find(
      (o) => o.organizerId === form.organizerId,
    );
    const selectedAcademicYear = academicYears.find(
      (y) => y.yearId === form.academicYearId,
    );
    const selectedSemester = filteredSemesters.find(
      (s) => s.semesterId === form.semesterId,
    );

    const lines: string[] = [];

    if (form.eventName) lines.push(`- Tên sự kiện: "${form.eventName}"`);
    if (form.location) lines.push(`- Địa điểm: "${form.location}"`);
    if (selectedAcademicYear)
      lines.push(`- Năm học: ${selectedAcademicYear.yearName}`);
    if (selectedSemester)
      lines.push(`- Học kỳ: ${selectedSemester.semesterName}`);
    if (form.startDate)
      lines.push(
        `- Thời gian bắt đầu: ${formatDateTime(form.startDate)}`,
      );
    if (form.endDate)
      lines.push(
        `- Thời gian kết thúc: ${formatDateTime(form.endDate)}`,
      );
    if (form.registrationDeadline)
      lines.push(
        `- Hạn đăng ký: ${formatDateTime(form.registrationDeadline)}`,
      );
    if (form.maxParticipants)
      lines.push(`- Số lượng tối đa: ${form.maxParticipants} người`);
    if (selectedOrganizer)
      lines.push(`- Ban tổ chức: ${selectedOrganizer.organizerName}`);

    return lines.length > 0 ? `Thông tin sự kiện:\n${lines.join('\n')}` : '';
  };

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
      // Resolve organizerId → organizerName
      const selectedOrganizer = organizers.find(
        (o) => o.organizerId === form.organizerId,
      );

      const res = await templateApi.apply({
        templateId: selectedTpl.id,
        eventName: form.eventName || undefined,
        organizer: selectedOrganizer?.organizerName || undefined,
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
      onToast(false, e.response?.data?.message || e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      onToast(false, 'Nhập yêu cầu AI!');
      return;
    }

    setGenerating(true);
    // Không setGenerated('') ở đây – nếu đang refine thì previousContent cần giữ nguyên

    try {
      const contextStr = buildEventContext();
      const hasPreviousContent = !!generated.trim();

      // Khi refine: prefix prompt để AI hiểu đang chỉnh sửa, không tạo lại
      const effectivePrompt = hasPreviousContent
        ? `Hãy chỉnh sửa nội dung đã có theo yêu cầu. Giữ nguyên tất cả nội dung không bị yêu cầu sửa.\n\nYÊU CẦU: ${aiPrompt}`
        : aiPrompt;

      let resultText = '';
      await aiService.generateDescription(
        {
          prompt: effectivePrompt,
          context: contextStr || undefined,
          previousContent: hasPreviousContent ? generated : undefined,
        },
        (fullText) => {
          resultText = fullText;
          setGenerated(fullText);
        },
      );

      if (!resultText) {
        throw new Error('AI không trả về nội dung');
      }
    } catch (e: any) {
      onToast(false, e.message || 'Lỗi khi gọi AI');
    } finally {
      setGenerating(false);
    }
  };

  const handleImproveWithAI = async () => {
    if (!improvePrompt.trim() || !generated.trim()) return;

    setGenerating(true);
    try {
      const contextStr = buildEventContext();

      await aiService.generateDescription(
        {
          prompt: `Hãy chỉnh sửa nội dung mô tả sự kiện sau theo yêu cầu. Giữ nguyên tất cả nội dung không bị yêu cầu sửa, chỉ thay đổi phần được nêu.\n\nYÊU CẦU CHỈNH SỬA: ${improvePrompt}\n\n---NỘI DUNG HIỆN TẠI:---\n${generated}`,
          context: contextStr || undefined,
          previousContent: generated,
        },
        (fullText) => {
          setGenerated(fullText);
        },
      );

      setShowImproveAI(false);
      setImprovePrompt('');
      onToast(true, 'Đã cập nhật mô tả!');
    } catch (e: any) {
      onToast(false, e.message || 'Lỗi khi cải thiện với AI');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.eventName || !form.startDate || !form.endDate) {
      onToast(false, 'Thiếu: Tên sự kiện, Ngày bắt đầu, Ngày kết thúc');
      return;
    }

    const now = new Date();
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);

    if (start < now) {
      onToast(false, 'Ngày bắt đầu không được trước ngày hôm nay');
      return;
    }
    if (end < start) {
      onToast(false, 'Ngày kết thúc không được trước ngày bắt đầu');
      return;
    }
    if (
      form.registrationDeadline &&
      new Date(form.registrationDeadline) >= start
    ) {
      onToast(false, 'Thời hạn đăng ký phải sớm hơn ngày bắt đầu');
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
        registrationDeadline: form.registrationDeadline || undefined,
        maxParticipants: form.maxParticipants
          ? Number(form.maxParticipants)
          : undefined,
        categoryIds: form.categoryIds.length > 0 ? form.categoryIds : undefined,
        organizerId: form.organizerId || undefined,
        posterUrl: posterUrl || undefined,
        requiresApproval: form.requiresApproval,
        semesterId: form.semesterId || undefined,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        onToast(true, '✅ Tạo sự kiện thành công!');
        setForm({
          eventName: '',
          location: '',
          academicYearId: '',
          semesterId: '',
          startDate: '',
          endDate: '',
          registrationDeadline: '',
          maxParticipants: '',
          categoryIds: [],
          organizerId: '',
          requiresApproval: false,
        });
        setFilteredSemesters([]);
        setManualMd('');
        setGenerated('');
        handleRemovePoster();
      }
    } catch (e: any) {
      onToast(false, e.response?.data?.message || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 h-[calc(100vh-8rem)]">
      {/* ── Left: form (scrollable) ──────────────────────────────── */}
      <div className="overflow-y-auto pr-1 space-y-5">
        {/* Event info */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Thông tin sự kiện</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="eventName">
                Tên sự kiện <span className="text-destructive">*</span>
              </Label>
              <Input
                id="eventName"
                value={form.eventName}
                onChange={f('eventName')}
                placeholder="VD: Ngày hội Hiến máu tình nguyện CTU 2025"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location">Địa điểm</Label>
              <Input
                id="location"
                value={form.location}
                onChange={f('location')}
                placeholder="VD: Hội trường A, CTU"
              />
            </div>

            {/* Academic Year */}
            <div className="space-y-1.5">
              <Label htmlFor="academicYear">Năm học</Label>
              <Select
                value={form.academicYearId}
                onValueChange={handleYearChange}
              >
                <SelectTrigger id="academicYear">
                  <SelectValue placeholder="Chọn năm học (tuỳ chọn)" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((y) => (
                    <SelectItem key={y.yearId} value={y.yearId}>
                      {y.yearName}
                      {y.isCurrent && (
                        <span className="ml-2 text-xs text-green-600">
                          (Hiện tại)
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Semester */}
            <div className="space-y-1.5">
              <Label htmlFor="semester">
                Học kỳ
                {form.academicYearId && filteredSemesters.length > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({filteredSemesters.length} học kỳ)
                  </span>
                )}
              </Label>
              <Select
                value={form.semesterId}
                onValueChange={(v) => setForm((p) => ({ ...p, semesterId: v }))}
                disabled={!form.academicYearId}
              >
                <SelectTrigger id="semester">
                  <SelectValue
                    placeholder={
                      form.academicYearId
                        ? filteredSemesters.length === 0
                          ? 'Năm học này chưa có học kỳ'
                          : 'Chọn học kỳ (tuỳ chọn)'
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

            <div className="grid grid-cols-2 gap-3">
              <DateTimePicker
                label="Ngày bắt đầu"
                value={form.startDate}
                onChange={f('startDate')}
                required
                disablePast
              />
              <DateTimePicker
                label="Ngày kết thúc"
                value={form.endDate}
                onChange={f('endDate')}
                required
                disablePast
              />
            </div>

            <DateTimePicker
              label="Thời hạn đăng ký"
              value={form.registrationDeadline}
              onChange={f('registrationDeadline')}
              placeholder="Thời hạn sinh viên có thể đăng ký"
              disablePast
            />

            <div className="w-36 space-y-1.5">
              <Label htmlFor="maxParticipants">Số lượng tối đa</Label>
              <Input
                id="maxParticipants"
                type="number"
                value={form.maxParticipants}
                onChange={f('maxParticipants')}
                placeholder="200"
                min={1}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Danh mục sự kiện</Label>
              <div className="border border-input rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Không có danh mục nào
                  </p>
                ) : (
                  categories.map((cat) => (
                    <div
                      key={cat.categoryId}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        id={`category-${cat.categoryId}`}
                        checked={form.categoryIds.includes(cat.categoryId)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm((p) => ({
                            ...p,
                            categoryIds: checked
                              ? [...p.categoryIds, cat.categoryId]
                              : p.categoryIds.filter(
                                  (id) => id !== cat.categoryId,
                                ),
                          }));
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label
                        htmlFor={`category-${cat.categoryId}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {cat.categoryName}
                      </Label>
                    </div>
                  ))
                )}
              </div>
              {form.categoryIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Đã chọn {form.categoryIds.length} danh mục
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="organizer">Ban tổ chức</Label>
              <Select
                value={form.organizerId}
                onValueChange={(value) =>
                  setForm((p) => ({ ...p, organizerId: value }))
                }
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
                checked={form.requiresApproval}
                onCheckedChange={(checked) =>
                  setForm((p) => ({ ...p, requiresApproval: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Poster Upload */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Poster sự kiện</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Chọn ảnh poster
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                Chọn file ảnh
              </Button>
              <p className="text-xs text-muted-foreground">
                Định dạng: JPG, PNG, GIF, WEBP. Tối đa 5MB
              </p>
            </div>

            {posterPreview && (
              <div className="space-y-2">
                <div className="relative w-full aspect-video rounded-md overflow-hidden border border-border">
                  <Image
                    src={posterPreview}
                    alt="Poster preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex gap-2">
                  {!posterUrl ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleUploadFile}
                      disabled={uploading}
                      className="flex-1"
                    >
                      {uploading ? 'Đang tải lên...' : 'Tải lên server'}
                    </Button>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-xs text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 flex-1 justify-center"
                    >
                      Đã tải lên
                    </Badge>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemovePoster}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            )}
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
              <MarkdownEditor
                value={manualMd}
                onChange={setManualMd}
                placeholder="Nhập markdown mô tả sự kiện…"
                minHeight="400px"
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
                    Yêu cầu AI <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={5}
                    placeholder="VD: Tạo mô tả chi tiết cho sự kiện hiến máu nhân đạo, nhấn mạnh ý nghĩa và khuyến khích sinh viên tham gia..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 AI sẽ tự động sử dụng thông tin sự kiện (tên, địa điểm,
                  thời gian...) để tạo mô tả phù hợp
                </p>
                <Button
                  onClick={handleGenerateAI}
                  disabled={!aiPrompt.trim() || generating}
                  size="sm"
                >
                  {generating
                    ? generated
                      ? '⏳ Đang chỉnh sửa…'
                      : '⏳ AI đang sinh…'
                    : generated
                      ? '🔧 Chỉnh sửa mô tả'
                      : '✨ Sinh mô tả bằng AI'}
                </Button>
              </div>
            )}

            {/* Generated result */}
            {generated && mode !== 'manual' && (
              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <Badge
                    variant="outline"
                    className="text-xs text-green-600 dark:text-green-400 border-green-300 dark:border-green-700"
                  >
                    ✅ Mô tả đã tạo
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-900/20"
                      onClick={() => setShowImproveAI(!showImproveAI)}
                    >
                      ✨ Cải thiện với AI
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setManualMd(generated);
                        setMode('manual');
                      }}
                    >
                      Chuyển sang chỉnh sửa →
                    </Button>
                  </div>
                </div>

                {/* Improve AI prompt */}
                {showImproveAI && (
                  <div className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-card p-4 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700">
                        <span className="text-sm">✨</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-card-foreground">
                          Cải thiện mô tả với AI
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Mô tả sẽ được chỉnh sửa theo yêu cầu của bạn
                        </p>
                      </div>
                    </div>

                    {/* Quick suggestions */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        Gợi ý nhanh:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'Thêm lịch trình cụ thể',
                          'Nhấn mạnh lợi ích tham gia',
                          'Thêm thông tin giải thưởng',
                          'Viết ngắn gọn hơn',
                          'Thêm thông tin liên hệ',
                          'Thêm thời hạn đăng ký',
                        ].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() =>
                              setImprovePrompt((p) => (p ? `${p}\n${s}` : s))
                            }
                            className="px-2.5 py-1 rounded-full text-xs border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent hover:border-neutral-400 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Textarea
                      value={improvePrompt}
                      onChange={(e) => setImprovePrompt(e.target.value)}
                      placeholder="Nhập yêu cầu chỉnh sửa... VD: Thêm thông tin về lịch trình cụ thể, làm nổi bật lợi ích khi tham gia..."
                      rows={4}
                      className="text-sm resize-none bg-background border-border text-foreground placeholder:text-muted-foreground"
                    />

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {improvePrompt.length > 0 &&
                          `${improvePrompt.length} ký tự`}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-accent"
                          onClick={() => {
                            setShowImproveAI(false);
                            setImprovePrompt('');
                          }}
                        >
                          Hủy
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 shadow-sm"
                          disabled={generating || !improvePrompt.trim()}
                          onClick={handleImproveWithAI}
                        >
                          {generating ? (
                            <span className="flex items-center gap-1.5">
                              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Đang cải thiện…
                            </span>
                          ) : (
                            '✨ Cải thiện'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <MarkdownEditor
                  value={generated}
                  onChange={setGenerated}
                  placeholder="Nội dung đã tạo..."
                  minHeight="300px"
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

      {/* ── Right: preview (sticky) ─────────────────────────────── */}
      <div className="hidden lg:block lg:sticky lg:top-0 h-fit max-h-[calc(100vh-8rem)] overflow-hidden">
        <Card className="border-border/50 h-full flex flex-col">
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
          <CardContent className="flex-1 overflow-y-auto">
            {previewRendered ? (
              finalMd ? (
                <div className="md-preview text-sm text-foreground leading-relaxed">
                  <ReactMarkdown>{finalMd}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
                  <span className="text-3xl">📄</span>
                  <p className="text-sm">Chưa có nội dung</p>
                </div>
              )
            ) : (
              <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap wrap-break-word h-48 overflow-y-auto">
                {finalMd || '(trống)'}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
