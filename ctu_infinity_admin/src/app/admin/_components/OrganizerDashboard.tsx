'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { eventMgmtApi, attendanceApi, IEvent, IEventAttendance } from '@/services/event-management.service';
import { academicYearApi, semestersApi, IAcademicYear, ISemester } from '@/services/academic-schedule.service';
import { adminPath } from '@/constants/path';
import { Loader2, CalendarDays, Send, CheckSquare, ClipboardCheck, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/utils/formateDate';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';

// ─── Metric Card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
    title: string;
    value: number;
    subtitle?: string;
    icon: React.ComponentType<{ className?: string }>;
    color: 'blue' | 'yellow' | 'green' | 'orange';
    onClick?: () => void;
    loading?: boolean;
}

const COLOR_MAP = {
    blue: 'bg-blue-50 dark:bg-blue-950',
    yellow: 'bg-yellow-50 dark:bg-yellow-950',
    green: 'bg-green-50 dark:bg-green-950',
    orange: 'bg-orange-50 dark:bg-orange-950',
};
const ICON_COLOR_MAP = {
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
};

function MetricCard({ title, value, subtitle, icon: Icon, color, onClick, loading }: MetricCardProps) {
    return (
        <div
            className={`rounded-xl shadow-md border-0 p-5 ${COLOR_MAP[color]} ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200' : ''}`}
            onClick={onClick}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-muted-foreground font-medium">{title}</p>
                    {loading
                        ? <Loader2 className="w-5 h-5 animate-spin mt-2 text-muted-foreground" />
                        : <p className="text-3xl font-bold mt-1">{value}</p>
                    }
                    {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
                </div>
                <Icon className={`w-8 h-8 ${ICON_COLOR_MAP[color]} opacity-70`} />
            </div>
        </div>
    );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

type EventStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
const STATUS_LABEL: Record<EventStatus, string> = {
    DRAFT: 'Bản nháp', PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối',
};
const STATUS_CLASS: Record<EventStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-700 border-gray-300',
    PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    APPROVED: 'bg-green-100 text-green-700 border-green-300',
    REJECTED: 'bg-red-100 text-red-700 border-red-300',
};

function StatusBadge({ status }: { status: EventStatus }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_CLASS[status]}`}>
            {STATUS_LABEL[status]}
        </span>
    );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    /** userId của ORGANIZER đang đăng nhập */
    userId: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OrganizerDashboard({ userId }: Props) {
    const router = useRouter();

    const [myEvents, setMyEvents] = useState<IEvent[]>([]);
    const [pendingAttendances, setPendingAttendances] = useState<IEventAttendance[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [timeFilter, setTimeFilter] = useState('ALL'); // ALL, TODAY, WEEK, MONTH, CUSTOM, ACADEMIC
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // Academic Calendar states
    const [academicYears, setAcademicYears] = useState<IAcademicYear[]>([]);
    const [semesters, setSemesters] = useState<ISemester[]>([]);
    const [selectedYearId, setSelectedYearId] = useState<string>('ALL');
    const [selectedSemesterId, setSelectedSemesterId] = useState<string>('ALL');

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [eventsRes, attendancesRes, yearsRes] = await Promise.allSettled([
                    eventMgmtApi.getAll({ createdBy: userId }),
                    attendanceApi.getAll(),
                    academicYearApi.getAll()
                ]);

                let allMyEvents: IEvent[] = [];
                if (eventsRes.status === 'fulfilled') {
                    allMyEvents = eventsRes.value.data?.events ?? [];
                    setMyEvents(allMyEvents);
                }

                if (attendancesRes.status === 'fulfilled') {
                    const allAttendances = attendancesRes.value.data?.attendances ?? [];
                    const myEventIds = new Set(allMyEvents.map((e) => e.eventId));
                    const myPendingAttendances = allAttendances.filter(
                        (a) => a.status === 'PENDING' && myEventIds.has(a.eventId),
                    );
                    setPendingAttendances(myPendingAttendances);
                }

                if (yearsRes.status === 'fulfilled') {
                    setAcademicYears(yearsRes.value.data?.academicYears ?? []);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [userId]);

    // Load semesters when year changes
    useEffect(() => {
        if (selectedYearId && selectedYearId !== 'ALL') {
            semestersApi.getByYear(selectedYearId).then(res => {
                setSemesters(res.data?.semesters ?? []);
                setSelectedSemesterId('ALL');
            }).catch(() => setSemesters([]));
        } else {
            setSemesters([]);
            setSelectedSemesterId('ALL');
        }
    }, [selectedYearId]);


    // ─── Filter Logic ─────────────────────────────────────────────────────────
    const filteredEvents = useMemo(() => {
        return myEvents.filter(ev => {
            const evStart = new Date(ev.startDate);
            const now = new Date();

            // 1. Lọc theo thời gian chung
            if (timeFilter !== 'ALL') {
                let start: Date | null = null;
                let end: Date | null = null;

                if (timeFilter === 'TODAY') {
                    start = new Date(now.setHours(0, 0, 0, 0));
                    end = new Date(now.setHours(23, 59, 59, 999));
                } else if (timeFilter === 'WEEK') {
                    const first = now.getDate() - now.getDay() + 1;
                    start = new Date(now.setDate(first));
                    start.setHours(0, 0, 0, 0);
                    end = new Date(now.setDate(first + 6));
                    end.setHours(23, 59, 59, 999);
                } else if (timeFilter === 'MONTH') {
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                } else if (timeFilter === 'CUSTOM') {
                    if (customStartDate) start = new Date(customStartDate);
                    if (customEndDate) {
                        end = new Date(customEndDate);
                        end.setHours(23, 59, 59, 999);
                    }
                } else if (timeFilter === 'ACADEMIC') {
                    // Check year logic
                    if (selectedYearId !== 'ALL') {
                        const year = academicYears.find(y => y.yearId === selectedYearId);
                        if (selectedSemesterId === 'ALL') {
                            if (year) {
                                start = new Date(year.startDate);
                                end = new Date(year.endDate);
                                end.setHours(23, 59, 59, 999);
                            }
                        } else {
                            const sem = semesters.find(s => s.semesterId === selectedSemesterId);
                            if (sem) {
                                start = new Date(sem.startDate);
                                end = new Date(sem.endDate);
                                end.setHours(23, 59, 59, 999);
                            }
                        }
                    }
                }

                if (start && evStart < start) return false;
                if (end && evStart > end) return false;
            }

            return true;
        });
    }, [myEvents, timeFilter, customStartDate, customEndDate, selectedYearId, selectedSemesterId, academicYears, semesters]);


    // Metrics (Dựa trên list đã filter)
    const draftCount = filteredEvents.filter((e) => e.status === 'DRAFT').length;
    const pendingCount = filteredEvents.filter((e) => e.status === 'PENDING').length;
    const approvedCount = filteredEvents.filter((e) => e.status === 'APPROVED').length;

    // 5 sự kiện gần đây (sort theo createdAt desc)
    const recentEvents = [...filteredEvents]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    const resetFilters = () => {
        setTimeFilter('ALL');
        setCustomStartDate('');
        setCustomEndDate('');
        setSelectedYearId('ALL');
        setSelectedSemesterId('ALL');
    };

    return (
        <div className="space-y-8">
            {/* Welcome Banner */}
            <div className="rounded-xl border border-border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-6">
                <h2 className="text-lg font-bold">👋 Xin chào, Ban tổ chức!</h2>
                <p className="text-sm text-muted-foreground mt-1">Đây là tổng quan các sự kiện bạn đã tạo và đang quản lý.</p>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl shadow-sm border border-border/50 p-5">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-end">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">Thời gian</label>
                        <Select value={timeFilter} onValueChange={setTimeFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn thời gian" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tất cả thời gian</SelectItem>
                                <SelectItem value="ACADEMIC">Theo năm học / học kỳ</SelectItem>
                                <SelectItem value="TODAY">Hôm nay</SelectItem>
                                <SelectItem value="WEEK">Tuần này</SelectItem>
                                <SelectItem value="MONTH">Tháng này</SelectItem>
                                <SelectItem value="CUSTOM">Tùy chọn khoảng ngày...</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {timeFilter === 'CUSTOM' && (
                        <>
                            <DatePicker
                                label="Từ ngày"
                                value={customStartDate}
                                onChange={setCustomStartDate}
                                placeholder="Chọn ngày bắt đầu"
                            />
                            <DatePicker
                                label="Đến ngày"
                                value={customEndDate}
                                onChange={setCustomEndDate}
                                placeholder="Chọn ngày kết thúc"
                            />
                        </>
                    )}

                    {timeFilter === 'ACADEMIC' && (
                        <>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-muted-foreground">Năm học</label>
                                <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn năm học" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Tất cả năm học</SelectItem>
                                        {academicYears.map(y => (
                                            <SelectItem key={y.yearId} value={y.yearId}>{y.yearName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-muted-foreground">Học kỳ</label>
                                <Select value={selectedSemesterId} onValueChange={setSelectedSemesterId} disabled={selectedYearId === 'ALL'}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn học kỳ" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Tất cả học kỳ</SelectItem>
                                        {semesters.map(s => (
                                            <SelectItem key={s.semesterId} value={s.semesterId}>{s.semesterName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    <div className="md:col-auto">
                        <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground" onClick={resetFilters}>
                            <FilterX className="w-4 h-4 mr-2" /> Xóa lọc
                        </Button>
                    </div>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Bản nháp của tôi"
                    value={draftCount}
                    subtitle="Chưa gửi duyệt"
                    icon={CalendarDays}
                    color="blue"
                    loading={loading}
                    onClick={() => router.push(adminPath.EVENT_MANAGEMENT)}
                />
                <MetricCard
                    title="Chờ duyệt"
                    value={pendingCount}
                    subtitle="Đã gửi, chờ Admin"
                    icon={Send}
                    color="yellow"
                    loading={loading}
                    onClick={() => router.push(adminPath.EVENT_MANAGEMENT)}
                />
                <MetricCard
                    title="Đã được duyệt"
                    value={approvedCount}
                    subtitle="Sự kiện hoạt động"
                    icon={CheckSquare}
                    color="green"
                    loading={loading}
                    onClick={() => router.push(adminPath.EVENT_MANAGEMENT)}
                />
                <MetricCard
                    title="Điểm danh chờ duyệt"
                    value={pendingAttendances.length}
                    subtitle="Cần bạn xác nhận"
                    icon={ClipboardCheck}
                    color="orange"
                    loading={loading}
                    onClick={() => router.push(adminPath.EVENT_MANAGEMENT)}
                />
            </div>

            {/* Sự kiện gần đây của tôi */}
            <div className="rounded-xl shadow-sm border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold">Sự kiện của tôi</h2>
                    <Button size="sm" variant="outline" onClick={() => router.push(adminPath.EVENT_MANAGEMENT)}>
                        Xem tất cả
                    </Button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
                    </div>
                ) : recentEvents.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground mb-3">Chưa có sự kiện nào trong khoảng thời gian này</p>
                        <Button size="sm" onClick={() => router.push(`${adminPath.EVENT_MANAGEMENT}/create`)}>
                            ➕ Tạo sự kiện đầu tiên
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {recentEvents.map((ev) => (
                            <div
                                key={ev.eventId}
                                className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-muted/30 px-2 rounded cursor-pointer"
                                onClick={() => router.push(`/admin/event-management/${ev.eventId}`)}
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{ev.eventName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDate(ev.startDate)} · {ev.score != null ? `${ev.score} điểm` : 'Chưa xác định điểm'}
                                    </p>
                                </div>
                                <StatusBadge status={ev.status} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Điểm danh cần duyệt */}
            {!loading && pendingAttendances.length > 0 && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-950 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-orange-800 dark:text-orange-200">
                            ⚠️ Điểm danh cần xác nhận ({pendingAttendances.length})
                        </h2>
                        <Button size="sm" variant="outline" onClick={() => router.push(adminPath.EVENT_MANAGEMENT)}>
                            Xử lý ngay
                        </Button>
                    </div>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                        Có sinh viên đã check-in vào sự kiện bạn tổ chức và đang chờ bạn duyệt điểm danh.
                    </p>
                </div>
            )}
        </div>
    );
}
