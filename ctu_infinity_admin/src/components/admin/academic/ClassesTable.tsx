'use client';

import * as React from 'react';
import { IClassItem, IMajorItem, IFacultyItem, ICreateClass, IUpdateClass } from '@/types/academic.type';
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

export function ClassesTable() {
    const [classes, setClasses] = React.useState<IClassItem[]>([]);
    const [faculties, setFaculties] = React.useState<IFacultyItem[]>([]);
    const [allMajors, setAllMajors] = React.useState<IMajorItem[]>([]);
    const [loading, setLoading] = React.useState(true);

    // Pagination
    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);
    const [totalItems, setTotalItems] = React.useState(0);
    const PAGE_SIZE = 10;

    // Filter
    const [filterMajorId, setFilterMajorId] = React.useState<string>('all');
    const [filterFacultyId, setFilterFacultyId] = React.useState<string>('all');

    // Form modal
    const [formOpen, setFormOpen] = React.useState(false);
    const [editTarget, setEditTarget] = React.useState<IClassItem | null>(null);
    const [formName, setFormName] = React.useState('');
    const [formDesc, setFormDesc] = React.useState('');
    const [formMajorId, setFormMajorId] = React.useState('');
    const [formAcademicYear, setFormAcademicYear] = React.useState('');
    const [formFacultyId, setFormFacultyId] = React.useState('');
    const [saving, setSaving] = React.useState(false);

    // Delete
    const [deleteTarget, setDeleteTarget] = React.useState<IClassItem | null>(null);
    const [deleting, setDeleting] = React.useState(false);

    // Cascaded majors in form
    const formMajors = React.useMemo(
        () => (formFacultyId ? allMajors.filter((m) => m.falcultyId === formFacultyId) : allMajors),
        [allMajors, formFacultyId],
    );

    // Filtered majors list for the filter dropdown
    const filteredMajorOptions = React.useMemo(
        () => (filterFacultyId === 'all' ? allMajors : allMajors.filter((m) => m.falcultyId === filterFacultyId)),
        [allMajors, filterFacultyId],
    );

    const fetchLookups = React.useCallback(async () => {
        const [facultiesRes, majorsRes] = await Promise.all([
            AcademicService.CallGetAllFaculties(),
            AcademicService.CallGetAllMajors(),
        ]);
        if (facultiesRes?.EC === 1) setFaculties(facultiesRes.data?.falculties ?? []);
        if (majorsRes?.EC === 1) setAllMajors(majorsRes.data?.majors ?? []);
    }, []);

    const fetchClasses = React.useCallback(async () => {
        try {
            const res = await AcademicService.CallGetAllClasses(page, PAGE_SIZE);
            if (res?.EC === 1 && res.data) {
                setClasses(res.data.classes ?? []);
                setTotalPages(res.data.pagination?.totalPages ?? 1);
                setTotalItems(res.data.pagination?.totalItems ?? 0);
            }
        } catch {
            toast.error('Lỗi khi tải danh sách lớp');
        } finally {
            setLoading(false);
        }
    }, [page]);

    React.useEffect(() => {
        fetchLookups();
    }, [fetchLookups]);

    React.useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    // Client-side filter
    const displayedClasses = React.useMemo(() => {
        let list = classes;
        if (filterFacultyId !== 'all') {
            list = list.filter((c) => c.major?.falculty?.falcultyId === filterFacultyId || (c.major as any)?.falcultyId === filterFacultyId);
        }
        if (filterMajorId !== 'all') {
            list = list.filter((c) => c.majorId === filterMajorId);
        }
        return list;
    }, [classes, filterFacultyId, filterMajorId]);

    const openCreate = () => {
        setEditTarget(null);
        setFormName('');
        setFormDesc('');
        setFormMajorId('');
        setFormFacultyId('');
        setFormAcademicYear(new Date().getFullYear().toString());
        setFormOpen(true);
    };

    const openEdit = (item: IClassItem) => {
        setEditTarget(item);
        setFormName(item.className);
        setFormDesc(item.description ?? '');
        setFormMajorId(item.majorId ?? '');
        setFormAcademicYear(item.academicYear?.toString() ?? '');
        // Resolve faculty from major
        const major = allMajors.find((m) => m.majorId === item.majorId);
        setFormFacultyId(major?.falcultyId ?? '');
        setFormOpen(true);
    };

    const handleSave = async () => {
        if (!formName.trim() || !formAcademicYear) {
            toast.error('Vui lòng điền tên lớp và năm học');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                className: formName.trim(),
                description: formDesc.trim() || undefined,
                majorId: formMajorId || undefined,
                academicYear: parseInt(formAcademicYear),
            };

            if (editTarget) {
                const res = await AcademicService.CallUpdateClass(editTarget.classId, payload as IUpdateClass);
                if (res?.EC === 1) {
                    toast.success('Cập nhật lớp thành công');
                    setFormOpen(false);
                    fetchClasses();
                } else {
                    toast.error(res?.EM || 'Cập nhật thất bại');
                }
            } else {
                const res = await AcademicService.CallCreateClass(payload as ICreateClass);
                if (res?.EC === 1) {
                    toast.success('Thêm lớp thành công');
                    setFormOpen(false);
                    fetchClasses();
                } else {
                    toast.error(res?.EM || 'Thêm lớp thất bại');
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
            const res = await AcademicService.CallDeleteClass(deleteTarget.classId);
            if (res?.EC === 1) {
                toast.success('Xóa lớp thành công');
                setDeleteTarget(null);
                fetchClasses();
            } else {
                toast.error(res?.EM || 'Không thể xóa lớp');
            }
        } catch {
            toast.error('Lỗi khi xóa lớp');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="w-full space-y-4">
            {/* Toolbar – giống RolesTable */}
            <div className="flex items-center py-4 gap-3 flex-wrap">
                {/* Faculty filter */}
                <Select value={filterFacultyId} onValueChange={(v) => { setFilterFacultyId(v); setFilterMajorId('all'); }}>
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder="Lọc theo khoa" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả khoa</SelectItem>
                        {faculties.map((f) => (
                            <SelectItem key={f.falcultyId} value={f.falcultyId}>{f.falcultyName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {/* Major filter */}
                <Select value={filterMajorId} onValueChange={setFilterMajorId} disabled={filterFacultyId === 'all'}>
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder={filterFacultyId === 'all' ? 'Chọn khoa trước' : 'Lọc theo ngành'} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả ngành</SelectItem>
                        {filteredMajorOptions.map((m) => (
                            <SelectItem key={m.majorId} value={m.majorId}>{m.majorName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    onClick={openCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer gap-2"
                >
                    <Plus className="h-4 w-4" /> Thêm Lớp
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">STT</TableHead>
                            <TableHead>Tên Lớp</TableHead>
                            <TableHead>Ngành</TableHead>
                            <TableHead>Khoa</TableHead>
                            <TableHead>Năm học</TableHead>
                            <TableHead>Ngày tạo</TableHead>
                            <TableHead className="w-24 text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : displayedClasses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    Chưa có dữ liệu
                                </TableCell>
                            </TableRow>
                        ) : (
                            displayedClasses.map((c, i) => (
                                <TableRow key={c.classId}>
                                    <TableCell className="text-muted-foreground">{(page - 1) * PAGE_SIZE + i + 1}</TableCell>
                                    <TableCell className="font-medium">{c.className}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{c.major?.majorName ?? '—'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{c.major?.falculty?.falcultyName ?? '—'}</Badge>
                                    </TableCell>
                                    <TableCell>{c.academicYear}</TableCell>
                                    <TableCell className="text-sm">
                                        {formatDate(c.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 cursor-pointer"
                                            onClick={() => openEdit(c)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 cursor-pointer text-red-500 hover:text-red-600"
                                            onClick={() => setDeleteTarget(c)}
                                        >
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
                totalCount={totalItems}
            />

            {/* Form modal */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editTarget ? 'Sửa Lớp' : 'Thêm Lớp mới'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="cls-name">Tên Lớp *</Label>
                            <Input
                                id="cls-name"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder="VD: CNTT K47A"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="cls-year">Năm học *</Label>
                            <Input
                                id="cls-year"
                                type="number"
                                value={formAcademicYear}
                                onChange={(e) => setFormAcademicYear(e.target.value)}
                                placeholder="VD: 2021"
                            />
                        </div>
                        {/* Faculty cascade */}
                        <div className="space-y-1.5">
                            <Label>Khoa</Label>
                            <Select value={formFacultyId} onValueChange={(v) => { setFormFacultyId(v); setFormMajorId(''); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn khoa (tuỳ chọn)..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {faculties.map((f) => (
                                        <SelectItem key={f.falcultyId} value={f.falcultyId}>{f.falcultyName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Ngành</Label>
                            <Select value={formMajorId} onValueChange={setFormMajorId} disabled={!formFacultyId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={formFacultyId ? 'Chọn ngành...' : 'Chọn khoa trước'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {formMajors.map((m) => (
                                        <SelectItem key={m.majorId} value={m.majorId}>{m.majorName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="cls-desc">Mô tả</Label>
                            <Textarea
                                id="cls-desc"
                                value={formDesc}
                                onChange={(e) => setFormDesc(e.target.value)}
                                placeholder="Mô tả về lớp (tuỳ chọn)..."
                                rows={2}
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
                            Bạn chắc chắn muốn xóa lớp <strong>{deleteTarget?.className}</strong>?{' '}
                            {deleteTarget && 'Không thể xóa lớp nếu còn sinh viên đang theo học.'}
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
