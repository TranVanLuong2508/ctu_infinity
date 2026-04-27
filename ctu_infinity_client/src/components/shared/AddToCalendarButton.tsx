import React from 'react';
import { CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAddToCalendar } from '@/hooks/useAddToCalendar';
import { CalendarEvent } from '@/lib/calendar/buildGoogleCalendarUrl';

interface AddToCalendarButtonProps {
  event: CalendarEvent;
  variant?:
    | 'default'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Button component for adding events to Google Calendar
 *
 * @example
 * ```tsx
 * <AddToCalendarButton
 *   event={{
 *     title: 'Workshop AI',
 *     startDate: new Date('2026-03-10T08:00:00'),
 *     endDate: new Date('2026-03-10T10:00:00'),
 *     location: 'Hội trường CTU',
 *     description: 'Workshop về AI',
 *   }}
 *   variant="outline"
 *   size="sm"
 * />
 * ```
 */
export function AddToCalendarButton({
  event,
  variant = 'outline',
  size = 'default',
  className,
  children,
}: AddToCalendarButtonProps) {
  const { addToCalendar } = useAddToCalendar();

  const handleClick = () => {
    addToCalendar(event);
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={className}
    >
      <CalendarPlus className="mr-2 h-4 w-4" />
      {children || 'Thêm vào Google Calendar'}
    </Button>
  );
}
