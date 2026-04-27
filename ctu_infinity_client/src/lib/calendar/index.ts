/**
 * Calendar utilities for adding events to Google Calendar
 *
 * Re-exports for convenience:
 * - Utility functions from ./buildGoogleCalendarUrl
 * - Hook from @/hooks/useAddToCalendar
 * - Component from @/components/shared/AddToCalendarButton
 */

export {
  buildGoogleCalendarUrl,
  openGoogleCalendar,
  type CalendarEvent,
} from './buildGoogleCalendarUrl';

export { useAddToCalendar } from '@/hooks/useAddToCalendar';

export { AddToCalendarButton } from '@/components/shared/AddToCalendarButton';
