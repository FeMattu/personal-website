/** Civil dates are stored as `YYYY-MM-DD` and formatted in UTC so the day never shifts with the time zone. */
function parse(day: string): Date {
  return new Date(`${day}T00:00:00Z`)
}

export function formatMonthYear(day: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parse(day))
}

export function formatYear(day: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', timeZone: 'UTC' }).format(parse(day))
}

/** "set 2025 – feb 2026" / "set 2025 – In corso". */
export function formatPeriod(
  start: string,
  end: string | null,
  locale: string,
  presentLabel: string,
): string {
  return `${formatMonthYear(start, locale)} – ${end ? formatMonthYear(end, locale) : presentLabel}`
}
