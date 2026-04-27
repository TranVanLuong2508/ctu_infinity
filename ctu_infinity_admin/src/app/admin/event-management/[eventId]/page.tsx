'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';
import { eventMgmtApi, IEvent } from '@/services/event-management.service';
import { CriteriaService } from '@/services/criteria.service';
import { ICriteria } from '@/types/criteria.type';
import { Button } from '@/components/ui/button';
import { QRCodeModal } from '../_components/QRCodeModal';
import { EventRegistrationsTab } from '../_components/EventRegistrationsTab';
import { EventAttendanceTab } from '../_components/EventAttendanceTab';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { useAuthStore } from '@/stores/authStore';
import { QrCode } from 'lucide-react';
import { semestersApi, ISemester } from '@/services/academic-schedule.service';
import { formatDateTime, formatDate } from '@/utils/formateDate';

// ─── Types ────────────────────────────────────────────────────────────────────

type DetailTab = 'info' | 'registrations' | 'attendance';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<IEvent['status'], { label: string; className: string }> = {
    DRAFT: { label: 'Bản nháp', className: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200' },
    PENDING: { label: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200' },
    APPROVED: { label: 'Đã duyệt', className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200' },
    REJECTED: { label: 'Từ chối', className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200' },
};

// ─── InfoRow helper ───────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5 py-2 border-b border-border last:border-0">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
            <span className="text-sm">{value ?? '—'}</span>
        </div>
    );
}

/** Strip basic markdown syntax to get plain text */
function stripMarkdown(text: string): string {
    return text
        .replace(/#{1,6}\s+/g, '')          // headers
        .replace(/\*\*(.+?)\*\*/g, '$1')     // bold
        .replace(/\*(.+?)\*/g, '$1')         // italic
        .replace(/~~(.+?)~~/g, '$1')         // strikethrough
        .replace(/`{1,3}[^`]*`{1,3}/g, '')  // code
        .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links
        .replace(/!\[[^\]]*\]\(.+?\)/g, '')  // images
        .replace(/^\s*[-*+]\s+/gm, '')       // list bullets
        .replace(/^\s*\d+\.\s+/gm, '')       // numbered lists
        .replace(/^\s*>\s+/gm, '')           // blockquotes
        .replace(/\n{2,}/g, '\n')           // multiple newlines
        .trim();
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EventDetailPage() {
    const { eventId } = useParams<{ eventId: string }>();
    const router = useRouter();
    const { authUser } = useAuthStore();
    const isOrganizer = authUser?.roleName === 'ORGANIZER';

    const [event, setEvent] = useState<IEvent | null>(null);
    const [criteria, setCriteria] = useState<ICriteria | null>(null);
    const [semesters, setSemesters] = useState<ISemester[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<DetailTab>('info');
    const [qrModalOpen, setQrModalOpen] = useState(false);

    // ── Fetch event ───────────────────────────────────────────────────────────

    useEffect(() => {
        if (!eventId) return;

        const fetchEvent = async () => {
            setLoading(true);
            setError(null);
            try {
                const [eventRes, semRes] = await Promise.all([
                    eventMgmtApi.getOne(eventId),
                    semestersApi.getAll(),
                ]);
                setEvent(eventRes.data ?? null);
                setSemesters(semRes.data?.semesters ?? []);
            } catch {
                setError('Không thể tải thông tin sự kiện');
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [eventId]);

    // ── Fetch criteria name khi có event ─────────────────────────────────────

    useEffect(() => {
        if (event?.criteriaId) {
            CriteriaService.CallGetCriteriaDetail(event.criteriaId)
                .then((res) => {
                    if (res.data) setCriteria(res.data);
                })
                .catch(() => { /* không làm hỏng page nếu không fetch được */ });
        }
    }, [event?.criteriaId]);

    // ── Loading / Error states ────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground text-sm">Đang tải thông tin sự kiện...</p>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-red-500 text-sm">{error ?? 'Không tìm thấy sự kiện'}</p>
                <Button variant="outline" onClick={() => router.back()}>← Quay lại</Button>
            </div>
        );
    }

    const statusCfg = STATUS_CONFIG[event.status];

    // Danh sách tabs – ORGANIZER không thấy tab Duyệt điểm danh nếu không phải sự kiện cần duyệt
    const tabs: { value: DetailTab; label: string }[] = [
        { value: 'info', label: 'Thông tin chung' },
        { value: 'registrations', label: 'Danh sách đăng ký' },
        ...(event.requiresApproval || !isOrganizer
            ? [{ value: 'attendance' as DetailTab, label: 'Duyệt điểm danh' }]
            : []),
    ];

    // ─────────────────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full w-full">
            <AdminHeader />

            {/* Header bar */}
            <div className="border-b border-border bg-card/50 px-6 py-4 flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => router.back()}>
                    ← Quay lại
                </Button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold truncate">{event.eventName}</h1>
                    <p className="text-sm text-muted-foreground">Chi tiết sự kiện</p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.className}`}>
                    {statusCfg.label}
                </span>
                {event.status === 'APPROVED' && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => setQrModalOpen(true)}
                    >
                        <QrCode className="w-4 h-4 mr-1" />
                        Mã QR
                    </Button>
                )}
            </div>

            {/* Tab switcher */}
            <div className="border-b border-border px-6">
                <div className="flex gap-0">
                    {tabs.map((t) => (
                        <button
                            key={t.value}
                            onClick={() => setActiveTab(t.value)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.value
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab content */}
            <main className="flex-1 overflow-auto p-6 max-w-5xl w-full mx-auto">

                {/* ── Tab 1: Thông tin chung ─────────────────────────────────── */}
                {activeTab === 'info' && (
                    <div className="space-y-6">
                        <div className="rounded-xl border border-border bg-card p-6">
                            <h2 className="text-base font-semibold mb-4">Thông tin chung</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                                <InfoRow label="Tên sự kiện" value={event.eventName} />
                                <InfoRow label="Ban tổ chức" value={event.organizer?.organizerName} />
                                <InfoRow label="Thời gian bắt đầu" value={formatDateTime(event.startDate)} />
                                <InfoRow label="Thời gian kết thúc" value={formatDateTime(event.endDate)} />
                                {event.registrationDeadline && (
                                    <InfoRow label="Hạn đăng ký" value={formatDateTime(event.registrationDeadline)} />
                                )}
                                <InfoRow label="Địa điểm" value={event.location} />
                                <InfoRow label="Sức chứa tối đa" value={event.maxParticipants != null ? `${event.maxParticipants} sinh viên` : null} />
                                <InfoRow label="Yêu cầu duyệt điểm" value={event.requiresApproval ? 'Có' : 'Không'} />
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-6">
                            <h2 className="text-base font-semibold mb-4">Điểm rèn luyện</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                                <InfoRow
                                    label="Tiêu chí điểm"
                                    value={
                                        criteria
                                            ? `${criteria.criteriaCode} - ${criteria.criteriaName}`
                                            : event.criteriaId
                                                ? 'Đang tải...'
                                                : 'Chưa gắn tiêu chí'
                                    }
                                />
                                <InfoRow
                                    label="Điểm sự kiện"
                                    value={event.score != null ? event.score : 'Chưa xác định'}
                                />
                            </div>
                        </div>

                        {event.categories && event.categories.length > 0 && (
                            <div className="rounded-xl border border-border bg-card p-6">
                                <h2 className="text-base font-semibold mb-4">Danh mục</h2>
                                <div className="flex flex-wrap gap-2">
                                    {event.categories.map((cat) => (
                                        <span
                                            key={cat.categoryId}
                                            className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                                        >
                                            {cat.categoryName}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {event.description && (
                            <div className="rounded-xl border border-border bg-card p-6">
                                <h2 className="text-base font-semibold mb-3">Mô tả</h2>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                    {stripMarkdown(event.description)}
                                </p>
                            </div>
                        )}

                        <div className="rounded-xl border border-border bg-card p-6">
                            <h2 className="text-base font-semibold mb-4">Thông tin duyệt</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                                <InfoRow label="Người tạo" value={event.creator?.fullName} />
                                <InfoRow label="Người duyệt" value={event.approver?.fullName ?? '—'} />
                                <InfoRow label="Ngày tạo" value={formatDateTime(event.createdAt)} />
                                <InfoRow label="Ngày duyệt" value={event.approvedAt ? formatDateTime(event.approvedAt) : '—'} />
                                <InfoRow label="Học kỳ" value={(() => {
                                    const sem = semesters.find((s) => s.semesterId === event.semesterId);
                                    return sem ? sem.semesterName : event.semesterId ?? '—';
                                })()} />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Tab 2: Danh sách đăng ký ──────────────────────────────── */}
                {activeTab === 'registrations' && (
                    <EventRegistrationsTab event={event} onToast={(ok, msg) => ok ? toast.success(msg) : toast.error(msg)} />
                )}

                {/* ── Tab 3: Duyệt điểm danh ────────────────────────────────── */}
                {activeTab === 'attendance' && (
                    <EventAttendanceTab event={event} onToast={(ok, msg) => ok ? toast.success(msg) : toast.error(msg)} />
                )}
            </main>

            {/* QR Modal */}
            {qrModalOpen && (
                <QRCodeModal
                    eventId={event.eventId}
                    eventName={event.eventName}
                    isOpen={qrModalOpen}
                    onClose={() => setQrModalOpen(false)}
                />
            )}
        </div>
    );
}
