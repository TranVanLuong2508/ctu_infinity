'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  Users,
  Award,
} from 'lucide-react';

interface DRLPersonalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock data for personalization
const categoryProgress = [
  {
    code: 'I',
    name: 'Đánh giá về ý thức tham gia học tập',
    currentPoints: 18,
    maxPoints: 20,
    percentage: 90,
    status: 'excellent' as const,
  },
  {
    code: 'II',
    name: 'Đánh giá về ý thức chấp hành nội quy',
    currentPoints: 14,
    maxPoints: 25,
    percentage: 56,
    status: 'needs-improvement' as const,
  },
  {
    code: 'III',
    name: 'Đánh giá về hoạt động chính trị - xã hội',
    currentPoints: 15,
    maxPoints: 20,
    percentage: 75,
    status: 'good' as const,
  },
  {
    code: 'IV',
    name: 'Đánh giá về hoạt động văn hóa - thể dục - thể thao',
    currentPoints: 12,
    maxPoints: 20,
    percentage: 60,
    status: 'needs-improvement' as const,
  },
  {
    code: 'V',
    name: 'Đánh giá về hội nhập cộng đồng',
    currentPoints: 18,
    maxPoints: 15,
    percentage: 100,
    status: 'excellent' as const,
  },
];

const missingCriteria = [
  {
    criterionName: 'Hoàn thành chứng chỉ tin học',
    categoryCode: 'I',
    missingPoints: 3,
    priority: 'high' as const,
  },
  {
    criterionName: 'Tham gia kỳ thi chuyên ngành',
    categoryCode: 'I',
    missingPoints: 2,
    priority: 'medium' as const,
  },
  {
    criterionName: 'Tham gia hoạt động tình nguyện',
    categoryCode: 'III',
    missingPoints: 5,
    priority: 'high' as const,
  },
  {
    criterionName: 'Tham gia CLB thể thao',
    categoryCode: 'IV',
    missingPoints: 4,
    priority: 'medium' as const,
  },
];

const recommendedActivities = [
  {
    id: 1,
    name: 'Lớp học tin học nâng cao',
    description: 'Khóa học chuẩn bị thi chứng chỉ tin học MOS',
    category: 'Học tập',
    points: 3,
    criterionCode: 'I',
    date: '25/01/2026 - 15/02/2026',
    location: 'Phòng A301',
    registrationDeadline: '23/01/2026',
    participants: 45,
    maxParticipants: 50,
  },
  {
    id: 2,
    name: 'Chiến dịch Xuân tình nguyện 2026',
    description: 'Tham gia hoạt động thiện nguyện tại vùng sâu vùng xa',
    category: 'Tình nguyện',
    points: 5,
    criterionCode: 'III',
    date: '01/02/2026 - 07/02/2026',
    location: 'Huyện Phong Điền',
    registrationDeadline: '28/01/2026',
    participants: 120,
    maxParticipants: 150,
  },
  {
    id: 3,
    name: 'Giải bóng đá sinh viên CTU 2026',
    description: 'Giải bóng đá thường niên dành cho sinh viên toàn trường',
    category: 'Thể thao',
    points: 4,
    criterionCode: 'IV',
    date: '10/02/2026 - 20/03/2026',
    location: 'Sân vận động CTU',
    registrationDeadline: '05/02/2026',
    participants: 16,
    maxParticipants: 20,
  },
  {
    id: 4,
    name: 'Olympic Tin học sinh viên',
    description: 'Cuộc thi lập trình và giải thuật cho sinh viên',
    category: 'Học tập',
    points: 7,
    criterionCode: 'I',
    date: '15/02/2026',
    location: 'Online',
    registrationDeadline: '10/02/2026',
    participants: 234,
    maxParticipants: 300,
  },
];

export function DRLPersonalizationModal({
  isOpen,
  onClose,
}: DRLPersonalizationModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'needs-improvement':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    return 'bg-orange-500';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Ưu tiên cao</Badge>;
      case 'medium':
        return <Badge variant="secondary">Ưu tiên trung bình</Badge>;
      default:
        return <Badge variant="outline">Ưu tiên thấp</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Cá nhân hóa Điểm Rèn Luyện
          </DialogTitle>
          <DialogDescription>
            Phân tích chi tiết tiến độ và đề xuất hoạt động phù hợp với bạn
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Category Progress Section */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Tiến độ theo từng mục
            </h3>
            <div className="space-y-4">
              {categoryProgress.map((category) => (
                <Card key={category.code}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {category.code}. {category.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {category.currentPoints}/{category.maxPoints} điểm
                        </CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className={getStatusColor(category.status)}
                      >
                        {category.percentage}%
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

          {/* Missing Criteria Section */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Tiêu chí còn thiếu
            </h3>
            <div className="space-y-3">
              {missingCriteria.map((criterion, index) => (
                <Card key={index} className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm font-medium">
                          {criterion.criterionName}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          Mục {criterion.categoryCode} • Thiếu{' '}
                          {criterion.missingPoints} điểm
                        </CardDescription>
                      </div>
                      {getPriorityBadge(criterion.priority)}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>

          {/* Recommended Activities Section */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Sự kiện đề xuất
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {recommendedActivities.map((activity) => (
                <Card
                  key={activity.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary">{activity.category}</Badge>
                      <Badge className="bg-green-500">
                        +{activity.points} điểm
                      </Badge>
                    </div>
                    <CardTitle className="text-base">{activity.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {activity.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{activity.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>
                        {activity.participants}/{activity.maxParticipants} người
                        đăng ký
                      </span>
                    </div>
                    <div className="pt-2">
                      <Progress
                        value={
                          (activity.participants / activity.maxParticipants) *
                          100
                        }
                        className="h-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">
                      Hạn đăng ký: {activity.registrationDeadline}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
