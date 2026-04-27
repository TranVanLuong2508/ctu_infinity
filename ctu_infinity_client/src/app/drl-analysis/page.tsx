'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  Users,
  Award,
  Lightbulb,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

import {
  useDrlAnalysisData,
  IDrlCriterionRow,
} from '@/hooks/useDrlAnalysisData';
import { Header } from '@/components/shared/header';

export default function DRLAnalysisPage() {
  const router = useRouter();
  const personalizationRef = useRef<HTMLDivElement>(null);
  const [reasonFilter, setReasonFilter] = useState<
    'ALL' | 'DEFICIT' | 'SUBSCRIPTION' | 'HISTORY' | 'COMMUNITY'
  >('ALL');
  const { isLoading, error, criteriaRows, personalization, summary, currentSemesterName } =
    useDrlAnalysisData();

  const filteredRecommendations =
    reasonFilter === 'ALL'
      ? personalization.recommendations
      : personalization.recommendations.filter(
          (rec: any) => rec.explanation?.reasonType === reasonFilter,
        );

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Đang tải dữ liệu...
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Lỗi: {error}
      </div>
    );

  const scrollToPersonalization = () => {
    personalizationRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const renderCriterion = (
    criterion: IDrlCriterionRow,
    rootIndex: number = 0,
  ) => {
    const paddingLeft = criterion.level * 20;

    // Main criterion row
    const mainRow = (
      <tr
        key={`criterion-${criterion.id}`}
        className="border-b hover:bg-muted/50"
      >
        <td className="p-4 text-center text-sm font-medium">
          {criterion.level === 0 ? rootIndex + 1 : ''}
        </td>
        <td className="p-4 text-center text-sm">
          {criterion.level <= 3 ? criterion.criteriaCode : ''}
        </td>
        <td className="p-4" style={{ paddingLeft: `${paddingLeft}px` }}>
          <span
            className={
              criterion.level === 0
                ? 'font-semibold text-base'
                : criterion.isLeaf
                  ? 'text-muted-foreground'
                  : 'font-medium'
            }
          >
            {criterion.level !== 0 && !criterion.isLeaf && (
              <span className="font-semibold text-primary">
                {criterion.criteriaCode}.{' '}
              </span>
            )}
            {criterion.level === 0 && `${criterion.criteriaCode}. `}
            {criterion.level !== 0 && criterion.isLeaf && (
              <span className="text-muted-foreground">- </span>
            )}
            {criterion.criteriaName}
          </span>
        </td>
        <td className="p-4 text-center text-base font-bold text-muted-foreground">
          {criterion.maxPoints > 0 ? criterion.maxPoints : '-'}
        </td>
        <td className="p-4 text-center">
          <span className="text-orange-500 font-semibold">
            {criterion.pendingPoints > 0 ? `+${criterion.pendingPoints}` : '-'}
          </span>
        </td>
        <td className="p-4 text-center">
          <Badge
            variant={
              criterion.approvedPoints >= (criterion.maxPoints || 0) &&
              criterion.maxPoints > 0
                ? 'default'
                : 'secondary'
            }
            className="text-sm px-3 py-1"
          >
            {criterion.approvedPoints}
          </Badge>
        </td>
      </tr>
    );

    const childRows: React.ReactElement[] = [];

    // Render children
    if (criterion.children) {
      criterion.children.forEach((child, childIdx) => {
        childRows.push(...renderCriterion(child, rootIndex));
      });
    }

    return [mainRow, ...childRows];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col items-center md:flex-row md:justify-center relative mb-8 gap-4 px-0">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="absolute left-0 top-0 md:top-1/2 md:-translate-y-1/2 w-fit -ml-2 md:ml-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <div className="text-center mt-8 md:mt-0 px-8 sm:px-0">
            <h1 className="text-2xl md:text-3xl font-bold">
              Chi tiết Điểm Rèn Luyện
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {currentSemesterName}
            </p>
          </div>
        </div>
        {/* Summary Section - Academic Style */}
        <Card className="mb-8">
          <CardHeader className="border-b border-border/40 bg-muted/20 pb-4 rounded-t-xl">
            <CardTitle className="text-lg font-bold uppercase text-primary">
              Thông tin đánh giá
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Student Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider border-b pb-1 mb-3">
                  Thông tin sinh viên
                </h3>
                <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                  <span className="text-muted-foreground">Họ và tên:</span>
                  <span className="font-medium">Trần Văn Lương</span>

                  <span className="text-muted-foreground">MSSV:</span>
                  <span className="font-medium">B2110123</span>

                  <span className="text-muted-foreground">Lớp:</span>
                  <span className="font-medium">DI21V7A1</span>

                  <span className="text-muted-foreground">Khoa:</span>
                  <span className="font-medium">
                    Công nghệ thông tin & Truyền thông
                  </span>
                </div>
              </div>

              {/* Score Summary */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider border-b pb-1 mb-3">
                  Kết quả rèn luyện
                </h3>
                <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                  <span className="text-muted-foreground">Tổng điểm:</span>
                  <span className="font-bold text-lg text-primary">
                    {summary.totalApproved}/100
                  </span>

                  <span className="text-muted-foreground">Chờ duyệt:</span>
                  <span className="font-bold text-base text-orange-500">
                    +{summary.totalPending}
                  </span>

                  <span className="text-muted-foreground">Xếp loại:</span>
                  <Badge
                    variant="outline"
                    className={`w-fit font-bold text-white border-transparent ${summary.ranking.color || 'bg-gray-500'}`}
                  >
                    {summary.ranking.label || 'Chưa cập nhật'}
                  </Badge>

                  <span className="text-muted-foreground">
                    Gợi ý phân tích:
                  </span>
                  <span className="font-medium text-muted-foreground">
                    {summary.ranking.nextStep}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center items-start justify-between gap-3">
              <CardTitle className="text-2xl">
                Bảng điểm theo tiêu chí
              </CardTitle>
              <Button
                onClick={scrollToPersonalization}
                variant="outline"
                className="gap-2"
              >
                <ChevronDown className="h-4 w-4" />
                Xem các mục còn thiếu
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary text-primary-foreground">
                  <tr>
                    <th className="p-4 text-center font-semibold w-16">STT</th>
                    <th className="p-4 text-left font-semibold w-28">
                      Mã tiêu chí
                    </th>
                    <th className="p-4 text-left font-semibold">
                      Tên tiêu chí
                    </th>
                    <th className="p-4 text-center font-semibold w-32">
                      Điểm tối đa
                    </th>
                    <th className="p-4 text-center font-semibold w-32">
                      Chờ duyệt
                    </th>
                    <th className="p-4 text-center font-semibold w-32">
                      Đã duyệt
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {criteriaRows.map((criterion, rootIndex) =>
                    renderCriterion(criterion, rootIndex),
                  )}
                </tbody>
                <tfoot className="bg-muted border-t">
                  <tr>
                    <td
                      colSpan={3}
                      className="p-4 text-right font-bold text-base"
                    >
                      Tổng cộng:
                    </td>
                    <td className="p-4 text-center font-bold text-base text-muted-foreground">
                      100
                    </td>
                    <td className="p-4 text-center font-bold text-base text-orange-500">
                      +{summary.totalPending}
                    </td>
                    <td className="p-4 text-center font-bold text-base text-primary">
                      {summary.totalApproved}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Personalization Section */}
        <div ref={personalizationRef} className="mt-8 space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Phân tích cá nhân hóa</h2>
          </div>

          {/* Category Progress */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Tiến độ theo từng mục
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {personalization.categoryProgress.map((category) => (
                <Card
                  key={category.criteriaId}
                  className="hover:shadow-md hover:-translate-y-px transition-all duration-200"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle
                          className="text-base font-medium line-clamp-2 pr-2"
                          title={category.criteriaName}
                        >
                          {category.criteriaCode}. {category.criteriaName}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {category.currentPoints}/{category.maxPoints} điểm
                        </CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          category.percentage >= 80
                            ? 'text-green-600 border-green-200'
                            : category.percentage >= 60
                              ? 'text-blue-600 border-blue-200'
                              : 'text-orange-600 border-orange-200'
                        }
                      >
                        {category.percentage.toFixed(0)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={category.percentage} className="h-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Missing Criteria */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Tiêu chí còn thiếu
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {personalization.lackingLeafCriterias.length > 0 ? (
                personalization.lackingLeafCriterias.map((criterion, index) => (
                  <Card
                    key={index}
                    className="hover:shadow-md hover:-translate-y-px transition-all duration-200"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span
                            className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${criterion.priority === 'high' ? 'bg-destructive' : 'bg-orange-400'}`}
                          />
                          <div className="min-w-0">
                            <CardTitle
                              className="text-sm font-medium line-clamp-2"
                              title={criterion.criteriaName}
                            >
                              {criterion.criteriaName}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              Mục {criterion.parentRootCode} • Thiếu{' '}
                              {criterion.missingPoints} điểm
                            </CardDescription>
                          </div>
                        </div>
                        <Badge
                          variant={
                            criterion.priority === 'high'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="shrink-0"
                        >
                          {criterion.priority === 'high'
                            ? 'Ưu tiên cao'
                            : 'Nên chú ý'}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 text-center py-6 text-muted-foreground">
                  Bạn đã đạt đủ điểm tối đa cho các tiêu chí cơ bản!
                </div>
              )}
            </div>
          </section>

          {/* Recommended Activities */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Sự kiện đề xuất
            </h3>

            {/* Bộ lọc lý do gợi ý */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <Button
                size="sm"
                variant={reasonFilter === 'ALL' ? 'default' : 'outline'}
                onClick={() => setReasonFilter('ALL')}
                className="text-xs"
              >
                Tất cả
              </Button>
              <Button
                size="sm"
                variant={reasonFilter === 'DEFICIT' ? 'default' : 'outline'}
                onClick={() => setReasonFilter('DEFICIT')}
                className="text-xs"
              >
                Bù điểm thiếu
              </Button>
              <Button
                size="sm"
                variant={
                  reasonFilter === 'SUBSCRIPTION' ? 'default' : 'outline'
                }
                onClick={() => setReasonFilter('SUBSCRIPTION')}
                className="text-xs"
              >
                Theo sở thích
              </Button>
              <Button
                size="sm"
                variant={reasonFilter === 'HISTORY' ? 'default' : 'outline'}
                onClick={() => setReasonFilter('HISTORY')}
                className="text-xs"
              >
                Tương tự sự kiện cũ
              </Button>
              <Button
                size="sm"
                variant={reasonFilter === 'COMMUNITY' ? 'default' : 'outline'}
                onClick={() => setReasonFilter('COMMUNITY')}
                className="text-xs"
              >
                Cộng đồng quan tâm
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {filteredRecommendations.length > 0 ? (
                filteredRecommendations.map((activity) => (
                  <Card
                    key={activity.id}
                    className="hover:shadow-md hover:-translate-y-px transition-all duration-200 border-border/40"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge
                          variant="secondary"
                          className="max-w-[150px] truncate text-xs"
                          title={activity.criteriaName}
                        >
                          {activity.criteriaName}
                        </Badge>
                        <Badge className="bg-green-500 text-xs shrink-0">
                          +{activity.points} điểm
                        </Badge>
                      </div>
                      <CardTitle
                        className="text-sm leading-snug line-clamp-2"
                        title={activity.title}
                      >
                        {activity.title}
                      </CardTitle>
                      <CardDescription className="text-xs line-clamp-2">
                        {activity.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {activity.time} | {activity.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5 shrink-0" />
                        {activity.participants != null &&
                        activity.maxParticipants != null ? (
                          <span className="truncate">
                            {activity.participants}/{activity.maxParticipants}{' '}
                            người đăng ký
                          </span>
                        ) : (
                          <span>Không có dữ liệu số lượng</span>
                        )}
                      </div>
                      <div className="pt-1">
                        <Progress
                          value={
                            activity.participants != null &&
                            activity.maxParticipants != null &&
                            activity.maxParticipants > 0
                              ? (activity.participants /
                                  activity.maxParticipants) *
                                100
                              : 0
                          }
                          className="h-1"
                        />
                      </div>
                      <p className="text-xs text-red-500 font-medium">
                        Hạn đăng ký:{' '}
                        {new Date(
                          activity.registrationDeadline,
                        ).toLocaleDateString('vi-VN')}
                      </p>

                      {activity.explanation && (
                        <div className="bg-primary/5 border border-primary/10 rounded-lg p-2.5 mt-1">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-primary mb-0.5">
                                Lý do gợi ý
                              </p>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {activity.explanation.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 text-center py-6 text-muted-foreground">
                  Không có đề xuất hoạt động nào cho bạn lúc này.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
