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

/** Whole years elapsed since a civil date (`YYYY-MM-DD`), never negative. */
export function yearsSince(day: string, now: Date = new Date()): number {
  const start = parse(day)
  let years = now.getUTCFullYear() - start.getUTCFullYear()
  const beforeAnniversary =
    now.getUTCMonth() < start.getUTCMonth() ||
    (now.getUTCMonth() === start.getUTCMonth() && now.getUTCDate() < start.getUTCDate())
  if (beforeAnniversary) years -= 1
  return Math.max(0, years)
}
