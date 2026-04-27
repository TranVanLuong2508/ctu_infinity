'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SimpleTablePagination } from '@/components/table/simple-table-pagination';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus } from 'lucide-react';
import {
  academicYearApi,
  IAcademicYear,
  ICreateAcademicYearPayload,
} from '@/services/academic-schedule.service';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { ConfirmModal } from '@/components/admin/modals/ConfirmModal';

const emptyForm: ICreateAcademicYearPayload = {
  yearName: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
};

export default function AcademicYearPage() {
  const [years, setYears] = useState<IAcademicYear[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<IAcademicYear | null>(null);
  const [form, setForm] = useState<ICreateAcademicYearPayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{ open: boolean; yearId: string | null }>({ open: false, yearId: null });

  // Client-side search + pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const filtered = useMemo(() => {
    if (!search.trim()) return years;
    const q = search.toLowerCase();
    return years.filter((y) => y.yearName.toLowerCase().includes(q));
  }, [years, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const loadYears = useCallback(async () => {
    setLoading(true);
    try {
      const res = await academicYearApi.getAll();
      setYears(res.data?.academicYears ?? []);
    } catch {
      toast.error('Không thể tải danh sách năm học');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadYears();
  }, [loadYears]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (year: IAcademicYear) => {
    setEditing(year);
    setForm({
      yearName: year.yearName,
      startDate: year.startDate,
      endDate: year.endDate,
      isCurrent: year.isCurrent,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.yearName || !form.startDate || !form.endDate) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await academicYearApi.update(editing.yearId, form);
        toast.success('Cập nhật năm học thành công');
      } else {
        await academicYearApi.create(form);
        toast.success('Tạo năm học thành công');
      }
      setDialogOpen(false);
      loadYears();
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmModalData.yearId) return;
    try {
      await academicYearApi.remove(confirmModalData.yearId);
      toast.success('Xóa năm học thành công');
      loadYears();
    } catch {
      toast.error('Không thể xóa năm học');
    } finally {
      setConfirmModalData({ open: false, yearId: null });
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <AdminHeader />

      <main className="flex-1 overflow-auto p-6">
      <div className="w-full space-y-4">
        {/* Toolbar */}
        <div className="flex items-center py-4 gap-3">
          <Input
            placeholder="Tìm theo tên năm học..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="max-w-sm"
          />
          <Button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer gap-2"
          >
            <Plus className="h-4 w-4" />
            Thêm năm học
          </Button>
        </div>

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên năm học</TableHead>
                <TableHead>Ngày bắt đầu</TableHead>
                <TableHead>Ngày kết thúc</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-24 text-center">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Chưa có năm học nào
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((year) => (
                  <TableRow key={year.yearId}>
                    <TableCell className="font-medium">{year.yearName}</TableCell>
                    <TableCell>{year.startDate}</TableCell>
                    <TableCell>{year.endDate}</TableCell>
                    <TableCell>
                      {year.isCurrent ? (
                        <Badge className="bg-green-100 text-green-700">Hiện tại</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Không hoạt động</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(year)} title="Chỉnh sửa">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setConfirmModalData({ open: true, yearId: year.yearId })} title="Xóa" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <SimpleTablePagination
          page={page}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onPageSizeChange={() => {}}
          totalCount={filtered.length}
        />
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Chỉnh sửa năm học' : 'Thêm năm học mới'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="yearName">Tên năm học *</Label>
              <Input
                id="yearName"
                placeholder="VD: 2024-2025"
                value={form.yearName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, yearName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="startDate">Ngày bắt đầu *</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endDate">Ngày kết thúc *</Label>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endDate: e.target.value }))
                }
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="isCurrent"
                checked={form.isCurrent ?? false}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, isCurrent: v }))
                }
              />
              <Label htmlFor="isCurrent">Đây là năm học hiện tại</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <ConfirmModal
        open={confirmModalData.open}
        onClose={() => setConfirmModalData({ open: false, yearId: null })}
        onConfirm={handleDelete}
        title="Xác nhận xóa năm học"
        description={
          <span>
            Bạn có chắc chắn muốn xóa năm học này không? Hành động này không thể hoàn tác.
          </span>
        }
        isDanger={true}
        confirmText="Xóa"
      />
      </main>
    </div>
  );
}
