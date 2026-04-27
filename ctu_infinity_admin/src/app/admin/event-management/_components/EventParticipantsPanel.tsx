'use client';

import { useState, useCallback } from 'react';
import {
  IEvent,
  IEventRegistration,
  RegistrationStatus,
  registrationApi,
  attendanceApi,
} from '@/services/event-management.service';
import { IOrganizer } from '@/services/organizer.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmModal } from '@/components/admin/modals/ConfirmModal';
import { Loader2 } from 'lucide-react';
import { formatDate, formatDateTime } from '@/utils/formateDate';

interface Props {
  /** Danh sách sự kiện để chọn (lấy từ tab 'all' đã load sẵn) */
  events: IEvent[];
  /** Danh sách ban tổ chức (chỉ admin mới cần) */
  organizers: IOrganizer[];
  /** Có phải role admin không */
  isAdmin: boolean;
  onToast: (ok: boolean, msg: string) => void;
}

// ─── Badge trạng thái tham gia ────────────────────────────────────────────────

const STATUS_LABEL: Record<RegistrationStatus, string> = {
  REGISTERED: 'Đã đăng ký',
  ATTENDED: 'Đã điểm danh',
  CANCELLED: 'Đã hủy',
  ABSENT: 'Vắng mặt',
};

const STATUS_CLASS: Record<RegistrationStatus, string> = {
  REGISTERED:
    'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200',
  ATTENDED:
    'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200',
  CANCELLED:
    'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400',
  ABSENT:
    'bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300',
};

