'use client';

import * as React from 'react';
import { IFacultyItem, ICreateFaculty, IUpdateFaculty } from '@/types/academic.type';
import { AcademicService } from '@/services/academic.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SimpleTablePagination } from '@/components/table/simple-table-pagination';
import { formatDate } from '@/utils/formateDate';

export function FacultiesTable() {
    const [faculties, setFaculties] = React.useState<IFacultyItem[]>([]);
    const [loading, setLoading] = React.useState(true);

    // Form modal state
    const [formOpen, setFormOpen] = React.useState(false);
    const [editTarget, setEditTarget] = React.useState<IFacultyItem | null>(null);
    const [formName, setFormName] = React.useState('');
    const [formDesc, setFormDesc] = React.useState('');
    const [saving, setSaving] = React.useState(false);

    // Delete confirm state
    const [deleteTarget, setDeleteTarget] = React.useState<IFacultyItem | null>(null);
    const [deleting, setDeleting] = React.useState(false);

    // Client-side search + pagination
    const [search, setSearch] = React.useState('');
    const [page, setPage] = React.useState(1);
    const PAGE_SIZE = 10;

    const filtered = React.useMemo(() => {
        if (!search.trim()) return faculties;
        const q = search.toLowerCase();
        return faculties.filter(
            (f) => f.falcultyName.toLowerCase().includes(q) || (f.description ?? '').toLowerCase().includes(q),
        );
    }, [faculties, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const fetchFaculties = React.useCallback(async () => {
        try {
            const res = await AcademicService.CallGetAllFaculties();
            if (res?.EC === 1) setFaculties(res.data?.falculties ?? []);
        } catch {
            toast.error('Lỗi khi tải danh sách khoa');
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchFaculties();
    }, [fetchFaculties]);

    const openCreate = () => {
        setEditTarget(null);
        setFormName('');
        setFormDesc('');
        setFormOpen(true);
    };

    const openEdit = (item: IFacultyItem) => {
        setEditTarget(item);
        setFormName(item.falcultyName);
        setFormDesc(item.description ?? '');
        setFormOpen(true);
    };

    const handleSave = async () => {
        if (!formName.trim()) {
            toast.error('Tên khoa không được để trống');
            return;
        }
        setSaving(true);
        try {
            if (editTarget) {
                const res = await AcademicService.CallUpdateFaculty(editTarget.falcultyId, {
                    falcultyName: formName.trim(),
                    description: formDesc.trim() || undefined,
                } as IUpdateFaculty);
                if (res?.EC === 1) {
                    toast.success('Cập nhật khoa thành công');
                    setFormOpen(false);
                    fetchFaculties();
                } else {
                    toast.error(res?.EM || 'Cập nhật thất bại');
                }
            } else {
                const res = await AcademicService.CallCreateFaculty({
                    falcultyName: formName.trim(),
                    description: formDesc.trim() || undefined,
                } as ICreateFaculty);
                if (res?.EC === 1) {
                    toast.success('Thêm khoa thành công');
                    setFormOpen(false);
                    fetchFaculties();
                } else {
                    toast.error(res?.EM || 'Thêm khoa thất bại');
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
            const res = await AcademicService.CallDeleteFaculty(deleteTarget.falcultyId);
            if (res?.EC === 1) {
                toast.success('Xóa khoa thành công');
                setDeleteTarget(null);
                fetchFaculties();
            } else {
                toast.error(res?.EM || 'Không thể xóa khoa');
            }
        } catch {
            toast.error('Lỗi khi xóa khoa');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="w-full space-y-4">
            {/* Toolbar */}
            <div className="flex items-center py-4 gap-3">
                <Input
                    placeholder="Tìm theo tên khoa..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="max-w-sm"
                />
                <Button
                    onClick={openCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer gap-2"
                >
                    <Plus className="h-4 w-4" /> Thêm Khoa
                </Button>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">STT</TableHead>
                            <TableHead>Tên Khoa</TableHead>
                            <TableHead>Mô tả</TableHead>
                            <TableHead>Ngày tạo</TableHead>
                            <TableHead className="w-24 text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : paginated.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Chưa có dữ liệu
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginated.map((f, i) => (
                                <TableRow key={f.falcultyId}>
                                    <TableCell className="text-muted-foreground">{(page - 1) * PAGE_SIZE + i + 1}</TableCell>
                                    <TableCell className="font-medium">{f.falcultyName}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{f.description || '—'}</TableCell>
                                    <TableCell className="text-sm">
                                        {formatDate(f.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => openEdit(f)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-red-500 hover:text-red-600" onClick={() => setDeleteTarget(f)}>
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
                totalCount={filtered.length}
            />

            {/* Form modal */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editTarget ? 'Sửa Khoa' : 'Thêm Khoa mới'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="fac-name">Tên Khoa *</Label>
                            <Input
                                id="fac-name"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder="VD: Khoa Công nghệ thông tin"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="fac-desc">Mô tả</Label>
                            <Textarea
                                id="fac-desc"
                                value={formDesc}
                                onChange={(e) => setFormDesc(e.target.value)}
                                placeholder="Mô tả về khoa (tuỳ chọn)..."
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
                            Bạn chắc chắn muốn xóa khoa <strong>{deleteTarget?.falcultyName}</strong>? Tất cả ngành thuộc khoa này cũng sẽ bị xóa.
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
