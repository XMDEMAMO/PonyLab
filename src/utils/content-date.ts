const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_WITH_TIME_ZONE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|([+-])(\d{2}):(\d{2}))$/;
const HONG_KONG_OFFSET = '+08:00';

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function hasValidCalendarDate(
  year: number,
  month: number,
  day: number,
): boolean {
  return (
    year >= 1 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(year, month)
  );
}

export function isContentDateString(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const dateOnlyMatch = DATE_ONLY_PATTERN.exec(value);

  if (dateOnlyMatch) {
    return hasValidCalendarDate(
      Number(dateOnlyMatch[1]),
      Number(dateOnlyMatch[2]),
      Number(dateOnlyMatch[3]),
    );
  }

  const timestampMatch = ISO_WITH_TIME_ZONE_PATTERN.exec(value);

  if (!timestampMatch) {
    return false;
  }

  const [
    ,
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
    secondText,
    zone,
    ,
    offsetHourText,
    offsetMinuteText,
  ] = timestampMatch;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);

  if (
    !hasValidCalendarDate(year, month, day) ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return false;
  }

  if (zone !== 'Z') {
    const offsetHour = Number(offsetHourText);
    const offsetMinute = Number(offsetMinuteText);

    if (
      offsetHour > 14 ||
      offsetMinute > 59 ||
      (offsetHour === 14 && offsetMinute !== 0)
    ) {
      return false;
    }
  }

  return !Number.isNaN(new Date(value).getTime());
}

export function isContentDateInput(value: unknown): value is string | Date {
  return value instanceof Date
    ? !Number.isNaN(value.getTime())
    : isContentDateString(value);
}

export function parseContentDate(value: string | Date): Date {
  if (!isContentDateInput(value)) {
    throw new TypeError(
      `Expected an ISO date (YYYY-MM-DD) or ISO timestamp with an explicit offset, received "${String(value)}".`,
    );
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  return new Date(
    DATE_ONLY_PATTERN.test(value)
      ? `${value}T00:00:00${HONG_KONG_OFFSET}`
      : value,
  );
}
