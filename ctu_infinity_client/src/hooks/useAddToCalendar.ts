import { useCallback } from 'react';
import { toast } from 'sonner';
import {
  CalendarEvent,
  openGoogleCalendar,
} from '@/lib/calendar/buildGoogleCalendarUrl';

interface UseAddToCalendarReturn {
  addToCalendar: (event: CalendarEvent) => void;
}

/**
 * Custom hook for adding events to Google Calendar
 *
 * @returns Object with addToCalendar function
 *
 * @example
 * ```tsx
 * const { addToCalendar } = useAddToCalendar();
 *
 * const handleAddToCalendar = () => {
 *   addToCalendar({
 *     title: eventData.title,
 *     startDate: eventData.startDate,
 *     endDate: eventData.endDate,
 *     location: eventData.location,
 *     description: eventData.description,
 *   });
 * };
 * ```
 */
export function useAddToCalendar(): UseAddToCalendarReturn {
  const addToCalendar = useCallback((event: CalendarEvent) => {
    try {
      // Validate event data
      if (!event.title || !event.startDate || !event.endDate) {
        toast.error('Thiếu thông tin sự kiện');
        return;
      }

      // Validate dates
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        toast.error('Thời gian sự kiện không hợp lệ');
        return;
      }

      if (startDate >= endDate) {
        toast.error('Thời gian bắt đầu phải trước thời gian kết thúc');
        return;
      }

      // Open Google Calendar in new tab
      openGoogleCalendar(event);

      // Show success toast
      toast.success('Đã mở Google Calendar!', {
        description: 'Vui lòng kiểm tra và lưu lịch',
      });
    } catch (error) {
      console.error('Error adding to calendar:', error);
      toast.error('Có lỗi xảy ra khi thêm vào lịch');
    }
  }, []);

  return {
    addToCalendar,
  };
}
