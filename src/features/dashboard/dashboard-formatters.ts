import type { CashFlowGranularity, DashboardPeriod } from './dashboard.types';

const decimalPattern = /^(-?)(\d+)(?:\.(\d+))?$/;

export function formatIdr(decimal: string): string {
  const match = decimalPattern.exec(decimal);
  if (!match) return '—';

  const [, sign, integer = '0', fraction = ''] = match;
  const groupedInteger = new Intl.NumberFormat('id-ID').format(BigInt(integer));
  const visibleFraction = fraction.replace(/0+$/, '').slice(0, 2);
  const decimalSuffix = visibleFraction ? `,${visibleFraction}` : '';

  return `${sign === '-' ? '-' : ''}Rp${groupedInteger}${decimalSuffix}`;
}

export function isZeroDecimal(decimal: string): boolean {
  return /^-?0+(?:\.0+)?$/.test(decimal);
}

export function formatFinancialDate(date: string, timezone: string): string {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return date;

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: timezone,
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function getCurrentPeriod(timezone: string): DashboardPeriod {
  const parts = new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    year: 'numeric',
    timeZone: timezone,
  }).formatToParts(new Date());
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const year = Number(parts.find((part) => part.type === 'year')?.value);

  return { month, year };
}

export function periodToInputValue(period: DashboardPeriod): string {
  return `${String(period.year).padStart(4, '0')}-${String(period.month).padStart(2, '0')}`;
}

export function inputValueToPeriod(value: string): DashboardPeriod | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (year < 2000 || year > 2100 || month < 1 || month > 12) return null;

  return { month, year };
}

export function formatPeriod(
  period: DashboardPeriod,
  timezone: string,
): string {
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: timezone,
  }).format(new Date(Date.UTC(period.year, period.month - 1, 15)));
}

export function cashFlowRange(period: DashboardPeriod): {
  from: string;
  to: string;
  granularity: CashFlowGranularity;
} {
  const month = String(period.month).padStart(2, '0');
  const lastDay = new Date(Date.UTC(period.year, period.month, 0)).getUTCDate();
  return {
    from: `${String(period.year).padStart(4, '0')}-${month}-01`,
    to: `${String(period.year).padStart(4, '0')}-${month}-${String(lastDay).padStart(2, '0')}`,
    granularity: 'day',
  };
}

export function formatCashFlowLabel(
  label: string,
  granularity: CashFlowGranularity,
  timezone: string,
): string {
  if (granularity === 'month') {
    const [year, month] = label.split('-').map(Number);
    if (!year || !month) return label;
    return new Intl.DateTimeFormat('id-ID', {
      month: 'short',
      year: 'numeric',
      timeZone: timezone,
    }).format(new Date(Date.UTC(year, month - 1, 15)));
  }
  const date = formatFinancialDate(label, timezone);
  return granularity === 'week' ? `Minggu mulai ${date}` : date;
}
