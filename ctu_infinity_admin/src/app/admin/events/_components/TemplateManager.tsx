'use client';

import { useState } from 'react';
import { Trash2, HelpCircle, FileText, Code2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { templateApi, EventTemplate } from '@/services/eventTemplate.service';
import { ConfirmModal } from '@/components/admin/modals/ConfirmModal';

const DEFAULT_CONTENT = `# {{eventName}}

**Ban tổ chức:** {{organizer}}
**Thời gian:** {{startDate}} – {{endDate}}
**Địa điểm:** {{location}}
**Số lượng:** Tối đa {{maxParticipants}} người

---

## Giới thiệu

> Mô tả ngắn gọn về sự kiện...

## Nội dung

- Hoạt động 1
- Hoạt động 2

## Đối tượng

Dành cho tất cả sinh viên Trường Đại học Cần Thơ.

## Đăng ký

Liên hệ **{{organizer}}** để đăng ký tham gia.
`;

interface Props {
  templates: EventTemplate[];
  selected: EventTemplate | null;
  loading: boolean;
  onRefresh: () => Promise<void>;
  onSelect: (t: EventTemplate) => void;
  organizerId?: string;
  isOrganizer?: boolean;
}

export function TemplateManager({
  templates,
  selected,
  loading,
  onRefresh,
  onSelect,
  organizerId,
  isOrganizer = false,
}: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importName, setImportName] = useState('');
  const [importType, setImportType] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    open: boolean;
    id: string | null;
  }>({ open: false, id: null });

  const handleCreate = async () => {
    if (!name.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await templateApi.create({ name, content, type: type || undefined, organizerId });
      setShowCreate(false);
      setName('');
      setType('');
      setContent(DEFAULT_CONTENT);
      await onRefresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async () => {
    if (!importFile || !importName.trim()) return;
    setSaving(true);
    try {
      await templateApi.importFile(
        importFile,
        importName,
        importType || undefined,
        organizerId,
      );
      setImportFile(null);
      setImportName('');
      setImportType('');
      await onRefresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmModalData.id) return;
    try {
      await templateApi.remove(confirmModalData.id);
      await onRefresh();
    } finally {
      setConfirmModalData({ open: false, id: null });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={() => setShowCreate((v) => !v)}
          variant={showCreate ? 'outline' : 'default'}
          size="sm"
          className={
            showCreate ? '' : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
        >
          {showCreate ? 'Đóng' : 'Tạo template mới'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowGuide(true)}
          className="gap-1.5"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Hướng dẫn tạo mẫu
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tạo template mới</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Tên template *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Mẫu hiến máu CTU"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Loại sự kiện
                </label>
                <Input
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="VD: Hiến máu, Trực vệ sinh…"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Nội dung Markdown *{' '}
                <span className="text-muted-foreground/60">
                  — dùng {`{{bien}}`} cho biến
                </span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreate(false)}
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={saving || !name || !content}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? 'Đang lưu…' : 'Lưu template'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import file */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            📁 Import từ file (.md / .txt / .docx)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Tên template *
              </label>
              <Input
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
                placeholder="Tên hiển thị"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Loại sự kiện
              </label>
              <Input
                value={importType}
                onChange={(e) => setImportType(e.target.value)}
                placeholder="Tùy chọn"
              />
            </div>
          </div>
          <input
            type="file"
            accept=".md,.txt,.docx"
            onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
            className="text-sm text-muted-foreground file:mr-3 file:py-1 file:px-3 file:rounded-md file:border file:border-input file:text-xs file:font-medium file:bg-background file:text-foreground hover:file:bg-accent"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleImport}
            disabled={saving || !importFile || !importName}
          >
            {saving ? 'Đang import…' : 'Import file'}
          </Button>
        </CardContent>
      </Card>

      {/* Template list */}
      <div className="space-y-3">
        {loading && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Đang tải…
          </p>
        )}
        {!loading && templates.length === 0 && (
          <Card className="border-border/50">
            <CardContent className="p-10 text-center text-muted-foreground text-sm">
              Chưa có template nào. Hãy tạo hoặc import template đầu tiên!
            </CardContent>
          </Card>
        )}
        {templates.map((t) => (
          <Card
            key={t.id}
            onClick={() => onSelect(t)}
            className={`cursor-pointer transition-all hover:border-primary/40 hover:shadow-md ${
              selected?.id === t.id
                ? 'border-primary/60 bg-primary/5'
                : 'border-border/50'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{t.name}</span>
                  {t.type && (
                    <Badge variant="outline" className="text-xs">
                      {t.type}
                    </Badge>
                  )}
                  {selected?.id === t.id && (
                    <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
                      Đang chọn
                    </Badge>
                  )}
                </div>
                {(!isOrganizer || t.organizerId === organizerId) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmModalData({ open: true, id: t.id });
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {t.content.slice(0, 140)}…
              </p>
              {t.variables.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {t.variables.map((v) => (
                    <code
                      key={v}
                      className="text-xs bg-muted px-1.5 py-0.5 rounded text-primary"
                    >{`{{${v}}}`}</code>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hướng dẫn tạo mẫu */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              Hướng dẫn tạo mẫu sự kiện
            </DialogTitle>
            <DialogDescription>
              Làm theo các bước bên dưới để tạo template hoạt động đúng với chức
              năng tạo sự kiện tự động.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Bước 1 */}
            <div className="flex gap-3 p-3 rounded-lg border border-border bg-muted/30">
              <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-sm">
                  Tạo file Word hoặc Markdown
                </h3>
                <p className="text-xs text-muted-foreground">
                  Mở Microsoft Word, Google Docs hoặc Notepad và soạn nội dung
                  mẫu cho sự kiện. Sau đó lưu file:
                </p>
                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                  <li>
                    <strong>Word:</strong> Lưu định dạng{' '}
                    <code className="bg-muted px-1 rounded">.docx</code>
                  </li>
                  <li>
                    <strong>Markdown:</strong> Lưu định dạng{' '}
                    <code className="bg-muted px-1 rounded">.md</code> hoặc{' '}
                    <code className="bg-muted px-1 rounded">.txt</code>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bước 2 */}
            <div className="flex gap-3 p-3 rounded-lg border border-border bg-muted/30">
              <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  Chèn biến placeholder vào nội dung
                </h3>
                <p className="text-xs text-muted-foreground">
                  Sử dụng cú pháp{' '}
                  <code className="bg-muted px-1 rounded">
                    {'{{tên_biến}}'}
                  </code>{' '}
                  để hệ thống tự động điền thông tin khi tạo sự kiện.
                </p>
                <div className="mt-2 p-2.5 rounded-md bg-background border border-border space-y-1">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    Các biến được hỗ trợ:
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="flex items-center gap-1.5 text-xs">
                      <code className="bg-primary/10 text-primary px-1 rounded font-mono">
                        {'{{eventName}}'}
                      </code>
                      <span className="text-muted-foreground">
                        → Tên sự kiện
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <code className="bg-primary/10 text-primary px-1 rounded font-mono">
                        {'{{organizer}}'}
                      </code>
                      <span className="text-muted-foreground">
                        → Ban tổ chức
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <code className="bg-primary/10 text-primary px-1 rounded font-mono">
                        {'{{startDate}}'}
                      </code>
                      <span className="text-muted-foreground">
                        → Ngày bắt đầu
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <code className="bg-primary/10 text-primary px-1 rounded font-mono">
                        {'{{endDate}}'}
                      </code>
                      <span className="text-muted-foreground">
                        → Ngày kết thúc
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <code className="bg-primary/10 text-primary px-1 rounded font-mono">
                        {'{{location}}'}
                      </code>
                      <span className="text-muted-foreground">→ Địa điểm</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <code className="bg-primary/10 text-primary px-1 rounded font-mono">
                        {'{{maxParticipants}}'}
                      </code>
                      <span className="text-muted-foreground">
                        → Số lượng tối đa
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bước 3 */}
            <div className="flex gap-3 p-3 rounded-lg border border-border bg-muted/30">
              <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Import file lên hệ thống
                </h3>
                <p className="text-xs text-muted-foreground">
                  Tại trang <strong>Quản lý template</strong>, nhấn nút{' '}
                  <strong>Import file</strong> và chọn file bạn vừa tạo. Điền
                  tên template và loại sự kiện (tùy chọn).
                </p>
                <div className="p-2 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-xs text-yellow-700 dark:text-yellow-300">
                  <strong>Lưu ý:</strong> Nếu file Word có chứa hình ảnh, chỉ
                  văn bản sẽ được trích xuất. Hình ảnh cần thêm thủ công khi tạo
                  sự kiện.
                </div>
              </div>
            </div>

            {/* Ví dụ */}
            <div className="space-y-1.5">
              <h3 className="font-semibold text-sm">
                Ví dụ template hoàn chỉnh
              </h3>
              <div className="rounded-lg bg-muted border border-border text-foreground p-3 text-xs font-mono overflow-x-auto">
                {`{{eventName}}

Ban tổ chức: {{organizer}}
Thời gian: {{startDate}} đến {{endDate}}
Địa điểm: {{location}}
Số lượng tham gia: {{maxParticipants}} người

Giới thiệu
Hội nghị được tổ chức bởi {{organizer}} nhằm tạo
môi trường cho sinh viên CTU giao lưu và học hỏi.

Đăng ký
Liên hệ {{organizer}} hoặc đăng ký trực tiếp trên hệ thống.
Số lượng có hạn: {{maxParticipants}} người.
Trân trọng kính mời!`}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowGuide(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Đã hiểu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={confirmModalData.open}
        onClose={() => setConfirmModalData({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Xác nhận xóa template"
        description={<span>Bạn có chắc chắn muốn xóa template này không?</span>}
        isDanger={true}
        confirmText="Xóa"
      />
    </div>
  );
}
