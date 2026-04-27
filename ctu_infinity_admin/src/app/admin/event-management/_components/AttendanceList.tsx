'use client';

import { useState } from 'react';
import {
  IEventAttendance,
  attendanceApi,
} from '@/services/event-management.service';
import { formatDateTime } from '@/utils/formateDate';
import { Button } from '@/components/ui/button';

interface Props {
  attendances: IEventAttendance[];
  loading: boolean;
  onRefresh: () => void;
  onToast: (ok: boolean, msg: string) => void;
}

function AttendanceStatusBadge({
  status,
}: {
  status: IEventAttendance['status'];
}) {
  const map: Record<IEventAttendance['status'], string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    APPROVED: 'bg-green-100 text-green-800 border-green-300',
    REJECTED: 'bg-red-100 text-red-800 border-red-300',
  };
  const labels: Record<IEventAttendance['status'], string> = {
    PENDING: 'Chờ duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function AttendanceList({
  attendances,
  loading,
  onRefresh,
  onToast,
}: Props) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (id: string, studentId: string) => {
    setProcessingId(id);
    try {
      await attendanceApi.approve(id);
      onToast(
        true,
        `Đã duyệt check-in của sinh viên ${studentId.slice(0, 8)}... và cộng điểm`,
      );
      onRefresh();
    } catch (err: any) {
      const msg = err?.response?.data?.EM ?? 'Duyệt thất bại';
      onToast(false, msg);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await attendanceApi.reject(id);
      onToast(true, 'Đã từ chối điểm danh');
      onRefresh();
    } catch {
      onToast(false, 'Từ chối thất bại');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        Đang tải...
      </div>
    );
  }

  if (attendances.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-4xl mb-3">📋</p>
        <p className="text-sm">Chưa có dữ liệu điểm danh</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Sinh viên ID</th>
              <th className="text-left px-4 py-3 font-medium">Sự kiện</th>
              <th className="text-left px-4 py-3 font-medium">
                Thời gian check-in
              </th>
              <th className="text-left px-4 py-3 font-medium">Trạng thái</th>
              <th className="text-left px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {attendances.map((att) => (
              <tr key={att.id} className="hover:bg-muted/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-xs text-muted-foreground">
                      {att.studentId.slice(0, 12)}...
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs w-fit ${att.checkInMethod === 'QR' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}">
                      {att.checkInMethod === 'QR' ? 'QR' : 'Thủ công'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {att.event?.eventName ?? att.eventId.slice(0, 8) + '...'}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {formatDateTime(att.checkInTime)}
                </td>
                <td className="px-4 py-3">
                  <AttendanceStatusBadge status={att.status} />
                </td>
                <td className="px-4 py-3">
                  {att.status === 'PENDING' ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={processingId === att.id}
                        onClick={() => handleApprove(att.id, att.studentId)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs"
                      >
                        {processingId === att.id ? '...' : 'Duyệt & Cộng điểm'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={processingId === att.id}
                        onClick={() => handleReject(att.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                      >
                        Từ chối
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Tổng: {attendances.length} lượt điểm danh | Chờ duyệt:{' '}
        {attendances.filter((a) => a.status === 'PENDING').length}
      </p>
    </>
  );
}
