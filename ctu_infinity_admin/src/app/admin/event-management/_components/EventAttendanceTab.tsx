'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  IEventAttendance,
  AttendanceStatus,
  attendanceApi,
  IEvent,
} from '@/services/event-management.service';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { formatDateTime } from '@/utils/formateDate';

// ─── Badge trạng thái điểm danh ──────────────────────────────────────────────

const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

const ATTENDANCE_STATUS_CLASS: Record<AttendanceStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  APPROVED: 'bg-green-100 text-green-800 border-green-300',
  REJECTED: 'bg-red-100 text-red-800 border-red-300',
};

function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ATTENDANCE_STATUS_CLASS[status]}`}
    >
      {ATTENDANCE_STATUS_LABEL[status]}
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  event: IEvent;
  onToast: (ok: boolean, msg: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EventAttendanceTab({ event, onToast }: Props) {
  const [attendances, setAttendances] = useState<IEventAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // ── Load attendances ───────────────────────────────────────────────────────

  const loadAttendances = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getByEvent(event.eventId);
      setAttendances(res.data?.attendances ?? []);
    } catch {
      onToast(false, 'Không thể tải danh sách điểm danh');
    } finally {
      setLoading(false);
    }
  }, [event.eventId, onToast]);

  // Auto-load khi component mount
  useEffect(() => {
    loadAttendances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Duyệt attendance ──────────────────────────────────────────────────────

  const handleApprove = async (att: IEventAttendance) => {
    setProcessingId(att.id);
    try {
      await attendanceApi.approve(att.id);
      onToast(
        true,
        `Đã duyệt điểm danh và cộng điểm cho sinh viên ${att.studentId.slice(0, 8)}...`,
      );
      loadAttendances();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { EM?: string; message?: string } };
      };
      onToast(
        false,
        error?.response?.data?.EM ??
          error?.response?.data?.message ??
          'Duyệt thất bại',
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ── Từ chối attendance ────────────────────────────────────────────────────

  const handleReject = async (att: IEventAttendance) => {
    setProcessingId(att.id);
    try {
      await attendanceApi.reject(att.id);
      onToast(true, 'Đã từ chối điểm danh');
      loadAttendances();
    } catch {
      onToast(false, 'Từ chối thất bại');
    } finally {
      setProcessingId(null);
    }
  };

  // Thống kê nhanh
  const pendingCount = attendances.filter((a) => a.status === 'PENDING').length;
  const approvedCount = attendances.filter(
    (a) => a.status === 'APPROVED',
  ).length;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Thống kê */}
      {!loading && attendances.length > 0 && (
        <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
          <span>
            Tổng: <strong>{attendances.length}</strong>
          </span>
          <span className="text-yellow-700">
            Chờ duyệt: <strong>{pendingCount}</strong>
          </span>
          <span className="text-green-700">
            Đã duyệt: <strong>{approvedCount}</strong>
          </span>
        </div>
      )}

      {/* Ghi chú requiresApproval */}
      {!event.requiresApproval && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
          ℹ️ Sự kiện này <strong>không yêu cầu duyệt điểm danh</strong> — sinh
          viên check-in sẽ được cộng điểm tự động (APPROVED ngay).
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sinh viên ID</TableHead>
              <TableHead>Thời gian check-in</TableHead>
              <TableHead>Phương thức</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Đang tải...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : attendances.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground text-sm"
                >
                  Chưa có dữ liệu điểm danh
                </TableCell>
              </TableRow>
            ) : (
              attendances.map((att) => (
                <TableRow key={att.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {att.studentId.slice(0, 12)}...
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatDateTime(att.checkInTime)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        att.checkInMethod === 'QR'
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : 'bg-orange-100 text-orange-800 border-orange-300'
                      }`}
                    >
                      {att.checkInMethod === 'QR' ? 'QR' : 'Thủ công'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <AttendanceStatusBadge status={att.status} />
                  </TableCell>
                  <TableCell>
                    {att.status === 'PENDING' ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={processingId === att.id}
                          onClick={() => handleApprove(att)}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs"
                        >
                          {processingId === att.id
                            ? '...'
                            : 'Duyệt & Cộng điểm'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingId === att.id}
                          onClick={() => handleReject(att)}
                          className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                        >
                          Từ chối
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
