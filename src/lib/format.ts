let locale='en-GB',timeZone='UTC';
export function configureDisplay(nextLocale:string,nextTimeZone:string){locale=nextLocale;timeZone=nextTimeZone;}
export function formatTimestamp(timestamp:number){return new Intl.DateTimeFormat(locale,{timeZone,month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(timestamp));}
export function formatPrice(value: number) {
  if (!Number.isFinite(value)) return '—';
  if (value < 10) return value.toLocaleString(locale,{minimumFractionDigits:4,maximumFractionDigits:4});
  return value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatMoney(value: number, currency = 'USD') {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number) {
  if (!Number.isFinite(value)) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function formatCompact(value: number) {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 2 }).format(value);
}
