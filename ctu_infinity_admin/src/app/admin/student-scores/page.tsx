'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ChevronDown, ChevronRight, Search } from 'lucide-react';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import privateAxios from '@/lib/axios/privateAxios';
import { academicYearApi, semestersApi } from '@/services/academic-schedule.service';
import { AcademicService } from '@/services/academic.service';
import { studentManagementApi, IStudentItem } from '@/services/student-management.service';
import { scoreApi } from '@/services/event-management.service';
import { calculateDrlRanking } from '@/lib/drl-ranking';
import { ICriteria } from '@/types/criteria.type';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ISemester {
  semesterId: string;
  semesterName: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  yearId: string;
}

interface IAcademicYear {
  yearId: string;
  yearName: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

interface IClass {
  classId: string;
  className: string;
  major?: {
    majorId: string;
    majorName: string;
    falculty?: {
      falcultyId: string;
      falcultyName: string;
    };
  };
}

// ── DRL Tree Row ──────────────────────────────────────────────────────────────

interface IDrlCriterionRow {
  id: string;
  criteriaCode: string;
  criteriaName: string;
  level: number;
  displayOrder: number;
  maxPoints: number;
  approvedPoints: number;
  pendingPoints: number;
  isLeaf: boolean;
  children: IDrlCriterionRow[];
}

interface IStudentDRLState {
  student: IStudentItem;
  tree: IDrlCriterionRow[];
  categoryProgress: { criteriaId: string; criteriaCode: string; criteriaName: string; currentPoints: number; maxPoints: number; percentage: number }[];
  totalApproved: number;
  totalPending: number;
  rankingLabel: string;
  rankingColor: string;
  expanded: boolean;
  loading: boolean;
  loaded: boolean;
  error: boolean;
}

// ── Build DRL tree từ criteria tree + scores ─────────────────────────────────

interface TotalsRecord {
  [criteriaId: string]: number;
}

function buildDrlTree(
  nodes: ICriteria[],
  approvedTotals: TotalsRecord,
): IDrlCriterionRow[] {
  return nodes
    .map((node) => buildNode(node, approvedTotals, 0))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

function buildNode(
  node: ICriteria,
  approvedTotals: TotalsRecord,
  level: number,
): IDrlCriterionRow {
  const children: IDrlCriterionRow[] = (node.children ?? [])
    .map((c) => buildNode(c, approvedTotals, level + 1))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const isLeaf = children.length === 0;

  let maxP = node.maxScore != null ? Number(node.maxScore) : 0;
  if (!isLeaf && (maxP === 0 || isNaN(maxP))) {
    maxP = children.reduce((acc, c) => acc + c.maxPoints, 0);
  }

  let approvedP = 0;
  if (isLeaf) {
    approvedP = approvedTotals[node.criteriaId] ?? 0;
  } else {
    approvedP = children.reduce(
      (acc, c) => acc + Math.min(c.approvedPoints, c.maxPoints || 100),
      0,
    );
  }

  if (maxP > 0) {
    approvedP = Math.min(approvedP, maxP);
  }

  return {
    id: node.criteriaId,
    criteriaCode: node.criteriaCode,
    criteriaName: node.criteriaName,
    level,
    displayOrder: node.displayOrder,
    maxPoints: maxP,
    approvedPoints: approvedP,
    pendingPoints: 0,
    isLeaf,
    children,
  };
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function StudentScoresPage() {
  // ── Meta filter state ─────────────────────────────────────────────────────
  const [academicYears, setAcademicYears] = useState<IAcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('__all__');
  const [semesters, setSemesters] = useState<ISemester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('__all__');
  const [faculties, setFaculties] = useState<{ falcultyId: string; falcultyName: string }[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('__all__');
  const [classes, setClasses] = useState<IClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('__all__');
  const [studentSearch, setStudentSearch] = useState('');

  // ── Data state ────────────────────────────────────────────────────────────
  const [allStudents, setAllStudents] = useState<IStudentItem[]>([]);
  const [criteriaTree, setCriteriaTree] = useState<ICriteria[]>([]);
  const [studentDRL, setStudentDRL] = useState<IStudentDRLState[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [searched, setSearched] = useState(false);

  // ── Load năm học + học kỳ + khoa + criteria tree khi mount ─────────────
  useEffect(() => {
    setLoadingMeta(true);
    Promise.all([
      academicYearApi.getAll(),
      semestersApi.getAll(),
      AcademicService.CallGetAllFaculties(),
      privateAxios.get(`/criterias/tree`, { params: { status: 'ACTIVE' } }),
    ])
      .then(([yearRes, semRes, facRes, treeRes]) => {
        setAcademicYears(yearRes.data?.academicYears ?? []);
        setSemesters(semRes.data?.semesters ?? []);
        setFaculties(
          facRes.data?.falculties?.map((f: { falcultyId: string; falcultyName: string }) => ({
            falcultyId: f.falcultyId,
            falcultyName: f.falcultyName,
          })) ?? [],
        );
        setCriteriaTree(treeRes.data?.tree ?? []);

        const currentYear = yearRes.data?.academicYears?.find((y: IAcademicYear) => y.isCurrent);
        if (currentYear) setSelectedYearId(currentYear.yearId);
        const currentSem = semRes.data?.semesters?.find((s: ISemester) => s.isCurrent);
        if (currentSem) setSelectedSemesterId(currentSem.semesterId);
      })
      .catch(() => toast.error('Không thể tải danh mục'))
      .finally(() => setLoadingMeta(false));
  }, []);

  // ── Load lớp khi đổi khoa ────────────────────────────────────────────────
  useEffect(() => {
    if (selectedFacultyId === '__all__') {
      setClasses([]);
      setSelectedClassId('__all__');
      return;
    }
    AcademicService.CallGetAllClasses(1, 200)
      .then((res) => {
        const all: IClass[] = res.data?.classes ?? [];
        setClasses(all.filter((c) => c.major?.falculty?.falcultyId === selectedFacultyId));
        setSelectedClassId('__all__');
      })
      .catch(() => { /* silent */ });
  }, [selectedFacultyId]);

  // ── Search sinh viên ──────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    setLoadingStudents(true);
    setSearched(true);
    setStudentDRL([]);
    try {
      const res = await studentManagementApi.getAll(1, 200);
      let students: IStudentItem[] = res.data?.students ?? [];

      if (selectedClassId !== '__all__') {
        students = students.filter((s) => s.classId === selectedClassId);
      }

      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase();
        students = students.filter(
          (s) =>
            s.user?.fullName?.toLowerCase().includes(q) ||
            s.studentCode?.toLowerCase().includes(q),
        );
      }

      setAllStudents(students);
    } catch {
      toast.error('Không thể tải danh sách sinh viên');
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedClassId, studentSearch]);

  // ── Toggle expand + lazy-load DRL ─────────────────────────────────────────
  const toggleExpand = useCallback(async (studentId: string) => {
    setStudentDRL((prev) => {
      const existing = prev.find((r) => r.student.studentId === studentId);
      if (existing) {
        return prev.map((r) =>
          r.student.studentId === studentId ? { ...r, expanded: !r.expanded } : r,
        );
      }
      const student = allStudents.find((s) => s.studentId === studentId);
      if (!student) return prev;
      return [
        ...prev,
        {
          student,
          tree: [],
          categoryProgress: [],
          totalApproved: 0,
          totalPending: 0,
          rankingLabel: 'Chưa cập nhật',
          rankingColor: 'bg-gray-400',
          expanded: true,
          loading: true,
          loaded: false,
          error: false,
        },
      ];
    });

    // Nếu đã load rồi → không fetch lại
    if (studentDRL.find((r) => r.student.studentId === studentId && r.loaded)) {
      return;
    }

    try {
      const res = await scoreApi.getByStudent(
        studentId,
        selectedSemesterId !== '__all__' ? selectedSemesterId : undefined,
      );
      const totals: TotalsRecord = res.data?.totalsByCriteriaId ?? {};
      const ranking = calculateDrlRanking(0);

      // Build tree từ criteria tree + scores
      const tree = buildDrlTree(criteriaTree, totals);

      // Category progress (level 0 nodes)
      const categoryProgress = tree.map((c) => ({
        criteriaId: c.id,
        criteriaCode: c.criteriaCode,
        criteriaName: c.criteriaName,
        currentPoints: c.approvedPoints,
        maxPoints: c.maxPoints || 100,
        percentage: c.maxPoints > 0 ? (c.approvedPoints / c.maxPoints) * 100 : 0,
      }));

      // Total
      const grandApproved = tree.reduce((acc, c) => acc + c.approvedPoints, 0);
      const grandPending = tree.reduce((acc, c) => acc + c.pendingPoints, 0);
      const capped = Math.min(grandApproved, 100);
      const finalRanking = calculateDrlRanking(capped);

      setStudentDRL((prev) =>
        prev.map((r) =>
          r.student.studentId === studentId
            ? {
                ...r,
                tree,
                categoryProgress,
                totalApproved: capped,
                totalPending: grandPending,
                rankingLabel: finalRanking.label,
                rankingColor: finalRanking.color,
                loading: false,
                loaded: true,
                error: false,
              }
            : r,
        ),
      );
    } catch {
      setStudentDRL((prev) =>
        prev.map((r) =>
          r.student.studentId === studentId
            ? { ...r, loading: false, error: true }
            : r,
        ),
      );
      toast.error('Không thể tải điểm rèn luyện');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allStudents, criteriaTree, selectedSemesterId]);

  // ── Render criterion row (recursive) ───────────────────────────────────────
  const renderCriterion = (criterion: IDrlCriterionRow, rootIndex: number = 0): React.ReactElement[] => {
    const paddingLeft = criterion.level * 20;
    const items: React.ReactElement[] = [];

    items.push(
      <tr
        key={criterion.id}
        className={`border-b ${criterion.level === 0 ? 'bg-muted/40' : ''} hover:bg-muted/30`}
      >
        <td className="p-3 text-center text-xs font-medium w-10">
          {criterion.level === 0 ? rootIndex + 1 : ''}
        </td>
        <td className="p-3 text-center text-xs">
          {criterion.level <= 3 ? criterion.criteriaCode : ''}
        </td>
        <td className="p-3" style={{ paddingLeft: `${paddingLeft + 16}px` }}>
          {criterion.level !== 0 && !criterion.isLeaf && (
            <span className="font-semibold text-primary mr-1">
              {criterion.criteriaCode}.{' '}
            </span>
          )}
          {criterion.level === 0 && `${criterion.criteriaCode}. `}
          {criterion.level !== 0 && criterion.isLeaf && (
            <span className="text-muted-foreground mr-1">— </span>
          )}
          <span
            className={
              criterion.level === 0
                ? 'font-semibold'
                : criterion.isLeaf
                  ? 'text-muted-foreground text-sm'
                  : 'font-medium'
            }
          >
            {criterion.criteriaName}
          </span>
        </td>
        <td className="p-3 text-center text-sm font-bold text-muted-foreground">
          {criterion.maxPoints > 0 ? criterion.maxPoints : '-'}
        </td>
        <td className="p-3 text-center">
          <Badge
            variant={
              criterion.approvedPoints >= (criterion.maxPoints || 0) &&
              criterion.maxPoints > 0
                ? 'default'
                : 'secondary'
            }
          >
            {criterion.approvedPoints}
          </Badge>
        </td>
      </tr>,
    );

    if (criterion.children) {
      criterion.children.forEach((child) => {
        items.push(...renderCriterion(child, rootIndex));
      });
    }

    return items;
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full w-full">
      <AdminHeader />
      <main className="flex-1 overflow-auto p-6 space-y-6">
        {/* ── Bộ lọc ── */}
        <div className="flex flex-wrap gap-3 items-end rounded-xl border border-border bg-card p-4">
          <div className="space-y-1 min-w-[160px]">
            <Label className="text-xs text-muted-foreground">Năm học</Label>
            {loadingMeta ? (
              <div className="h-9 flex items-center text-sm text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin mr-2" /> Đang tải...
              </div>
            ) : (
              <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Chọn năm học" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tất cả năm học</SelectItem>
                  {academicYears.map((y) => (
                    <SelectItem key={y.yearId} value={y.yearId}>
                      {y.yearName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1 min-w-[140px]">
            <Label className="text-xs text-muted-foreground">Học kỳ</Label>
            {loadingMeta ? (
              <div className="h-9 flex items-center text-sm text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin mr-2" /> Đang tải...
              </div>
            ) : (
              <Select value={selectedSemesterId} onValueChange={setSelectedSemesterId}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Chọn học kỳ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tất cả học kỳ</SelectItem>
                  {semesters.map((s) => (
                    <SelectItem key={s.semesterId} value={s.semesterId}>
                      {s.semesterName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1 min-w-[160px]">
            <Label className="text-xs text-muted-foreground">Khoa</Label>
            {loadingMeta ? (
              <div className="h-9 flex items-center text-sm text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin mr-2" /> Đang tải...
              </div>
            ) : (
              <Select value={selectedFacultyId} onValueChange={setSelectedFacultyId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Chọn khoa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tất cả khoa</SelectItem>
                  {faculties.map((f) => (
                    <SelectItem key={f.falcultyId} value={f.falcultyId}>
                      {f.falcultyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1 min-w-[160px]">
            <Label className="text-xs text-muted-foreground">Lớp</Label>
            <Select
              value={selectedClassId}
              onValueChange={setSelectedClassId}
              disabled={selectedFacultyId === '__all__' || loadingMeta}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Chọn lớp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tất cả lớp</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.classId} value={c.classId}>
                    {c.className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 flex-1 min-w-[200px]">
            <Label className="text-xs text-muted-foreground">Sinh viên</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Tìm theo tên hoặc MSSV..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loadingStudents}>
                {loadingStudents ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Empty state ── */}
        {!searched && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Search className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">Nhấn tìm kiếm để xem danh sách sinh viên</p>
          </div>
        )}

        {searched && !loadingStudents && allStudents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-4xl mb-3">👤</p>
            <p className="text-sm">Không tìm thấy sinh viên nào</p>
          </div>
        )}

        {/* ── Bảng sinh viên + expand DRL ── */}
        {allStudents.length > 0 && (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="w-8 px-3 py-3"></th>
                  <th className="text-left px-4 py-3 font-medium">MSSV</th>
                  <th className="text-left px-4 py-3 font-medium">Họ tên</th>
                  <th className="text-left px-4 py-3 font-medium">Lớp</th>
                  <th className="text-left px-4 py-3 font-medium">Khoa</th>
                  <th className="text-right px-4 py-3 font-medium">Tổng điểm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allStudents.map((student) => {
                  const drl = studentDRL.find(
                    (r) => r.student.studentId === student.studentId,
                  );
                  const isExpanded = drl?.expanded ?? false;

                  return (
                    <React.Fragment key={student.studentId}>
                      {/* Row chính */}
                      <tr
                        className="hover:bg-muted/40 transition-colors cursor-pointer"
                        onClick={() => toggleExpand(student.studentId)}
                      >
                        <td className="px-3 py-2 text-center text-muted-foreground">
                          {drl?.loading ? (
                            <Loader2 className="w-3 h-3 animate-spin inline" />
                          ) : isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 inline" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 inline" />
                          )}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs">
                          {student.studentCode ?? '—'}
                        </td>
                        <td className="px-4 py-2 font-medium">
                          {student.user?.fullName ?? '—'}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {student.class?.className ?? '—'}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {student.class?.major?.falculty?.falcultyName ?? '—'}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {drl?.loaded ? (
                            <Badge
                              className={drl.rankingColor}
                              variant="default"
                            >
                              {drl.totalApproved}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable: Bảng điểm theo tiêu chí */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="px-0 py-0 bg-muted/10">
                            {drl?.loading ? (
                              <div className="flex items-center gap-2 px-6 py-4 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang tải điểm rèn luyện...
                              </div>
                            ) : drl?.error ? (
                              <div className="px-6 py-4 text-sm text-red-500">
                                Không thể tải điểm rèn luyện cho sinh viên này
                              </div>
                            ) : drl && drl.tree.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead className="bg-muted/60 text-muted-foreground border-b">
                                    <tr>
                                      <th className="p-2 pl-4 text-left font-medium w-8">STT</th>
                                      <th className="p-2 text-left font-medium w-20">Mã TC</th>
                                      <th className="p-2 text-left font-medium">Tên tiêu chí</th>
                                      <th className="p-2 text-center font-medium w-16">Tối đa</th>
                                      <th className="p-2 text-center font-medium w-16">Đã duyệt</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border">
                                    {drl.tree.map((c, idx) => renderCriterion(c, idx))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="px-6 py-4 text-sm text-muted-foreground">
                                Chưa có điểm rèn luyện cho sinh viên này
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {allStudents.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Hiển thị {allStudents.length} sinh viên
          </p>
        )}
      </main>
    </div>
  );
}
