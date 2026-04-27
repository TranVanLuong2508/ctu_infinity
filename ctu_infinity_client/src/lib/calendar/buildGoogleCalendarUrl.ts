import { parseMarkdownToPlainText } from './markdown-parser';

/**
 * Event data structure for Google Calendar
 */
export interface CalendarEvent {
  title: string;
  startDate: Date | string;
  endDate: Date | string;
  location?: string;
  description?: string;
}

/**
 * Format date to Google Calendar format: YYYYMMDDTHHmmss
 * Example: 2026-03-10 08:00:00 => 20260310T080000
 */
function formatDateForGoogleCalendar(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Build Google Calendar URL with event details
 *
 * @param event - Event data including title, dates, location, description
 * @returns Google Calendar URL with encoded parameters
 *
 * @example
 * ```ts
 * const url = buildGoogleCalendarUrl({
 *   title: 'Workshop AI cho sinh viên',
 *   startDate: new Date('2026-03-10T08:00:00'),
 *   endDate: new Date('2026-03-10T10:00:00'),
 *   location: 'Hội trường Rùa CTU',
 *   description: 'Workshop chia sẻ về AI',
 * });
 *
 * // Returns: https://calendar.google.com/calendar/render?action=TEMPLATE
 * //          &text=Workshop%20AI%20cho%20sinh%20vi%C3%AAn
 * //          &dates=20260310T080000/20260310T100000
 * //          &location=H%E1%BB%99i%20tr%C6%B0%E1%BB%9Dng%20R%C3%B9a%20CTU
 * //          &details=Workshop%20chia%20s%E1%BA%BB%20v%E1%BB%81%20AI
 * ```
 */
export function buildGoogleCalendarUrl(event: CalendarEvent): string {
  const baseUrl = 'https://calendar.google.com/calendar/render';

  // Format dates
  const startFormatted = formatDateForGoogleCalendar(event.startDate);
  const endFormatted = formatDateForGoogleCalendar(event.endDate);

  // Build query parameters
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startFormatted}/${endFormatted}`,
  });

  // Add optional parameters
  if (event.location) {
    params.append('location', event.location);
  }

  if (event.description) {
    // Parse markdown thành plain text trước khi thêm vào calendar
    const plainDescription = parseMarkdownToPlainText(event.description);
    params.append('details', plainDescription);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Open Google Calendar in a new tab with event details
 *
 * @param event - Event data
 * @returns Promise<void>
 */
export function openGoogleCalendar(event: CalendarEvent): void {
  const url = buildGoogleCalendarUrl(event);
  window.open(url, '_blank', 'noopener,noreferrer');
}
