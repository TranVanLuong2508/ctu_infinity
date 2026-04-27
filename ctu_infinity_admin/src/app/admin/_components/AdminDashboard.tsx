'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { eventMgmtApi, attendanceApi, IEvent, IEventAttendance } from '@/services/event-management.service';
import { studentManagementApi } from '@/services/student-management.service';
import { academicYearApi, semestersApi, IAcademicYear, ISemester } from '@/services/academic-schedule.service';
import { organizerApi, IOrganizer } from '@/services/organizer.service';
import { adminPath } from '@/constants/path';
import { Loader2, CalendarDays, Users, ClipboardCheck, CheckSquare, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { formatDate, formatDateTime } from '@/utils/formateDate';

// ─── Metric Card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: React.ComponentType<{ className?: string }>;
    color: 'blue' | 'yellow' | 'green' | 'purple';
    onClick?: () => void;
    loading?: boolean;
}

const COLOR_MAP = {
    blue: 'bg-blue-50 border-blue-200 dark:bg-blue-950',
    yellow: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950',
    green: 'bg-green-50 border-green-200 dark:bg-green-950',
    purple: 'bg-purple-50 border-purple-200 dark:bg-purple-950',
};

const ICON_COLOR_MAP = {
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminDashboard() {
    const router = useRouter();
    const [allEvents, setAllEvents] = useState<IEvent[]>([]);
    const [allAttendances, setAllAttendances] = useState<IEventAttendance[]>([]);
    const [totalStudents, setTotalStudents] = useState<number>(0);
    const [loadingMetrics, setLoadingMetrics] = useState(true);

    // Filter states
    const [timeFilter, setTimeFilter] = useState('ALL'); // ALL, TODAY, WEEK, MONTH, CUSTOM, ACADEMIC
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // Academic Calendar states
    const [academicYears, setAcademicYears] = useState<IAcademicYear[]>([]);
    const [semesters, setSemesters] = useState<ISemester[]>([]);
    const [selectedYearId, setSelectedYearId] = useState<string>('ALL');
    const [selectedSemesterId, setSelectedSemesterId] = useState<string>('ALL');

    // Organizer filter state
    const [organizers, setOrganizers] = useState<IOrganizer[]>([]);
    const [selectedOrganizerId, setSelectedOrganizerId] = useState<string>('ALL');

    useEffect(() => {
        const fetchAll = async () => {
            setLoadingMetrics(true);
            try {
                const [eventsRes, attendancesRes, studentsRes, yearsRes, orgsRes] = await Promise.allSettled([
                    eventMgmtApi.getAll(), // load all system events
                    attendanceApi.getAll(),
                    studentManagementApi.getAll(1, 1),
                    academicYearApi.getAll(),
                    organizerApi.getAll()
                ]);

                if (eventsRes.status === 'fulfilled') {
                    setAllEvents(eventsRes.value.data?.events ?? []);
                }
                if (attendancesRes.status === 'fulfilled') {
                    setAllAttendances(attendancesRes.value.data?.attendances ?? []);
                }
                if (studentsRes.status === 'fulfilled') {
                    setTotalStudents(studentsRes.value.data?.total ?? 0);
                }
                if (yearsRes.status === 'fulfilled') {
                    setAcademicYears(yearsRes.value.data?.academicYears ?? []);
                }
                if (orgsRes.status === 'fulfilled') {
                    setOrganizers(orgsRes.value.data?.organizers ?? []);
                }
            } finally {
                setLoadingMetrics(false);
            }
        };
        fetchAll();
    }, []);

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
        return allEvents.filter(ev => {
            const orgId = ev.organizerId || ev.organizer?.organizerId;
            if (selectedOrganizerId !== 'ALL' && orgId !== selectedOrganizerId) {
                return false;
            }

            const evStart = new Date(ev.startDate);
            const now = new Date();

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
    }, [allEvents, timeFilter, customStartDate, customEndDate, selectedYearId, selectedSemesterId, academicYears, semesters, selectedOrganizerId]);


    // Calculated Metrics
    const totalFilteredEvents = filteredEvents.length;
    const pendingEvents = filteredEvents.filter((e) => e.status === 'PENDING');
    
    // Attendances related to filtered events
    const filteredEventIds = new Set(filteredEvents.map(e => e.eventId));
    const pendingAttendances = allAttendances.filter(
        (a) => a.status === 'PENDING' && filteredEventIds.has(a.eventId)
    );

    const recentPending = [...pendingEvents]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
        
    const recentAttendances = [...pendingAttendances]
        .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())
        .slice(0, 5);

    const resetFilters = () => {
        setTimeFilter('ALL');
        setCustomStartDate('');
        setCustomEndDate('');
        setSelectedYearId('ALL');
        setSelectedSemesterId('ALL');
        setSelectedOrganizerId('ALL');
    };

    return (
        <div className="space-y-8">
            {/* Filters */}
            <div className="bg-card rounded-xl shadow-sm border border-border/50 p-5">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5 items-end">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">Ban tổ chức</label>
                        <Select value={selectedOrganizerId} onValueChange={setSelectedOrganizerId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn BTC" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tất cả ban tổ chức</SelectItem>
                                {organizers.map(org => (
                                    <SelectItem key={org.organizerId} value={org.organizerId}>{org.organizerName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                
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
                    title="Sự kiện chờ duyệt"
                    value={pendingEvents.length}
                    subtitle="Cần phê duyệt"
                    icon={CalendarDays}
                    color="yellow"
                    loading={loadingMetrics}
                    onClick={() => router.push(adminPath.EVENT_MANAGEMENT)}
                />
                <MetricCard
                    title="Điểm danh chờ duyệt"
                    value={pendingAttendances.length}
                    subtitle="requiresApproval = true"
                    icon={ClipboardCheck}
                    color="blue"
                    loading={loadingMetrics}
                    onClick={() => router.push(adminPath.EVENT_MANAGEMENT)}
                />
                <MetricCard
                    title="Tổng sinh viên"
                    value={totalStudents}
                    subtitle="Đang hoạt động trên hệ thống"
                    icon={Users}
                    color="green"
                    loading={loadingMetrics}
                    onClick={() => router.push('/admin/students')}
                />
                <MetricCard
                    title="Tổng sự kiện"
                    value={totalFilteredEvents}
                    subtitle="Tất cả trạng thái"
                    icon={CheckSquare}
                    color="purple"
                    loading={loadingMetrics}
                    onClick={() => router.push(adminPath.EVENT_MANAGEMENT)}
                />
            </div>

            {/* Sự kiện chờ duyệt gần đây */}
            <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold">Sự kiện chờ duyệt gần đây</h2>
                    <Button size="sm" variant="outline" onClick={() => router.push(adminPath.EVENT_MANAGEMENT)}>
                        Xem tất cả
                    </Button>
                </div>
                {loadingMetrics ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
                    </div>
                ) : recentPending.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Không có sự kiện nào chờ duyệt trong các trường hợp đã lọc</p>
                ) : (
                    <div className="space-y-2">
                        {recentPending.map((ev) => (
                            <div
                                key={ev.eventId}
                                className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-muted/30 px-2 rounded cursor-pointer"
                                onClick={() => router.push(`/admin/event-management/${ev.eventId}`)}
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{ev.eventName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDate(ev.startDate)} · {ev.organizer?.organizerName ?? '—'}
                                    </p>
                                </div>
                                <StatusBadge status={ev.status} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Điểm danh chờ duyệt */}
            {recentAttendances.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold">Điểm danh chờ duyệt gần đây</h2>
                        <Button size="sm" variant="outline" onClick={() => router.push(adminPath.EVENT_MANAGEMENT)}>
                            Xem tất cả
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {recentAttendances.map((att) => (
                            <div
                                key={att.id}
                                className="flex items-center justify-between py-2 border-b border-border last:border-0 px-2"
                            >
                                <div>
                                    <p className="text-sm font-medium font-mono">{att.studentId.slice(0, 12)}...</p>
                                    <p className="text-xs text-muted-foreground">
                                        {att.event?.eventName ?? att.eventId.slice(0, 8)} · {formatDateTime(att.checkInTime)}
                                    </p>
                                </div>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-yellow-100 text-yellow-700 border-yellow-300">
                                    Chờ duyệt
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
