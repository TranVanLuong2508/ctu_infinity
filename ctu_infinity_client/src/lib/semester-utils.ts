/**
 * Semester and Academic Year Utility Functions
 * Handles semester detection, date ranges, and filtering for CTU DRL system
 */

export type Semester = 'HK1' | 'HK2' | 'HK3';

export interface SemesterInfo {
  semester: Semester;
  academicYear: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Get current semester based on current date
 * HK1: September - January
 * HK2: February - June
 * HK3/Hè: July - August
 */
export function getCurrentSemester(): Semester {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12

  if (month >= 9 || month <= 1) {
    return 'HK1';
  } else if (month >= 2 && month <= 6) {
    return 'HK2';
  } else {
    return 'HK3';
  }
}

/**
 * Get current academic year string (e.g., "2024-2025")
 * Academic year starts in September
 */
export function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (month >= 9) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

/**
 * Get semester from a date
 */
export function getSemesterFromDate(date: Date | string): Semester {
  const d = typeof date === 'string' ? new Date(date) : date;
  const month = d.getMonth() + 1;

  if (month >= 9 || month <= 1) {
    return 'HK1';
  } else if (month >= 2 && month <= 6) {
    return 'HK2';
  } else {
    return 'HK3';
  }
}

/**
 * Get academic year from a date
 */
export function getAcademicYearFromDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;

  if (month >= 9) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

/**
 * Get date range for a specific semester and academic year
 */
export function getSemesterDateRange(
  semester: Semester,
  academicYear: string,
): { startDate: Date; endDate: Date } {
  const [startYear, endYear] = academicYear.split('-').map(Number);

  switch (semester) {
    case 'HK1':
      return {
        startDate: new Date(startYear, 8, 1), // September 1st
        endDate: new Date(startYear + 1, 0, 31), // January 31st
      };
    case 'HK2':
      return {
        startDate: new Date(endYear, 1, 1), // February 1st
        endDate: new Date(endYear, 5, 30), // June 30th
      };
    case 'HK3':
      return {
        startDate: new Date(endYear, 6, 1), // July 1st
        endDate: new Date(endYear, 7, 31), // August 31st
      };
  }
}

/**
 * Get semester display name
 */
export function getSemesterName(semester: Semester): string {
  switch (semester) {
    case 'HK1':
      return 'Học kỳ 1';
    case 'HK2':
      return 'Học kỳ 2';
    case 'HK3':
      return 'Học kỳ 3';
  }
}

/**
 * Get all available semesters
 */
export function getAllSemesters(): Semester[] {
  return ['HK1', 'HK2', 'HK3'];
}

/**
 * Generate list of academic years (last 5 years + current + next)
 */
export function getAcademicYearOptions(): string[] {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];

  for (let i = -2; i <= 1; i++) {
    const year = currentYear + i;
    years.push(`${year}-${year + 1}`);
  }

  return years;
}

/**
 * Check if an event belongs to a specific semester and academic year
 */
export function isEventInSemester(
  eventDate: string | Date,
  targetSemester: Semester,
  targetAcademicYear: string,
): boolean {
  const eventSemester = getSemesterFromDate(eventDate);
  const eventAcademicYear = getAcademicYearFromDate(eventDate);

  return (
    eventSemester === targetSemester && eventAcademicYear === targetAcademicYear
  );
}
