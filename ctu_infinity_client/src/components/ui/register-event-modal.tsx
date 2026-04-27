'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  MapPin,
  Clock,
  Award,
  Users,
  CheckCircle2,
} from 'lucide-react';

interface Event {
  id: string | number;
  title: string;
  date: string;
  time: string;
  location: string;
  points: number;
  participants?: number | null;
  maxParticipants?: number | null;
  criteriaName: string;
  organizer: string;
}

interface RegisterEventModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isRegistering?: boolean;
}

export function RegisterEventModal({
  event,
  isOpen,
  onClose,
  onConfirm,
  isRegistering = false,
}: RegisterEventModalProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  if (!event) return null;

  const dateObj = new Date(event.date);
  const formattedDate = dateObj.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Xác nhận đăng ký sự kiện
          </DialogTitle>
          <DialogDescription>
            Vui lòng kiểm tra lại thông tin trước khi đăng ký
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Event Title */}
          <div>
            <h3 className="text-lg font-bold text-balance">{event.title}</h3>
            <Badge variant="outline" className="mt-2 text-xs">
              {event.criteriaName}
            </Badge>
          </div>

          {/* Event Details */}
          <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Thời gian</p>
                <p className="text-sm text-muted-foreground">{formattedDate}</p>
                <p className="text-sm text-muted-foreground">{event.time}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Địa điểm</p>
                <p className="text-sm text-muted-foreground">
                  {event.location}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Số lượng tham gia</p>
                <p className="text-sm text-muted-foreground">
                  {event.participants != null && event.maxParticipants != null ? (
                    `${event.participants}/${event.maxParticipants} người`
                  ) : (
                    'Không có dữ liệu'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Award className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-primary">
                  Điểm rèn luyện
                </p>
                <p className="text-sm font-bold text-primary">
                  +{event.points} điểm
                </p>
              </div>
            </div>
          </div>

          {/* Organizer */}
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Đơn vị tổ chức:</span>{' '}
            {event.organizer}
          </div>

          {/* Note */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
            <div className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Sau khi đăng ký thành công, bạn có thể xem lại thông tin trong
                phần "Sự kiện của tôi"
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isRegistering}>
            Hủy
          </Button>
          <Button onClick={handleConfirm} disabled={isRegistering}>
            {isRegistering ? 'Đang đăng ký...' : 'Xác nhận đăng ký'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
