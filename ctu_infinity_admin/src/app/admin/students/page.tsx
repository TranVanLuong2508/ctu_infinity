'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { studentManagementApi, IStudentItem } from '@/services/student-management.service';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { ConfirmModal } from '@/components/admin/modals/ConfirmModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Loader2, GraduationCap } from 'lucide-react';
import { SimpleTablePagination } from '@/components/table/simple-table-pagination';

export default function StudentsPage() {
    const [students, setStudents] = useState<IStudentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;
    const [total, setTotal] = useState(0);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [confirmModalData, setConfirmModalData] = useState<{ open: boolean; student: IStudentItem | null }>({ open: false, student: null });

    // ── Load students ──────────────────────────────────────────────────────────

    const loadStudents = useCallback(async (currentPage: number) => {
        setLoading(true);
        try {
            const res = await studentManagementApi.getAll(currentPage, PAGE_SIZE);
            setStudents(res.data?.students ?? []);
            setTotal(res.data?.total ?? 0);
        } catch {
            toast.error('Không thể tải danh sách sinh viên');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStudents(page);
    }, [page, loadStudents]);

    // ── Client-side search (trong trang hiện tại) ─────────────────────────────

    const filtered = useMemo(() => {
        if (!search.trim()) return students;
        const q = search.toLowerCase();
        return students.filter(
            (s) =>
                s.user?.fullName?.toLowerCase().includes(q) ||
                s.user?.email?.toLowerCase().includes(q) ||
                s.studentCode?.toLowerCase().includes(q) ||
                s.class?.className?.toLowerCase().includes(q),
        );
    }, [students, search]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    // ── Restore / soft-delete ─────────────────────────────────────────────────

    const handleDelete = async () => {
        const student = confirmModalData.student;
        if (!student) return;
        setProcessingId(student.studentId);
        try {
            await studentManagementApi.remove(student.studentId);
            toast.success('Đã xoá sinh viên');
            loadStudents(page);
        } catch {
            toast.error('Xoá thất bại');
        } finally {
            setProcessingId(null);
            setConfirmModalData({ open: false, student: null });
        }
    };

    const handleRestore = async (student: IStudentItem) => {
        setProcessingId(student.studentId);
        try {
            await studentManagementApi.restore(student.studentId);
            toast.success('Đã khôi phục sinh viên');
            loadStudents(page);
        } catch {
            toast.error('Khôi phục thất bại');
        } finally {
            setProcessingId(null);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full w-full">
            <AdminHeader />

            <main className="flex-1 overflow-auto p-6">
                {/* Toolbar */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <GraduationCap className="w-5 h-5" />
                        <span className="text-sm">Tổng: <strong className="text-foreground">{total}</strong> sinh viên</span>
                    </div>
                    <Input
                        placeholder="Tìm theo tên, email, mã SV, lớp..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="max-w-sm ml-auto"
                    />
                </div>

                {/* Table */}
                <div className="rounded-md border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Họ tên</TableHead>
                                <TableHead>Mã SV</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Lớp</TableHead>
                                <TableHead>Ngành</TableHead>
                                <TableHead>Năm nhập học</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span className="text-sm">Đang tải...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground text-sm">
                                        Không tìm thấy sinh viên nào
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((s) => (
                                    <TableRow key={s.studentId} className={s.user?.isDeleted ? 'opacity-50' : ''}>
                                        <TableCell className="font-medium">{s.user?.fullName ?? '—'}</TableCell>
                                        <TableCell className="text-muted-foreground font-mono text-xs">{s.studentCode}</TableCell>
                                        <TableCell className="text-muted-foreground">{s.user?.email ?? '—'}</TableCell>
                                        <TableCell className="text-muted-foreground">{s.class?.className ?? '—'}</TableCell>
                                        <TableCell className="text-muted-foreground">{s.class?.major?.majorName ?? '—'}</TableCell>
                                        <TableCell className="text-muted-foreground">{s.enrollmentYear}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.user?.isDeleted
                                                ? 'bg-red-100 text-red-800 border-red-300'
                                                : 'bg-green-100 text-green-800 border-green-300'
                                                }`}>
                                                {s.user?.isDeleted ? 'Đã xoá' : 'Hoạt động'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {s.user?.isDeleted ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={processingId === s.studentId}
                                                    onClick={() => handleRestore(s)}
                                                    className="text-xs text-green-600 border-green-200 hover:bg-green-50"
                                                >
                                                    {processingId === s.studentId ? '...' : '↩ Khôi phục'}
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={processingId === s.studentId}
                                                    onClick={() => setConfirmModalData({ open: true, student: s })}
                                                    className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                                                >
                                                    {processingId === s.studentId ? '...' : '🗑 Xoá'}
                                                </Button>
                                            )}
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
                    onPageSizeChange={() => { }}
                    totalCount={total}
                />
            </main>
            
            <ConfirmModal
                open={confirmModalData.open}
                onClose={() => setConfirmModalData({ open: false, student: null })}
                onConfirm={handleDelete}
                title="Xác nhận xóa sinh viên"
                description={
                    <span>
                        Bạn có chắc chắn muốn xóa sinh viên <b>{confirmModalData.student?.user?.fullName ?? confirmModalData.student?.studentCode}</b> không? Hành động này không thể hoàn tác.
                    </span>
                }
                isDanger={true}
                confirmText="Xóa"
            />
        </div>
    );
}
