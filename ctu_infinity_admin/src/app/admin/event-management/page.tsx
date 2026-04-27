'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  eventMgmtApi,
  attendanceApi,
  IEvent,
  IEventAttendance,
  EventStatus,
} from '@/services/event-management.service';
import { organizerApi, IOrganizer } from '@/services/organizer.service';
import { EventList } from './_components/EventList';
import { AttendanceList } from './_components/AttendanceList';
import { EventParticipantsPanel } from './_components/EventParticipantsPanel';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import AdminHeader from '@/components/admin/layout/AdminHeader';

type Tab = 'all' | 'draft' | 'pending' | 'approved' | 'attendances' | 'participants';

// ── Tab sets theo role ────────────────────────────────────────────────────────

const ADMIN_TABS: { value: Tab; label: string }[] = [
  { value: 'all', label: 'Tất cả sự kiện' },
  { value: 'draft', label: 'Bản nháp' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'attendances', label: 'Điểm danh' },
  { value: 'participants', label: 'Quản lý tham gia' },
];

/**
 * ORGANIZER tabs – Quản lý tham gia và Duyệt điểm danh giờ có trang riêng
 * truy cập qua sidebar, nên không cần đặt ở đây nữa.
 */
const ORGANIZER_TABS: { value: Tab; label: string }[] = [
  { value: 'draft', label: 'Bản nháp' },
  { value: 'pending', label: 'Đã gửi duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
];

export default function EventManagementPage() {
  const router = useRouter();
  const { authUser } = useAuthStore();

  const isOrganizer = authUser?.roleName === 'ORGANIZER';
  const TABS = isOrganizer ? ORGANIZER_TABS : ADMIN_TABS;

  /**
   * Khi ORGANIZER load events, luôn truyền createdBy để chỉ lấy sự kiện
   * do chính họ tạo ra. authUser.userId là UUID lưu trong JWT.
   */
  const createdByFilter = isOrganizer && authUser?.userId
    ? String(authUser.userId)
    : undefined;

  // Organizer bắt đầu ở tab draft; Admin bắt đầu ở tab all
  const [tab, setTab] = useState<Tab>(isOrganizer ? 'draft' : 'all');
  const [events, setEvents] = useState<IEvent[]>([]);
  const [draftEvents, setDraftEvents] = useState<IEvent[]>([]);
  const [pendingEvents, setPendingEvents] = useState<IEvent[]>([]);
  const [approvedEvents, setApprovedEvents] = useState<IEvent[]>([]);
  const [attendances, setAttendances] = useState<IEventAttendance[]>([]);
  const [organizers, setOrganizers] = useState<IOrganizer[]>([]);
  const [loading, setLoading] = useState(false);

  // Ref lưu danh sách eventId của Organizer để tránh tạo dependency vòng lặp
  const myEventIdsRef = useRef<Set<string>>(new Set());

  // ── Loaders ──────────────────────────────────────────────────────────
  const loadEvents = useCallback(async (params?: {
    status?: EventStatus;
    organizerId?: string;
  }) => {
    setLoading(true);
    try {
      const res = await eventMgmtApi.getAll({
        createdBy: createdByFilter,
        ...params,
      });
      const evList = res.data?.events ?? [];
      setEvents(evList);
      // Cập nhật ref để loadAttendances có thể dùng mà không cần events trong deps
      myEventIdsRef.current = new Set(evList.map((e) => e.eventId));
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [createdByFilter]);

  const loadDraftEvents = useCallback(async (params?: { organizerId?: string }) => {
    setLoading(true);
    try {
      const res = await eventMgmtApi.getAll({
        status: 'DRAFT',
        createdBy: createdByFilter,
        ...params,
      });
      setDraftEvents(res.data?.events ?? []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [createdByFilter]);

  const loadPendingEvents = useCallback(async (params?: { organizerId?: string }) => {
    setLoading(true);
    try {
      const res = await eventMgmtApi.getAll({
        status: 'PENDING',
        createdBy: createdByFilter,
        ...params,
      });
      setPendingEvents(res.data?.events ?? []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [createdByFilter]);

  const loadApprovedEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await eventMgmtApi.getAll({
        status: 'APPROVED',
        createdBy: createdByFilter,
      });
      setApprovedEvents(res.data?.events ?? []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [createdByFilter]);

  const loadAttendances = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getAll();
      const all = res.data?.attendances ?? [];

      if (isOrganizer && createdByFilter) {
        // Dùng ref (cập nhật bởi loadEvents) để tránh tạo dependency vòng lặp
        let myEventIds = myEventIdsRef.current;

        // Nếu ref chưa có dữ liệu (lần đầu vào tab attendances thẳng), fetch một lần
        if (myEventIds.size === 0) {
          const r = await eventMgmtApi.getAll({ createdBy: createdByFilter });
          const evList = r.data?.events ?? [];
          myEventIds = new Set(evList.map((e) => e.eventId));
          myEventIdsRef.current = myEventIds;
          setEvents(evList);
        }

        setAttendances(all.filter((a) => myEventIds.has(a.eventId)));
      } else {
        setAttendances(all);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOrganizer, createdByFilter]); // intentionally omit events — dùng ref thay thế

  // Load organizers danh sách ban tổ chức (chỉ cần load 1 lần)
  useEffect(() => {
    if (isOrganizer) return;
    organizerApi.getAll().then((res) => {
      setOrganizers(res.data?.organizers ?? []);
    });
  }, [isOrganizer]);

  // Load data when switching tabs
  useEffect(() => {
    if (tab === 'all') loadEvents();
    if (tab === 'draft') loadDraftEvents();
    if (tab === 'pending') loadPendingEvents();
    if (tab === 'approved') loadApprovedEvents();
    if (tab === 'attendances') loadAttendances();
    // participants cần full events list (đã filter bởi createdBy cho organizer)
    if (tab === 'participants') loadEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="flex flex-col h-full w-full">
      <AdminHeader />

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">
        {/* Toolbar */}
        <div className="flex items-center justify-end mb-6">
          <Button
            onClick={() => router.push('/admin/event-management/create')}
            className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          >
            ➕ Tạo sự kiện mới
          </Button>
        </div>

        {/* Tab switcher */}
        <div className="inline-flex rounded-lg border border-border bg-muted p-1 mb-6 flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`py-1.5 px-3 rounded-md text-sm font-medium transition-all ${tab === t.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}

        {/* ── ADMIN: tất cả sự kiện ─────────────────────────────────── */}
        {tab === 'all' && !isOrganizer && (
          <EventList
            events={events}
            loading={loading}
            onRefresh={loadEvents}
            onToast={(ok, msg) => ok ? toast.success(msg) : toast.error(msg)}
            showApprove={false}
            showSubmitForApproval={false}
            showFilters={true}
            isOrganizer={isOrganizer}
            onLoadWithFilters={loadEvents}
          />
        )}

        {/* ── DRAFT: ADMIN (submit) | ORGANIZER (edit + submit) ─────── */}
        {tab === 'draft' && (
          <EventList
            events={draftEvents}
            loading={loading}
            onRefresh={() => loadDraftEvents()}
            onToast={(ok, msg) => ok ? toast.success(msg) : toast.error(msg)}
            showApprove={false}
            showSubmitForApproval={true}
            showEdit={isOrganizer}
            defaultStatus="DRAFT"
            isOrganizer={isOrganizer}
            onLoadWithFilters={isOrganizer ? undefined : loadDraftEvents}
          />
        )}

        {/* ── PENDING: ADMIN (approve/reject) | ORGANIZER (view only) ── */}
        {tab === 'pending' && (
          <EventList
            events={pendingEvents}
            loading={loading}
            onRefresh={() => loadPendingEvents()}
            onToast={(ok, msg) => ok ? toast.success(msg) : toast.error(msg)}
            showApprove={!isOrganizer}
            showSubmitForApproval={false}
            defaultStatus="PENDING"
            isOrganizer={isOrganizer}
            onLoadWithFilters={isOrganizer ? undefined : loadPendingEvents}
          />
        )}

        {/* ── APPROVED: ORGANIZER (xem, tạo QR) ────────────────────── */}
        {tab === 'approved' && isOrganizer && (
          <EventList
            events={approvedEvents}
            loading={loading}
            onRefresh={loadApprovedEvents}
            onToast={(ok, msg) => ok ? toast.success(msg) : toast.error(msg)}
            showApprove={false}
            showSubmitForApproval={false}
          />
        )}

        {/* ── ATTENDANCES: cả ADMIN lẫn ORGANIZER ──────────────────── */}
        {tab === 'attendances' && (
          <AttendanceList
            attendances={attendances}
            loading={loading}
            onRefresh={loadAttendances}
            onToast={(ok, msg) => ok ? toast.success(msg) : toast.error(msg)}
          />
        )}

        {/* ── PARTICIPANTS: cả ADMIN lẫn ORGANIZER (events đã filter) ── */}
        {tab === 'participants' && (
          <EventParticipantsPanel
            events={events}
            organizers={organizers}
            isAdmin={!isOrganizer}
            onToast={(ok, msg) => ok ? toast.success(msg) : toast.error(msg)}
          />
        )}
      </main>
    </div>
  );
}
