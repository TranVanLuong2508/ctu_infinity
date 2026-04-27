'use client';

import { useState, useCallback, useEffect } from 'react';
import {
    IEventRegistration,
    RegistrationStatus,
    registrationApi,
    attendanceApi,
    IEvent,
} from '@/services/event-management.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { ConfirmModal } from '@/components/admin/modals/ConfirmModal';
import { formatDateTime } from '@/utils/formateDate';

// ─── Badge trạng thái ─────────────────────────────────────────────────────────

const STATUS_LABEL: Record<RegistrationStatus, string> = {
    REGISTERED: 'Đã đăng ký',
    ATTENDED: 'Đã điểm danh',
    CANCELLED: 'Đã hủy',
    ABSENT: 'Vắng mặt',
};

const STATUS_CLASS: Record<RegistrationStatus, string> = {
    REGISTERED: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200',
    ATTENDED: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200',
    CANCELLED: 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400',
    ABSENT: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300',
};

function StatusBadge({ status }: { status: RegistrationStatus }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_CLASS[status]}`}>
            {STATUS_LABEL[status]}
        </span>
    );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    event: IEvent;
    onToast: (ok: boolean, msg: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EventRegistrationsTab({ event, onToast }: Props) {
    const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'ALL'>('ALL');
    const [search, setSearch] = useState('');
    const [participants, setParticipants] = useState<IEventRegistration[]>([]);
    const [loading, setLoading] = useState(false);
    const [checkingIn, setCheckingIn] = useState<string | null>(null);
    const [markingAbsent, setMarkingAbsent] = useState(false);
    const [confirmCheckInTarget, setConfirmCheckInTarget] = useState<IEventRegistration | null>(null);
    const [confirmMarkAbsentOpen, setConfirmMarkAbsentOpen] = useState(false);

    // ── Load participants ──────────────────────────────────────────────────────

    const loadParticipants = useCallback(async (status?: RegistrationStatus) => {
        setLoading(true);
        try {
            const res = await registrationApi.getByEvent(event.eventId, status);
            setParticipants(res.data?.registrations ?? []);
        } catch {
            onToast(false, 'Không thể tải danh sách đăng ký');
        } finally {
            setLoading(false);
        }
    }, [event.eventId, onToast]);

    // Auto-load khi component mount
    useEffect(() => {
        loadParticipants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleStatusFilterChange = (value: RegistrationStatus | 'ALL') => {
        setStatusFilter(value);
        loadParticipants(value === 'ALL' ? undefined : value);
    };

    // ── Điểm danh thủ công ────────────────────────────────────────────────────

    const handleManualCheckIn = async () => {
        const participant = confirmCheckInTarget;
        if (!participant) return;
        setCheckingIn(participant.id);
        try {
            await attendanceApi.manualCheckIn(participant.studentId, event.eventId);
            onToast(true, `Điểm danh thành công cho ${participant.fullName}`);
            loadParticipants(statusFilter === 'ALL' ? undefined : statusFilter);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { EM?: string; message?: string } } };
            onToast(false, error?.response?.data?.EM ?? error?.response?.data?.message ?? 'Điểm danh thất bại');
        } finally {
            setCheckingIn(null);
            setConfirmCheckInTarget(null);
        }
    };

    // ── Đánh dấu vắng mặt ────────────────────────────────────────────────────

    const handleMarkAbsent = async () => {
        setMarkingAbsent(true);
        try {
            const res = await registrationApi.markAbsent(event.eventId);
            onToast(true, `Đã đánh dấu vắng mặt cho ${res.data?.affected ?? 0} sinh viên`);
            loadParticipants(statusFilter === 'ALL' ? undefined : statusFilter);
        } catch {
            onToast(false, 'Không thể đánh dấu vắng mặt');
        } finally {
            setMarkingAbsent(false);
            setConfirmMarkAbsentOpen(false);
        }
    };

    // ── Filter client-side ─────────────────────────────────────────────────────

    const filtered = participants.filter((p) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            p.fullName?.toLowerCase().includes(q) ||
            p.email?.toLowerCase().includes(q) ||
            p.studentCode?.toLowerCase().includes(q)
        );
    });

    // ─────────────────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                        placeholder="Tìm theo tên, email, mã sinh viên..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="sm:max-w-xs"
                    />
                    <Select
                        value={statusFilter}
                        onValueChange={(v) => handleStatusFilterChange(v as RegistrationStatus | 'ALL')}
                    >
                        <SelectTrigger className="sm:w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                            <SelectItem value="REGISTERED">Đã đăng ký</SelectItem>
                            <SelectItem value="ATTENDED">Đã điểm danh</SelectItem>
                            <SelectItem value="ABSENT">Vắng mặt</SelectItem>
                            <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Nút đánh dấu vắng mặt */}
                <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 text-sm whitespace-nowrap"
                    disabled={markingAbsent}
                    onClick={() => setConfirmMarkAbsentOpen(true)}
                >
                    {markingAbsent ? 'Đang xử lý...' : '⚠️ Đánh dấu vắng mặt'}
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Họ tên</TableHead>
                            <TableHead>Mã SV</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Đăng ký lúc</TableHead>
                            <TableHead>Điểm danh lúc</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">Đang tải...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground text-sm">
                                    Không tìm thấy sinh viên nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">{p.fullName ?? '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{p.studentCode ?? '—'}</TableCell>
                                    <TableCell className="text-muted-foreground">{p.email ?? '—'}</TableCell>
                                    <TableCell className="text-muted-foreground whitespace-nowrap">
                                        {p.registeredAt ? formatDateTime(p.registeredAt) : '—'}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground whitespace-nowrap">
                                        {p.attendedAt ? formatDateTime(p.attendedAt) : '—'}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={p.status} />
                                    </TableCell>
                                    <TableCell>
                                        {p.status === 'REGISTERED' && (
                                            <Button
                                                size="sm"
                                                disabled={checkingIn === p.id}
                                                className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                                onClick={() => setConfirmCheckInTarget(p)}
                                            >
                                                {checkingIn === p.id ? '...' : '✅ Điểm danh'}
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <p className="text-xs text-muted-foreground">
                Hiển thị {filtered.length} / {participants.length} sinh viên
            </p>

            <ConfirmModal
                open={!!confirmCheckInTarget}
                onClose={() => setConfirmCheckInTarget(null)}
                onConfirm={handleManualCheckIn}
                title="Xác nhận điểm danh"
                description={<>Bạn có chắc chắn muốn điểm danh thủ công cho sinh viên <b>{confirmCheckInTarget?.fullName}</b> ({confirmCheckInTarget?.studentCode}) không?</>}
                confirmText="Xác nhận"
            />

            <ConfirmModal
                open={confirmMarkAbsentOpen}
                onClose={() => setConfirmMarkAbsentOpen(false)}
                onConfirm={handleMarkAbsent}
                title="Xác nhận đánh dấu vắng mặt"
                description={<>Bạn có chắc chắn muốn đánh dấu tất cả các sinh viên ở trạng thái <b>Đã đăng ký</b> thành <b>Vắng mặt</b> không?</>}
                isDanger={true}
                confirmText="Xác nhận"
            />
        </div>
    );
}
