'use client';

import * as React from 'react';
import { IMajorItem, IFacultyItem, ICreateMajor, IUpdateMajor } from '@/types/academic.type';
import { AcademicService } from '@/services/academic.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SimpleTablePagination } from '@/components/table/simple-table-pagination';
import { formatDate } from '@/utils/formateDate';

export function MajorsTable() {
    const [majors, setMajors] = React.useState<IMajorItem[]>([]);
    const [faculties, setFaculties] = React.useState<IFacultyItem[]>([]);
    const [loading, setLoading] = React.useState(true);

    // Filter
    const [filterFacultyId, setFilterFacultyId] = React.useState<string>('all');

    // Client-side search + pagination
    const [search, setSearch] = React.useState('');
    const [page, setPage] = React.useState(1);
    const PAGE_SIZE = 10;

    // Form modal
    const [formOpen, setFormOpen] = React.useState(false);
    const [editTarget, setEditTarget] = React.useState<IMajorItem | null>(null);
    const [formName, setFormName] = React.useState('');
    const [formDesc, setFormDesc] = React.useState('');
    const [formFacultyId, setFormFacultyId] = React.useState('');
    const [saving, setSaving] = React.useState(false);

    // Delete
    const [deleteTarget, setDeleteTarget] = React.useState<IMajorItem | null>(null);
    const [deleting, setDeleting] = React.useState(false);

    const fetchAll = React.useCallback(async () => {
        try {
            const [majorsRes, facultiesRes] = await Promise.all([
                AcademicService.CallGetAllMajors(),
                AcademicService.CallGetAllFaculties(),
            ]);
            if (majorsRes?.EC === 1) setMajors(majorsRes.data?.majors ?? []);
            if (facultiesRes?.EC === 1) setFaculties(facultiesRes.data?.falculties ?? []);
        } catch {
            toast.error('Lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const displayedMajors = React.useMemo(() => {
        let list = filterFacultyId === 'all' ? majors : majors.filter((m) => m.falcultyId === filterFacultyId);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((m) => m.majorName.toLowerCase().includes(q) || (m.description ?? '').toLowerCase().includes(q));
        }
        return list;
    }, [majors, filterFacultyId, search]);

    const totalPages = Math.max(1, Math.ceil(displayedMajors.length / PAGE_SIZE));
    const paginated = displayedMajors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const openCreate = () => {
        setEditTarget(null);
        setFormName('');
        setFormDesc('');
        setFormFacultyId('');
        setFormOpen(true);
    };

    const openEdit = (item: IMajorItem) => {
        setEditTarget(item);
        setFormName(item.majorName);
        setFormDesc(item.description ?? '');
        setFormFacultyId(item.falcultyId);
        setFormOpen(true);
    };

    const handleSave = async () => {
        if (!formName.trim() || !formFacultyId) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }
        setSaving(true);
        try {
            if (editTarget) {
                const res = await AcademicService.CallUpdateMajor(editTarget.majorId, {
                    majorName: formName.trim(),
                    description: formDesc.trim() || undefined,
                    falcultyId: formFacultyId,
                } as IUpdateMajor);
                if (res?.EC === 1) {
                    toast.success('Cập nhật ngành thành công');
                    setFormOpen(false);
                    fetchAll();
                } else {
                    toast.error(res?.EM || 'Cập nhật thất bại');
                }
            } else {
                const res = await AcademicService.CallCreateMajor({
                    majorName: formName.trim(),
                    description: formDesc.trim() || undefined,
                    falcultyId: formFacultyId,
                } as ICreateMajor);
                if (res?.EC === 1) {
                    toast.success('Thêm ngành thành công');
                    setFormOpen(false);
                    fetchAll();
                } else {
                    toast.error(res?.EM || 'Thêm ngành thất bại');
                }
            }
        } catch {
            toast.error('Lỗi khi lưu dữ liệu');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await AcademicService.CallDeleteMajor(deleteTarget.majorId);
            if (res?.EC === 1) {
                toast.success('Xóa ngành thành công');
                setDeleteTarget(null);
                fetchAll();
            } else {
                toast.error(res?.EM || 'Không thể xóa ngành');
            }
        } catch {
            toast.error('Lỗi khi xóa ngành');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="w-full space-y-4">
            {/* Toolbar */}
            <div className="flex items-center py-4 gap-3 flex-wrap">
                <Input
                    placeholder="Tìm theo tên ngành..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="max-w-sm"
                />
                {/* Faculty filter */}
                <Select value={filterFacultyId} onValueChange={(v) => { setFilterFacultyId(v); setPage(1); }}>
                    <SelectTrigger className="w-52">
                        <SelectValue placeholder="Lọc theo khoa" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả khoa</SelectItem>
                        {faculties.map((f) => (
                            <SelectItem key={f.falcultyId} value={f.falcultyId}>{f.falcultyName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    onClick={openCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer gap-2"
                >
                    <Plus className="h-4 w-4" /> Thêm Ngành
                </Button>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">STT</TableHead>
                            <TableHead>Tên Ngành</TableHead>
                            <TableHead>Khoa</TableHead>
                            <TableHead>Mô tả</TableHead>
                            <TableHead>Ngày tạo</TableHead>
                            <TableHead className="w-24 text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : paginated.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Chưa có dữ liệu
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginated.map((m, i) => (
                                <TableRow key={m.majorId}>
                                    <TableCell className="text-muted-foreground">{(page - 1) * PAGE_SIZE + i + 1}</TableCell>
                                    <TableCell className="font-medium">{m.majorName}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{m.falculty?.falcultyName ?? '—'}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{m.description || '—'}</TableCell>
                                    <TableCell className="text-sm">
                                        {formatDate(m.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => openEdit(m)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-red-500 hover:text-red-600" onClick={() => setDeleteTarget(m)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
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
                totalCount={displayedMajors.length}
            />

            {/* Form modal */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editTarget ? 'Sửa Ngành' : 'Thêm Ngành mới'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="maj-name">Tên Ngành *</Label>
                            <Input
                                id="maj-name"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder="VD: Công nghệ phần mềm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Khoa *</Label>
                            <Select value={formFacultyId} onValueChange={setFormFacultyId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn khoa..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {faculties.map((f) => (
                                        <SelectItem key={f.falcultyId} value={f.falcultyId}>
                                            {f.falcultyName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="maj-desc">Mô tả</Label>
                            <Textarea
                                id="maj-desc"
                                value={formDesc}
                                onChange={(e) => setFormDesc(e.target.value)}
                                placeholder="Mô tả về ngành (tuỳ chọn)..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFormOpen(false)} className="cursor-pointer">
                            Hủy
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="cursor-pointer">
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editTarget ? 'Lưu thay đổi' : 'Thêm mới'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirm */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn chắc chắn muốn xóa ngành <strong>{deleteTarget?.majorName}</strong>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 cursor-pointer"
                        >
                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
