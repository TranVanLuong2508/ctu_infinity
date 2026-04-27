'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from 'lucide-react';
import { academicYearService } from '@/services/academic-year.service';
import { semesterService } from '@/services/semester.service';
import { useAuthStore } from '@/stores/authStore';
import type { IAcademicYear, ISemester } from '@/types/semester.type';

interface SemesterSelectorProps {
  selectedSemesterId: string | 'all';
  selectedAcademicYearId: string | 'all';
  academicYears: IAcademicYear[];
  semesters: ISemester[];
  onSemesterChange: (semesterId: string | 'all') => void;
  onAcademicYearChange: (yearId: string | 'all') => void;
  showAllOption?: boolean;
  showAllYearOption?: boolean;
}

export function SemesterSelector({
  selectedSemesterId,
  selectedAcademicYearId,
  academicYears,
  semesters,
  onSemesterChange,
  onAcademicYearChange,
  showAllOption = true,
  showAllYearOption = false,
}: SemesterSelectorProps) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Học kỳ:</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Academic Year Selector */}
            <Select
              value={selectedAcademicYearId}
              onValueChange={onAcademicYearChange}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Chọn năm học" />
              </SelectTrigger>
              <SelectContent>
                {showAllYearOption && (
                  <SelectItem value="all">Tất cả năm học</SelectItem>
                )}
                {academicYears.map((year) => (
                  <SelectItem key={year.yearId} value={year.yearId}>
                    {year.yearName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Semester Tabs */}
            <Tabs
              value={selectedSemesterId}
              onValueChange={(value) =>
                onSemesterChange(value as string | 'all')
              }
              className="flex-1"
            >
              <TabsList className="flex flex-wrap w-full sm:w-fit h-auto">
                {showAllOption && <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Tất cả</TabsTrigger>}
                {semesters.map((semester) => (
                  <TabsTrigger
                    key={semester.semesterId}
                    value={semester.semesterId}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {semester.semesterName}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function useAcademicCalendar(options?: { allowAllYears?: boolean }) {
  const { isAuthenticated } = useAuthStore();
  const allowAllYears = options?.allowAllYears ?? false;
  const [academicYears, setAcademicYears] = React.useState<IAcademicYear[]>([]);
  const [semesters, setSemesters] = React.useState<ISemester[]>([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = React.useState<
    string | 'all'
  >(allowAllYears ? 'all' : '');
  const [selectedSemesterId, setSelectedSemesterId] = React.useState<
    string | 'all'
  >('all');
  const [isLoading, setIsLoading] = React.useState(false);

  const selectedAcademicYear = React.useMemo(
    () => academicYears.find((year) => year.yearId === selectedAcademicYearId),
    [academicYears, selectedAcademicYearId],
  );

  const selectedSemester = React.useMemo(
    () =>
      semesters.find((semester) => semester.semesterId === selectedSemesterId),
    [semesters, selectedSemesterId],
  );

  React.useEffect(() => {
    if (!isAuthenticated) return;

    const fetchAcademicYears = async () => {
      setIsLoading(true);
      try {
        const res = await academicYearService.getAll();
        if (res.EC === 1 && res.data?.academicYears) {
          const years = res.data.academicYears;
          setAcademicYears(years);
          if (!allowAllYears) {
            const currentYear = years.find((year) => year.isCurrent);
            const initialYearId = currentYear?.yearId || years[0]?.yearId || '';
            setSelectedAcademicYearId(initialYearId);
          }
        }
      } catch (error) {
        console.error('Failed to fetch academic years', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAcademicYears();
  }, [isAuthenticated]);

  React.useEffect(() => {
    if (!selectedAcademicYearId || selectedAcademicYearId === 'all') {
      setSemesters([]);
      setSelectedSemesterId('all');
      return;
    }

    const fetchSemesters = async () => {
      setIsLoading(true);
      try {
        const res = await semesterService.getByYear(selectedAcademicYearId);
        if (res.EC === 1 && res.data?.semesters) {
          const list = res.data.semesters;
          setSemesters(list);
          const currentSemester = list.find((semester) => semester.isCurrent);
          const initialSemesterId =
            currentSemester?.semesterId || list[0]?.semesterId || 'all';
          setSelectedSemesterId(initialSemesterId);
        }
      } catch (error) {
        console.error('Failed to fetch semesters', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSemesters();
  }, [selectedAcademicYearId]);

  return {
    academicYears,
    semesters,
    selectedAcademicYearId,
    selectedSemesterId,
    selectedAcademicYear,
    selectedSemester,
    isLoading,
    setSelectedAcademicYearId,
    setSelectedSemesterId,
  };
}