function StatusBadge({ status }: { status: RegistrationStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function EventParticipantsPanel({
  events,
  organizers,
  isAdmin,
  onToast,
}: Props) {
  const [selectedOrganizerId, setSelectedOrganizerId] =
    useState<string>('__all__');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'ALL'>(
    'ALL',
  );
  const [search, setSearch] = useState('');
  const [participants, setParticipants] = useState<IEventRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [markingAbsent, setMarkingAbsent] = useState(false);
  const [confirmCheckInTarget, setConfirmCheckInTarget] =
    useState<IEventRegistration | null>(null);
  const [confirmMarkAbsentOpen, setConfirmMarkAbsentOpen] = useState(false);

  // ── Lọc events theo ban tổ chức đã chọn ──────────────────────────────────

  const filteredEvents =
    selectedOrganizerId === '__all__'
      ? events
      : events.filter(
          (ev) => ev.organizer?.organizerId === selectedOrganizerId,
        );

  // Reset event khi đổi organizer
  const handleOrganizerChange = (organizerId: string) => {
    setSelectedOrganizerId(organizerId);
    setSelectedEventId('');
    setParticipants([]);
    setSearch('');
    setStatusFilter('ALL');
  };

  // ── Tải danh sách sinh viên của sự kiện đã chọn ──────────────────────────

  const loadParticipants = useCallback(
    async (eventId: string, status?: RegistrationStatus) => {
      if (!eventId) return;
      setLoading(true);
      try {
        const res = await registrationApi.getByEvent(eventId, status);
        setParticipants(res.data?.registrations ?? []);
      } catch {
        onToast(false, 'Không thể tải danh sách sinh viên');
      } finally {
        setLoading(false);
      }
    },
    [onToast],
  );

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    setStatusFilter('ALL');
    setSearch('');
    loadParticipants(eventId);
  };

  const handleStatusFilterChange = (value: RegistrationStatus | 'ALL') => {
    setStatusFilter(value);
    loadParticipants(selectedEventId, value === 'ALL' ? undefined : value);
  };

  const handleManualCheckIn = async () => {
    const participant = confirmCheckInTarget;
    if (!participant) return;

    setCheckingIn(participant.id);
    try {
      await attendanceApi.manualCheckIn(participant.studentId, selectedEventId);
      onToast(true, `Điểm danh thành công cho ${participant.fullName}`);
      loadParticipants(
        selectedEventId,
        statusFilter === 'ALL' ? undefined : statusFilter,
      );
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { EM?: string; message?: string } };
      };
      onToast(
        false,
        error?.response?.data?.EM ??
          error?.response?.data?.message ??
          'Điểm danh thất bại',
      );
    } finally {
      setCheckingIn(null);
      setConfirmCheckInTarget(null);
    }
  };

  const handleMarkAbsent = async () => {
    if (!selectedEventId) return;

    setMarkingAbsent(true);
    try {
      const res = await registrationApi.markAbsent(selectedEventId);
      onToast(
        true,
        `Đã đánh dấu vắng mặt cho ${res.data?.affected ?? 0} sinh viên`,
      );
      loadParticipants(
        selectedEventId,
        statusFilter === 'ALL' ? undefined : statusFilter,
      );
    } catch {
      onToast(false, 'Không thể đánh dấu vắng mặt');
    } finally {
      setMarkingAbsent(false);
      setConfirmMarkAbsentOpen(false);
    }
  };

  // ── Lọc tìm kiếm phía client ──────────────────────────────────────────────

  const filtered = participants.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.fullName?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.studentCode?.toLowerCase().includes(q)
    );
  });

  const selectedEvent = events.find((e) => e.eventId === selectedEventId);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Chọn ban tổ chức + sự kiện */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
        {/* Chọn Ban tổ chức */}
        {isAdmin && (
          <div className="space-y-1 min-w-[200px]">
            <Label>Ban tổ chức</Label>
            <Select
              value={
                selectedOrganizerId === '__all__'
                  ? '__all__'
                  : selectedOrganizerId
              }
              onValueChange={handleOrganizerChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả ban tổ chức" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tất cả ban tổ chức</SelectItem>
                {organizers.map((o) => (
                  <SelectItem key={o.organizerId} value={o.organizerId}>
                    {o.organizerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Chọn Sự kiện */}
        <div className="flex-1 space-y-1">
          <Label>Chọn sự kiện</Label>
          <Select value={selectedEventId} onValueChange={handleEventChange}>
            <SelectTrigger>
              <SelectValue
                placeholder={
                  filteredEvents.length === 0
                    ? 'Không có sự kiện nào'
                    : 'Chọn sự kiện để xem danh sách sinh viên...'
                }
              />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {filteredEvents.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {selectedOrganizerId !== '__all__'
                    ? 'Không có sự kiện nào thuộc ban này'
                    : 'Không có sự kiện nào'}
                </div>
              ) : (
                filteredEvents.map((ev) => (
                  <SelectItem key={ev.eventId} value={ev.eventId}>
                    <div className="flex flex-col">
                      <span>{ev.eventName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(ev.startDate)} ·{' '}
                        {ev.status}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedEventId && (
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 text-sm shrink-0"
            disabled={markingAbsent}
            onClick={() => setConfirmMarkAbsentOpen(true)}
          >
            {markingAbsent ? 'Đang xử lý...' : '⚠️ Đánh dấu vắng mặt'}
          </Button>
        )}
      </div>

      {/* Thống kê sự kiện */}
      {selectedEvent && (
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm flex flex-wrap gap-4">
          <span>
            <strong>Sự kiện:</strong> {selectedEvent.eventName}
          </span>
          <span>
            <strong>Trạng thái:</strong> {selectedEvent.status}
          </span>
          <span>
            <strong>Điểm:</strong> {selectedEvent.score ?? '—'}
          </span>
          <span>
            <strong>Yêu cầu duyệt:</strong>{' '}
            {selectedEvent.requiresApproval ? 'Có' : 'Không'}
          </span>
        </div>
      )}

      {selectedEventId && (
        <>
          {/* Bộ lọc */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Tìm theo tên, email, mã sinh viên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                handleStatusFilterChange(v as RegistrationStatus | 'ALL')
              }
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

          {/* Bảng sinh viên */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
              Đang tải...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <p className="text-4xl mb-3">👤</p>
              <p className="text-sm">Không tìm thấy sinh viên nào</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">
                        Họ tên
                      </th>
                      <th className="text-left px-4 py-3 font-medium">Email</th>
                      <th className="text-left px-4 py-3 font-medium">Mã SV</th>
                      <th className="text-left px-4 py-3 font-medium">
                        Đăng ký lúc
                      </th>
                      <th className="text-left px-4 py-3 font-medium">
                        Điểm danh lúc
                      </th>
                      <th className="text-left px-4 py-3 font-medium">
                        Trạng thái
                      </th>
                      <th className="text-left px-4 py-3 font-medium">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">
                          {p.fullName ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {p.email ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {p.studentCode ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {p.registeredAt
                            ? formatDateTime(p.registeredAt)
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {p.attendedAt
                            ? formatDateTime(p.attendedAt)
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-4 py-3">
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                Hiển thị {filtered.length} / {participants.length} sinh viên
              </p>
            </>
          )}
        </>
      )}

      {!selectedEventId && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-sm">
            Chọn một sự kiện để xem danh sách sinh viên tham gia
          </p>
        </div>
      )}

      <ConfirmModal
        open={!!confirmCheckInTarget}
        onClose={() => setConfirmCheckInTarget(null)}
        onConfirm={handleManualCheckIn}
        title="Xác nhận điểm danh"
        description={
          <>
            Bạn có chắc chắn muốn điểm danh thủ công cho sinh viên{' '}
            <b>{confirmCheckInTarget?.fullName}</b> (
            {confirmCheckInTarget?.studentCode}) không?
          </>
        }
        confirmText="Xác nhận"
      />

      <ConfirmModal
        open={confirmMarkAbsentOpen}
        onClose={() => setConfirmMarkAbsentOpen(false)}
        onConfirm={handleMarkAbsent}
        title="Xác nhận đánh dấu vắng mặt"
        description={
          <>
            Bạn có chắc chắn muốn đánh dấu tất cả các sinh viên ở trạng thái{' '}
            <b>Đã đăng ký</b> thành <b>Vắng mặt</b> không?
          </>
        }
        isDanger={true}
        confirmText="Xác nhận"
      />
    </div>
  );
}
