'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { SimpleTablePagination } from '@/components/table/simple-table-pagination';
import {
  academicYearApi,
  semestersApi,
  IAcademicYear,
  ISemester,
  ICreateSemesterPayload,
} from '@/services/academic-schedule.service';
import { ConfirmModal } from '@/components/admin/modals/ConfirmModal';

const emptyForm: ICreateSemesterPayload = {
  semesterName: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  yearId: '',
};

export default function SemestersPage() {
  const [semesters, setSemesters] = useState<ISemester[]>([]);
  const [years, setYears] = useState<IAcademicYear[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterYearId, setFilterYearId] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ISemester | null>(null);
  const [form, setForm] = useState<ICreateSemesterPayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{ open: boolean; semesterId: string | null }>({ open: false, semesterId: null });

    const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [semRes, yearRes] = await Promise.all([
        semestersApi.getAll(),
        academicYearApi.getAll(),
      ]);
      setSemesters(semRes.data?.semesters ?? []);
      setYears(yearRes.data?.academicYears ?? []);
    } catch {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side search + pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const filteredSemesters = useMemo(() => {
    let list = filterYearId === 'all' ? semesters : semesters.filter((s) => s.yearId === filterYearId);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.semesterName.toLowerCase().includes(q));
    }
    return list;
  }, [semesters, filterYearId, search]);

  const totalPages = Math.max(1, Math.ceil(filteredSemesters.length / PAGE_SIZE));
  const paginated = filteredSemesters.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (sem: ISemester) => {
    setEditing(sem);
    setForm({
      semesterName: sem.semesterName,
      startDate: sem.startDate,
      endDate: sem.endDate,
      isCurrent: sem.isCurrent,
      yearId: sem.yearId,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (
      !form.semesterName ||
      !form.startDate ||
      !form.endDate ||
      !form.yearId
    ) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await semestersApi.update(editing.semesterId, form);
        toast.success('Cập nhật học kỳ thành công');
      } else {
        await semestersApi.create(form);
        toast.success('Tạo học kỳ thành công');
      }
      setDialogOpen(false);
      loadData();
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmModalData.semesterId) return;
    try {
      await semestersApi.remove(confirmModalData.semesterId);
      toast.success('Xóa học kỳ thành công');
      loadData();
    } catch {
      toast.error('Không thể xóa học kỳ');
    } finally {
      setConfirmModalData({ open: false, semesterId: null });
    }
  };

  const getYearName = (yearId: string) =>
    years.find((y) => y.yearId === yearId)?.yearName ?? yearId;

  return (
    <div className="flex flex-col h-full w-full">
      <AdminHeader />

      <main className="flex-1 overflow-auto p-6">
      <div className="w-full space-y-4">
        {/* Toolbar */}
        <div className="flex items-center py-4 gap-3 flex-wrap">
          <Input
            placeholder="Tìm theo tên học kỳ..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="max-w-sm"
          />
          <Select value={filterYearId} onValueChange={(v) => { setFilterYearId(v); setPage(1); }}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Tất cả năm học" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả năm học</SelectItem>
              {years.map((y) => (
                <SelectItem key={y.yearId} value={y.yearId}>{y.yearName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer gap-2"
          >
            <Plus className="h-4 w-4" />
            Thêm học kỳ
          </Button>
        </div>

        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên học kỳ</TableHead>
                <TableHead>Năm học</TableHead>
                <TableHead>Ngày bắt đầu</TableHead>
                <TableHead>Ngày kết thúc</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-24 text-center">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Chưa có học kỳ nào
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((sem) => (
                  <TableRow key={sem.semesterId}>
                    <TableCell className="font-medium">{sem.semesterName}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {sem.academicYear?.yearName ?? getYearName(sem.yearId)}
                      </span>
                    </TableCell>
                    <TableCell>{sem.startDate}</TableCell>
                    <TableCell>{sem.endDate}</TableCell>
                    <TableCell>
                      {sem.isCurrent ? (
                        <Badge className="bg-green-100 text-green-700">Hiện tại</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Không hoạt động</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(sem)} title="Chỉnh sửa">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setConfirmModalData({ open: true, semesterId: sem.semesterId })} title="Xóa" className="text-destructive hover:text-destructive">
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
          totalCount={filteredSemesters.length}
        />
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Chỉnh sửa học kỳ' : 'Thêm học kỳ mới'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="semesterName">Tên học kỳ *</Label>
              <Input
                id="semesterName"
                placeholder="VD: Học kỳ 1 2024-2025"
                value={form.semesterName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, semesterName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="yearId">Năm học *</Label>
              <Select
                value={form.yearId}
                onValueChange={(v) => setForm((f) => ({ ...f, yearId: v }))}
              >
                <SelectTrigger id="yearId">
                  <SelectValue placeholder="Chọn năm học" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y.yearId} value={y.yearId}>
                      {y.yearName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="isCurrent">Đây là học kỳ hiện tại</Label>
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
        onClose={() => setConfirmModalData({ open: false, semesterId: null })}
        onConfirm={handleDelete}
        title="Xác nhận xóa học kỳ"
        description={
          <span>
            Bạn có chắc chắn muốn xóa học kỳ này không?
          </span>
        }
        isDanger={true}
        confirmText="Xóa"
      />
      </main>
    </div>
  );
}
