import { format } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

/** Múi giờ Việt Nam: Asia/Ho_Chi_Minh (UTC+7, không có DST) */
export const VIETNAM_TZ = 'Asia/Ho_Chi_Minh';

/**
 * Chuyển ISO string → Date object theo múi giờ Việt Nam.
 * Khi backend lưu UTC, gọi hàm này để hiển thị đúng giờ VN.
 */
function toVietnamTime(isoString?: string | null | Date): Date {
  if (!isoString) return new Date('');
  const d = new Date(isoString);
  return toZonedTime(d, VIETNAM_TZ);
}

/**
 * Format ngày giờ đầy đủ: HH:mm:ss dd/MM/yyyy (giờ Việt Nam)
 */
export function formatDateTime(isoString?: string | null) {
  if (!isoString) return '';
  try {
    return formatInTimeZone(
      new Date(isoString),
      VIETNAM_TZ,
      'HH:mm:ss dd/MM/yyyy',
    );
  } catch {
    return '';
  }
}

/**
 * Format ngày giờ: HH:mm dd/MM/yyyy (không có giây, giờ Việt Nam)
 */
export function formatDateTimeShort(isoString?: string | null) {
  if (!isoString) return '';
  try {
    return formatInTimeZone(
      new Date(isoString),
      VIETNAM_TZ,
      'HH:mm dd/MM/yyyy',
    );
  } catch {
    return '';
  }
}

/**
 * Format ngày cho form sinh nhật: dd/MM/yyyy (không múi giờ, chỉ date)
 */
export function formatbirthDate(isoString?: string | null) {
  if (!isoString) return '';
  try {
    return format(new Date(isoString), 'dd/MM/yyyy');
  } catch {
    return '';
  }
}

/**
 * Format ngày: dd/MM/yyyy (không múi giờ, chỉ date)
 */
export function formatDate(isoString?: string | null | Date) {
  if (!isoString) return '';
  try {
    return format(toVietnamTime(isoString), 'dd/MM/yyyy');
  } catch {
    return '';
  }
}

/**
 * Format ngày + giờ hiển thị trong picker (date-fns format với locale vi,
 * không cần timezone vì đây là hiển thị từ Date object đã được xử lý)
 */
export function formatDatePicker(isoString?: string | null) {
  if (!isoString) return '';
  try {
    return formatInTimeZone(
      new Date(isoString),
      VIETNAM_TZ,
      'dd/MM/yyyy',
    );
  } catch {
    return '';
  }
}

/**
 * Format ngày + giờ hiển thị trong datetime picker
 */
export function formatDateTimePicker(isoString?: string | null) {
  if (!isoString) return '';
  try {
    return formatInTimeZone(
      new Date(isoString),
      VIETNAM_TZ,
      'HH:mm - dd/MM/yyyy',
    );
  } catch {
    return '';
  }
}

export function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime());
}
