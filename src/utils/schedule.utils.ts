/**
 * ============================================
 * WEEKLY SCHEDULE HELPER UTILITIES
 * ============================================
 * Các hàm tiện ích để làm việc với weekly schedule
 */

/**
 * Lấy ngày đầu tuần (Monday) từ một ngày bất kỳ
 */
export function getWeekStart(date: Date | string): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/**
 * Lấy ngày cuối tuần (Sunday) từ một ngày bất kỳ
 */
export function getWeekEnd(date: Date | string): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7); // Adjust when day is Sunday
  const sunday = new Date(d.setDate(diff));
  return sunday.toISOString().split('T')[0];
}

/**
 * Lấy tất cả các ngày trong tuần
 */
export function getDaysInWeek(weekStart: string): string[] {
  const days: string[] = [];
  const start = new Date(weekStart);
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day.toISOString().split('T')[0]);
  }
  
  return days;
}

/**
 * Lấy week number trong năm
 */
export function getWeekNumber(date: Date | string): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

/**
 * Format ngày theo định dạng đẹp
 */
export function formatDate(date: Date | string, format: 'full' | 'short' | 'time' = 'short'): string {
  const d = new Date(date);
  
  // Use a typed map so TypeScript correctly infers the DateTimeFormatOptions
  const optionsMap: Record<'full' | 'short' | 'time', Intl.DateTimeFormatOptions> = {
    full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
    time: { hour: '2-digit', minute: '2-digit' },
  };

  const options = optionsMap[format];

  // For 'time' format, use toLocaleTimeString to return a time-only string;
  // otherwise use toLocaleDateString to return a date string.
  if (format === 'time') {
    return d.toLocaleTimeString('vi-VN', options);
  }

  return d.toLocaleDateString('vi-VN', options);
}

/**
 * Check xem 2 khoảng thời gian có overlap không
 */
export function isTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = new Date(`2000-01-01T${start1}`).getTime();
  const e1 = new Date(`2000-01-01T${end1}`).getTime();
  const s2 = new Date(`2000-01-01T${start2}`).getTime();
  const e2 = new Date(`2000-01-01T${end2}`).getTime();
  
  return (s1 < e2 && e1 > s2);
}

/**
 * Tính số giờ giữa 2 thời điểm
 */
export function calculateHours(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01T${startTime}`).getTime();
  const end = new Date(`2000-01-01T${endTime}`).getTime();
  const hours = (end - start) / (1000 * 60 * 60);
  return Math.max(0, hours);
}

/**
 * Validate shift time
 */
export function validateShiftTime(startTime: string, endTime: string): {
  valid: boolean;
  error?: string;
} {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid time format' };
  }
  
  if (start >= end) {
    return { valid: false, error: 'Start time must be before end time' };
  }
  
  const hours = calculateHours(startTime, endTime);
  if (hours > 12) {
    return { valid: false, error: 'Shift cannot be longer than 12 hours' };
  }
  
  return { valid: true };
}

/**
 * Tính rest hours giữa 2 shifts
 */
export function calculateRestHours(
  shift1End: string,
  shift1Date: string,
  shift2Start: string,
  shift2Date: string
): number {
  const end = new Date(`${shift1Date}T${shift1End}`).getTime();
  const start = new Date(`${shift2Date}T${shift2Start}`).getTime();
  const hours = (start - end) / (1000 * 60 * 60);
  return Math.max(0, hours);
}

/**
 * Group shifts by date
 */
export function groupShiftsByDate<T extends { shift_date: string }>(
  shifts: T[]
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  
  for (const shift of shifts) {
    const date = shift.shift_date;
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(shift);
  }
  
  return grouped;
}

/**
 * Generate schedule summary
 */
export function generateScheduleSummary(
  weekStart: string,
  weekEnd: string,
  totalShifts: number,
  totalAssignments: number
): string {
  const week = getWeekNumber(weekStart);
  return `Week ${week} (${formatDate(weekStart)} - ${formatDate(weekEnd)}): ${totalShifts} shifts, ${totalAssignments} assignments`;
}
