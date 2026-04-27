'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Users,
  Award,
  Building2,
  CalendarClock,
} from 'lucide-react';
import { useEventStore } from '@/stores/eventStore';
import { IEvent } from '@/types/event.type';
import { AddToCalendarButton } from '@/components/shared/AddToCalendarButton';
import { googleCalendarService } from '@/services/google-calendar.service';
import { toast } from 'sonner';
import { parseMarkdownToPlainText } from '@/lib/calendar/markdown-parser';
import { REGISTRATION_STATUS } from '@/services/event-registration.service';
import { Header } from '@/components/shared/header';
import { criteriaService, ICriteriaItem } from '@/services/criteria.service';

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  // State for direct calendar creation
  const [isCreatingDirectCalendar, setIsCreatingDirectCalendar] =
    useState(false);

  const [criteriaData, setCriteriaData] = useState<ICriteriaItem | null>(null);

  // Sử dụng eventStore để fetch và quản lý data
  const {
    selectedEvent,
    isLoading,
    isRegistering,
    isCancelling,
    fetchEventById,
    registerEvent,
    cancelRegistration,
    setSelectedEventStatus,
  } = useEventStore();

  // Fetch event data khi component mount
  useEffect(() => {
    if (id) {
      fetchEventById(id);
    }
  }, [id, fetchEventById]);

  // Fetch criteria name khi có event
  useEffect(() => {
    if (selectedEvent?.criteriaId) {
      criteriaService
        .getCriteriaById(selectedEvent.criteriaId)
        .then((res) => {
          if (res.EC === 1 && res.data) {
            setCriteriaData(res.data);
          }
        })
        .catch((err) => console.error('Error fetching criteria:', err));
    }
  }, [selectedEvent?.criteriaId]);

  // Check callback từ OAuth flow
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const calendarSuccess = searchParams.get('calendar_success');
      const googleEventId = searchParams.get('event_id');
      const error = searchParams.get('error');

      if (calendarSuccess === 'true') {
        toast.success('Tạo lịch trên Google Calendar thành công!', {
          description: 'Sự kiện đã được thêm vào Google Calendar của bạn',
        });
        // Xóa query params khỏi URL
        window.history.replaceState({}, '', window.location.pathname);
      } else if (calendarSuccess === 'false' && error) {
        toast.error('Không thể tạo lịch', {
          description: decodeURIComponent(error),
        });
        // Xóa query params khỏi URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  // Helper function để format dữ liệu từ API
  const formatEventData = (event: IEvent) => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    const formattedDate = startDate.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const startTime = startDate.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const endTime = endDate.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      formattedDate,
      time: `${startTime} - ${endTime}`,
      participantPercent: event.maxParticipants
        ? ((event.currentParticipants || 0) / event.maxParticipants) * 100
        : 0,
    };
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Đang tải thông tin sự kiện...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Event not found
  if (!selectedEvent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Không tìm thấy sự kiện</p>
            <Button className="mt-4" onClick={() => router.push('/dashboard')}>
              Quay lại Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { formattedDate, time, participantPercent } =
    formatEventData(selectedEvent);

  const handleRegister = async () => {
    if (!selectedEvent) return;
    const success = await registerEvent(selectedEvent.eventId);
    if (success) {
      // Optimistic update ngay lập tức, sau đó sync lại từ server (background)
      setSelectedEventStatus(REGISTRATION_STATUS.REGISTERED);
      fetchEventById(selectedEvent.eventId);
    }
  };

  const handleCancel = async () => {
    if (!selectedEvent) return;
    const success = await cancelRegistration(selectedEvent.eventId);
    if (success) {
      setSelectedEventStatus(REGISTRATION_STATUS.CANCELLED);
      fetchEventById(selectedEvent.eventId);
    }
  };

  // Handler for direct calendar creation with OAuth
  const handleCreateDirectCalendar = async () => {
    if (!selectedEvent) return;

    setIsCreatingDirectCalendar(true);

    try {
      // Parse markdown description thành plain text
      const plainDescription = parseMarkdownToPlainText(
        selectedEvent.description,
      );

      // Format event data theo định dạng ISO8601
      const eventData = {
        summary: selectedEvent.eventName,
        description: plainDescription,
        location: selectedEvent.location || '',
        startTime: new Date(selectedEvent.startDate).toISOString(),
        endTime: new Date(selectedEvent.endDate).toISOString(),
      };

      // Gọi API để khởi tạo OAuth flow với sourceEventId
      const response = await googleCalendarService.initiateUserAuth({
        eventData,
        sourceEventId: selectedEvent.eventId,
      });

      if (response.EC === 1 && response.data?.authUrl) {
        // Redirect user tới Google OAuth URL
        window.location.href = response.data.authUrl;
      } else {
        toast.error('Không thể tạo URL xác thực');
      }
    } catch (error) {
      console.error('Error initiating calendar OAuth:', error);
      toast.error('Có lỗi xảy ra khi tạo lịch');
    } finally {
      setIsCreatingDirectCalendar(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
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
            <h1 className="text-2xl md:text-3xl font-bold">Chi tiết sự kiện</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Thông tin đầy đủ về sự kiện
            </p>
          </div>
        </div>
        {/* Event Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-2">
              <div className="flex-1 min-w-0">
                <Badge
                  variant="outline"
                  className="mb-3 whitespace-normal text-left leading-normal"
                >
                  {criteriaData
                    ? `${criteriaData.criteriaCode ? criteriaData.criteriaCode + ' - ' : ''}${criteriaData.criteriaName}`
                    : selectedEvent.criteriaId
                      ? `Tiêu chí ${selectedEvent.criteriaId}`
                      : 'Chưa phân loại'}
                </Badge>
                <CardTitle className="text-2xl sm:text-3xl text-balance leading-snug">
                  {selectedEvent.eventName}
                </CardTitle>
              </div>
              <div className="shrink-0">
                <span className="inline-flex items-center rounded-xl bg-primary/10 text-primary font-bold text-lg px-4 py-2">
                  +{selectedEvent.score || 0} điểm
                </span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Quick Info Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Thời gian</p>
                  <p className="font-semibold">{formattedDate}</p>
                  <p className="text-sm text-muted-foreground">{time}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Địa điểm</p>
                  <p className="font-semibold">
                    {selectedEvent.location || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">
                    Số lượng đăng ký
                  </p>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold">
                      {selectedEvent.currentParticipants ?? 0}/
                      {selectedEvent.maxParticipants != null
                        ? `${selectedEvent.maxParticipants} người`
                        : 'Không giới hạn'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {participantPercent.toFixed(0)}%
                    </p>
                  </div>
                  <Progress value={participantPercent} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Đơn vị tổ chức
                  </p>
                  <p className="font-semibold">
                    {selectedEvent.organizer?.organizerName || 'Ban tổ chức'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Thông tin chi tiết</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            {selectedEvent.description ? (
              <div className="space-y-4">
                <div className="md-preview text-sm text-foreground leading-relaxed">
                  <ReactMarkdown>{selectedEvent.description}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Chưa có thông tin chi tiết cho sự kiện này
              </p>
            )}
          </CardContent>
        </Card>

        {/* Poster sự kiện */}
        {selectedEvent.posterUrl && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Poster sự kiện</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full rounded-lg overflow-hidden border bg-muted">
                <img
                  src={selectedEvent.posterUrl}
                  alt={`Poster ${selectedEvent.eventName}`}
                  className="w-full h-auto max-h-[500px] object-contain mx-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              {/* Primary actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push('/dashboard')}
                  disabled={isRegistering}
                >
                  Quay lại
                </Button>

                {selectedEvent.userRegistrationStatus ===
                REGISTRATION_STATUS.REGISTERED ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="flex-1"
                        variant="destructive"
                        disabled={isCancelling}
                      >
                        {isCancelling ? 'Đang hủy...' : 'Hủy đăng ký'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Xác nhận hủy đăng ký
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc muốn hủy đăng ký sự kiện này không? Hành
                          động này không thể hoàn tác.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Quay lại</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={handleCancel}
                        >
                          Xác nhận hủy
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : selectedEvent.userRegistrationStatus ===
                  REGISTRATION_STATUS.ATTENDED ? (
                  <Button
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    disabled
                  >
                    <Award className="w-4 h-4 mr-2" />
                    Đã tham gia
                  </Button>
                ) : selectedEvent.userRegistrationStatus ===
                  REGISTRATION_STATUS.CANCELLED ? (
                  <Button className="flex-1" variant="outline" disabled>
                    Đã hủy
                  </Button>
                ) : selectedEvent.userRegistrationStatus ===
                  REGISTRATION_STATUS.ABSENT ? (
                  <Button className="flex-1" variant="secondary" disabled>
                    Vắng mặt
                  </Button>
                ) : selectedEvent.maxParticipants != null &&
                  selectedEvent.maxParticipants > 0 &&
                  (selectedEvent.currentParticipants ?? 0) >=
                    selectedEvent.maxParticipants ? (
                  <Button className="flex-1" variant="outline" disabled>
                    Đã đủ số lượng
                  </Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="flex-1" disabled={isRegistering}>
                        <Award className="w-4 h-4 mr-2" />
                        {isRegistering ? 'Đang đăng ký...' : 'Đăng ký tham gia'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận đăng ký</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc muốn đăng ký tham gia sự kiện "
                          {selectedEvent.eventName}" không?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleRegister}
                          disabled={isRegistering}
                        >
                          {isRegistering
                            ? 'Đang đăng ký...'
                            : 'Xác nhận đăng ký'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              {/* Direct Calendar Creation button (OAuth flow) */}
              <Button
                variant="outline"
                size="default"
                className="w-full"
                onClick={handleCreateDirectCalendar}
                disabled={isCreatingDirectCalendar}
              >
                <CalendarClock className="mr-2 h-4 w-4" />
                {isCreatingDirectCalendar
                  ? 'Đang xử lý...'
                  : 'Tạo lịch trên Google Calendar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
