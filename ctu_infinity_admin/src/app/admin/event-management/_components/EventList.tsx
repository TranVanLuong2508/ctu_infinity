'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode } from 'lucide-react';
import {
  IEvent,
  IApproveEventPayload,
  eventMgmtApi,
  EventStatus,
} from '@/services/event-management.service';
import { organizerApi, IOrganizer } from '@/services/organizer.service';
import { CriteriaService } from '@/services/criteria.service';
import { CriteriaFrameworkService } from '@/services/criteria-framework.service';
import { QRCodeModal } from './QRCodeModal';
import { EditEventModal } from './EditEventModal';
import { ICriteria } from '@/types/criteria.type';
import { ConfirmModal } from '@/components/admin/modals/ConfirmModal';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { SimpleTablePagination } from '@/components/table/simple-table-pagination';
import { formatDate } from '@/utils/formateDate';

interface Props {
  events: IEvent[];
  loading: boolean;
  onRefresh: () => void;
  onToast: (ok: boolean, msg: string) => void;
  /** true: hiện nút Duyệt/Từ chối (chỉ ADMIN) */
  showApprove: boolean;
  /** true: hiện nút Đăng ký duyệt cho sự kiện DRAFT */
  showSubmitForApproval: boolean;
  /** true: hiện nút Chỉnh sửa cho sự kiện DRAFT (ORGANIZER) */
  showEdit?: boolean;
  /** true: hiện bộ lọc Tìm kiếm + Ban tổ chức + Trạng thái (chỉ dành cho tab "Tất cả sự kiện" của ADMIN) */
  showFilters?: boolean;
  /** Trạng thái mặc định của tab (DRAFT | PENDING | APPROVED). Nếu truyền, status filter sẽ bị khóa ở giá trị này. */
  defaultStatus?: EventStatus;
  /** Chỉ hiện filter "Ban tổ chức" khi KHÔNG phải ORGANIZER (tức là ADMIN) */
  isOrganizer?: boolean;
  /** Hàm gọi API khi filter thay đổi. Nếu không truyền → fallback client-side filter */
  onFilterChange?: (filters: {
    search?: string;
    status?: EventStatus;
    organizerId?: string;
  }) => void;
  /** Callback để page cha load lại data theo filter mới */
  onLoadWithFilters?: (params: {
    status?: EventStatus;
    organizerId?: string;
  }) => Promise<void>;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: IEvent['status'] }) {
  const map: Record<IEvent['status'], string> = {
    DRAFT:
      'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200',
    PENDING:
      'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200',
    APPROVED:
      'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200',
    REJECTED:
      'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200',
  };
  const labels: Record<IEvent['status'], string> = {
    DRAFT: 'Bản nháp',
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

// ─── Approve Modal ────────────────────────────────────────────────────────────

interface ApproveModalProps {
  event: IEvent;
  onClose: () => void;
  onSuccess: () => void;
  onToast: (ok: boolean, msg: string) => void;
}

function ApproveModal({
  event,
  onClose,
  onSuccess,
  onToast,
}: ApproveModalProps) {
  const [criteriaId, setCriteriaId] = useState('');
  const [score, setScore] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [leafCriterias, setLeafCriterias] = useState<ICriteria[]>([]);
  const [loadingCriterias, setLoadingCriterias] = useState(true);
  const [selectedCriteria, setSelectedCriteria] = useState<ICriteria | null>(
    null,
  );

  // Fetch danh sách tiêu chí lá thuộc framework ACTIVE khi modal mở
  useEffect(() => {
    const fetchLeafCriterias = async () => {
      try {
        // Bước 1: Lấy framework đang ACTIVE
        const activeRes =
          await CriteriaFrameworkService.CallGetActiveFramework();
        const activeFrameworkId = activeRes.data?.frameworkId;

        if (!activeFrameworkId) {
          onToast(false, 'Không tìm thấy khung tiêu chí đang hoạt động');
          setLoadingCriterias(false);
          return;
        }

        // Bước 2: Lấy tree của framework ACTIVE
        // Response: { statusCode, message, EC, EM, data: { tree: [...] } }
        // Interceptor unwrap chỉ loại bỏ wrapper axios, nên data = { tree: [...] }
        const treeRes =
          await CriteriaService.CallFetchCriteriaTree(activeFrameworkId);
        const treeData = treeRes.data?.tree;

        if (!treeData || !Array.isArray(treeData) || treeData.length === 0) {
          onToast(false, 'Khung tiêu chí đang hoạt động chưa có tiêu chí nào');
          setLoadingCriterias(false);
          return;
        }

        // Bước 3: Trích xuất tất cả tiêu chí lá từ tree (isLeaf: true, bao gồm cả node vừa gốc vừa lá)
        const extractLeaves = (nodes: ICriteria[]): ICriteria[] => {
          const leaves: ICriteria[] = [];
          for (const node of nodes) {
            if (node.isLeaf) {
              leaves.push(node);
            }
            if (node.children && node.children.length > 0) {
              leaves.push(...extractLeaves(node.children));
            }
          }
          return leaves;
        };

        const leaves = extractLeaves(treeData);
        setLeafCriterias(leaves);
      } catch (error) {
        console.error('Error fetching criterias:', error);
        onToast(false, 'Không thể tải danh sách tiêu chí');
      } finally {
        setLoadingCriterias(false);
      }
    };
    fetchLeafCriterias();
  }, [onToast]);

  // Cập nhật selected criteria và điền maxScore khi chọn
  const handleCriteriaChange = (value: string) => {
    setCriteriaId(value);
    const selected = leafCriterias.find((c) => c.criteriaId === value);
    setSelectedCriteria(selected || null);
    // Tự động điền maxScore nếu có
    if (selected?.maxScore !== null && selected?.maxScore !== undefined) {
      setScore(selected.maxScore.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!criteriaId.trim() || !score) {
      onToast(false, 'Vui lòng chọn tiêu chí và nhập số điểm');
      return;
    }

    const parsedScore = Number(score);
    if (
      !Number.isFinite(parsedScore) ||
      !Number.isInteger(parsedScore) ||
      parsedScore < 0
    ) {
      onToast(false, 'Điểm sự kiện phải là số nguyên không âm');
      return;
    }

    // Validate score không vượt quá maxScore
    if (
      selectedCriteria?.maxScore !== null &&
      selectedCriteria?.maxScore !== undefined &&
      parsedScore > selectedCriteria.maxScore
    ) {
      onToast(
        false,
        `Số điểm không được vượt quá ${selectedCriteria.maxScore}`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload: IApproveEventPayload = {
        criteriaId,
        score: parsedScore,
      };
      await eventMgmtApi.approve(event.eventId, payload);
      onToast(true, `Đã duyệt sự kiện "${event.eventName}" thành công`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string; EM?: string } };
      };
      const msg =
        error?.response?.data?.message ??
        error?.response?.data?.EM ??
        'Duyệt thất bại';
      onToast(false, msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <h2 className="text-lg font-bold mb-1">Duyệt sự kiện</h2>
        <p className="text-sm text-muted-foreground mb-4 truncate">
          {event.eventName}
        </p>

        {loadingCriterias ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            Đang tải danh sách tiêu chí...
          </div>
        ) : leafCriterias.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm mb-4">
              Không tìm thấy tiêu chí lá nào
            </p>
            <Button onClick={onClose} variant="outline">
              Đóng
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Criteria Selection */}
            <div className="space-y-2">
              <Label htmlFor="criteria">
                Chọn tiêu chí <span className="text-red-500">*</span>
              </Label>
              <Select value={criteriaId} onValueChange={handleCriteriaChange}>
                <SelectTrigger id="criteria">
                  <SelectValue placeholder="Chọn tiêu chí để cộng điểm..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {leafCriterias.map((criteria) => (
                    <SelectItem
                      key={criteria.criteriaId}
                      value={criteria.criteriaId}
                    >
                      <div className="flex flex-col py-1">
                        <div className="font-medium">
                          {criteria.criteriaCode} - {criteria.criteriaName}
                        </div>
                        {criteria.maxScore !== null &&
                          criteria.maxScore !== undefined && (
                            <div className="text-xs text-muted-foreground">
                              Điểm tối đa: {criteria.maxScore}
                            </div>
                          )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Chỉ hiển thị các tiêu chí lá thuộc khung tiêu chí đang hoạt động
              </p>
            </div>

            {/* Selected Criteria Info */}
            {selectedCriteria && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Thông tin tiêu chí đã chọn:
                </div>
                <div className="text-sm font-semibold">
                  {selectedCriteria.criteriaCode} -{' '}
                  {selectedCriteria.criteriaName}
                </div>
                {selectedCriteria.description && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {selectedCriteria.description}
                  </div>
                )}
                {selectedCriteria?.maxScore !== null &&
                  selectedCriteria?.maxScore !== undefined && (
                    <div className="text-xs font-medium text-primary mt-2">
                      Điểm tối đa: {selectedCriteria.maxScore}
                    </div>
                  )}
              </div>
            )}

            {/* Score */}
            <div className="space-y-2">
              <Label htmlFor="score">
                Số điểm sự kiện <span className="text-red-500">*</span>
              </Label>
              <Input
                id="score"
                type="number"
                placeholder="0"
                min={0}
                max={selectedCriteria?.maxScore ?? undefined}
                step={1}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                required
              />
              {selectedCriteria?.maxScore !== null &&
                selectedCriteria?.maxScore !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    Không được vượt quá {selectedCriteria.maxScore} điểm
                  </p>
                )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                Hủy
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? 'Đang duyệt...' : 'Xác nhận duyệt'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function EventList({
  events,
  loading,
  onRefresh,
  onToast,
  showApprove,
  showSubmitForApproval,
  showEdit = false,
  showFilters = false,
  defaultStatus,
  isOrganizer = false,
  onFilterChange,
  onLoadWithFilters,
}: Props) {
  const router = useRouter();
  const [approveTarget, setApproveTarget] = useState<IEvent | null>(null);
  const [editTarget, setEditTarget] = useState<IEvent | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [qrModalEvent, setQrModalEvent] = useState<IEvent | null>(null);
  const [confirmSubmitEvent, setConfirmSubmitEvent] = useState<IEvent | null>(
    null,
  );
  const [confirmRejectEvent, setConfirmRejectEvent] = useState<IEvent | null>(
    null,
  );

  // ── Filter state ────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  // Nếu có defaultStatus → status bị khóa ở giá trị đó, không cho chọn
  const [filterStatus, setFilterStatus] = useState<EventStatus | '__all__'>(
    defaultStatus ?? '__all__',
  );
  const [filterOrganizer, setFilterOrganizer] = useState<string>('__all__');
  const [organizers, setOrganizers] = useState<IOrganizer[]>([]);
  const [loadingOrganizers, setLoadingOrganizers] = useState(false);

  // Load organizer list khi cần filter (chỉ ADMIN — không phải ORGANIZER)
  useEffect(() => {
    if (isOrganizer) return;
    if (!showFilters && !defaultStatus) return;
    setLoadingOrganizers(true);
    organizerApi
      .getAll()
      .then((res) => {
        setOrganizers(res.data?.organizers ?? []);
      })
      .catch(() => {
        /* silent */
      })
      .finally(() => setLoadingOrganizers(false));
  }, [showFilters, defaultStatus, isOrganizer]);

  // Gọi onLoadWithFilters khi filter thay đổi (server-side)
  const handleFilterChange = () => {
    const resolvedStatus =
      defaultStatus ?? (filterStatus === '__all__' ? undefined : filterStatus);
    if (onLoadWithFilters) {
      onLoadWithFilters({
        status: resolvedStatus,
        organizerId:
          filterOrganizer === '__all__' ? undefined : filterOrganizer,
      });
    } else if (onFilterChange) {
      onFilterChange({
        search,
        status: resolvedStatus,
        organizerId:
          filterOrganizer === '__all__' ? undefined : filterOrganizer,
      });
    }
  };

  // Debounce search
  const [searchDebounced, setSearchDebounced] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
      handleFilterChange();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterStatus, filterOrganizer, defaultStatus]);

  // Client-side filter (khi không có onLoadWithFilters)
  const filtered = useMemo(() => {
    const q = searchDebounced.toLowerCase();
    return events.filter((e) => {
      const matchSearch =
        !q ||
        e.eventName.toLowerCase().includes(q) ||
        (e.location ?? '').toLowerCase().includes(q);
      const matchStatus =
        filterStatus === '__all__' || e.status === filterStatus;
      const matchOrganizer =
        filterOrganizer === '__all__' ||
        e.organizer?.organizerId === filterOrganizer;
      return matchSearch && matchStatus && matchOrganizer;
    });
  }, [events, searchDebounced, filterStatus, filterOrganizer]);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const colSpan =
    6 + (showEdit ? 1 : 0) + (showApprove || showSubmitForApproval ? 1 : 0);

  const handleSubmitForApproval = async () => {
    const event = confirmSubmitEvent;
    if (!event) return;
    setSubmittingId(event.eventId);
    try {
      await eventMgmtApi.submitForApproval(event.eventId);
      onToast(true, 'Đã đăng ký duyệt sự kiện thành công');
      onRefresh();
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string; EM?: string } };
      };
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.EM ??
        'Đăng ký duyệt thất bại';
      onToast(false, msg);
    } finally {
      setSubmittingId(null);
      setConfirmSubmitEvent(null);
    }
  };

  const handleReject = async () => {
    const event = confirmRejectEvent;
    if (!event) return;
    setRejectingId(event.eventId);
    try {
      await eventMgmtApi.reject(event.eventId);
      onToast(true, 'Đã từ chối sự kiện');
      onRefresh();
    } catch {
      onToast(false, 'Từ chối thất bại');
    } finally {
      setRejectingId(null);
      setConfirmRejectEvent(null);
    }
  };

  return (
    <>
      {/* Approve modal */}
      {approveTarget && (
        <ApproveModal
          event={approveTarget}
          onClose={() => setApproveTarget(null)}
          onSuccess={onRefresh}
          onToast={onToast}
        />
      )}

      {/* Edit modal (ORGANIZER - DRAFT events) */}
      {editTarget && (
        <EditEventModal
          event={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={onRefresh}
          onToast={onToast}
        />
      )}

      <div className="w-full space-y-4">
        {/* Toolbar */}
        <div className="flex items-center py-4 gap-3 flex-wrap">
          <Input
            placeholder="Tìm theo tên sự kiện, địa điểm..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-sm"
          />

          {showFilters && (
            <>
              {/* Filter: Ban tổ chức */}
              {!isOrganizer && (
                <div className="flex items-center gap-1.5">
                  <Label
                    htmlFor="filter-organizer"
                    className="text-sm text-muted-foreground whitespace-nowrap"
                  >
                    Ban tổ chức:
                  </Label>
                  <Select
                    value={
                      filterOrganizer === '__all__'
                        ? '__all__'
                        : filterOrganizer
                    }
                    onValueChange={(val) => {
                      setFilterOrganizer(val);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger id="filter-organizer" className="w-[180px]">
                      <SelectValue placeholder="Tất cả ban" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Tất cả ban</SelectItem>
                      {loadingOrganizers ? (
                        <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin" /> Đang
                          tải...
                        </div>
                      ) : (
                        organizers.map((o) => (
                          <SelectItem key={o.organizerId} value={o.organizerId}>
                            {o.organizerName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Filter: Trạng thái */}
              <div className="flex items-center gap-1.5">
                <Label
                  htmlFor="filter-status"
                  className="text-sm text-muted-foreground whitespace-nowrap"
                >
                  Trạng thái:
                </Label>
                <Select
                  value={filterStatus === '__all__' ? '__all__' : filterStatus}
                  onValueChange={(val) => {
                    setFilterStatus(val as EventStatus | '__all__');
                    setPage(1);
                  }}
                >
                  <SelectTrigger id="filter-status" className="w-[160px]">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tất cả</SelectItem>
                    <SelectItem value="DRAFT">Bản nháp</SelectItem>
                    <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                    <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                    <SelectItem value="REJECTED">Từ chối</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Organizer filter cho tab Bản nháp / Chờ duyệt — chỉ ADMIN */}
          {!showFilters && defaultStatus && !isOrganizer && (
            <div className="flex items-center gap-1.5">
              <Label
                htmlFor="filter-organizer"
                className="text-sm text-muted-foreground whitespace-nowrap"
              >
                Ban tổ chức:
              </Label>
              <Select
                value={
                  filterOrganizer === '__all__' ? '__all__' : filterOrganizer
                }
                onValueChange={(val) => {
                  setFilterOrganizer(val);
                  setPage(1);
                }}
              >
                <SelectTrigger id="filter-organizer" className="w-[180px]">
                  <SelectValue placeholder="Tất cả ban" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tất cả ban</SelectItem>
                  {loadingOrganizers ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" /> Đang tải...
                    </div>
                  ) : (
                    organizers.map((o) => (
                      <SelectItem key={o.organizerId} value={o.organizerId}>
                        {o.organizerName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên sự kiện</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Địa điểm</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Điểm</TableHead>
                <TableHead>Chi tiết</TableHead>
                {showEdit && <TableHead>Chỉnh sửa</TableHead>}
                {(showApprove || showSubmitForApproval) && (
                  <TableHead>Thao tác</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Đang tải...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={colSpan}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không có sự kiện nào
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((ev) => (
                  <TableRow key={ev.eventId}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {ev.eventName}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatDate(ev.startDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ev.location ?? '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ev.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ev.score != null ? ev.score : '—'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() =>
                          router.push(`/admin/event-management/${ev.eventId}`)
                        }
                      >
                        Xem chi tiết
                      </Button>
                    </TableCell>
                    {showEdit && (
                      <TableCell>
                        {ev.status === 'DRAFT' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => setEditTarget(ev)}
                          >
                            Sửa
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                    )}
                    {showSubmitForApproval && (
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => setConfirmSubmitEvent(ev)}
                          disabled={submittingId === ev.eventId}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                        >
                          {submittingId === ev.eventId
                            ? 'Đang gửi...'
                            : 'Đăng ký duyệt'}
                        </Button>
                      </TableCell>
                    )}
                    {showApprove && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => setApproveTarget(ev)}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs"
                          >
                            Duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                            disabled={rejectingId === ev.eventId}
                            onClick={() => setConfirmRejectEvent(ev)}
                          >
                            {rejectingId === ev.eventId ? '...' : 'Từ chối'}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                    {ev.status === 'APPROVED' && (
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => setQrModalEvent(ev)}
                        >
                          <QrCode className="w-4 h-4 mr-1" />
                          Mã QR
                        </Button>
                      </TableCell>
                    )}
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
          totalCount={filtered.length}
        />
      </div>

      {/* QR Code Modal */}
      {qrModalEvent && (
        <QRCodeModal
          eventId={qrModalEvent.eventId}
          eventName={qrModalEvent.eventName}
          isOpen={!!qrModalEvent}
          onClose={() => setQrModalEvent(null)}
        />
      )}

      <ConfirmModal
        open={!!confirmSubmitEvent}
        onClose={() => setConfirmSubmitEvent(null)}
        onConfirm={handleSubmitForApproval}
        title="Xác nhận đăng ký duyệt"
        description={
          <>
            Bạn có chắc chắn muốn đăng ký duyệt sự kiện{' '}
            <b>{confirmSubmitEvent?.eventName}</b> không?
          </>
        }
        confirmText="Đăng ký duyệt"
      />

      <ConfirmModal
        open={!!confirmRejectEvent}
        onClose={() => setConfirmRejectEvent(null)}
        onConfirm={handleReject}
        title="Xác nhận từ chối sự kiện"
        description={
          <>
            Bạn có chắc chắn muốn từ chối sự kiện{' '}
            <b>{confirmRejectEvent?.eventName}</b> không?
          </>
        }
        isDanger={true}
        confirmText="Từ chối"
      />
    </>
  );
}
