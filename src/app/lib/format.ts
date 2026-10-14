const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  weekday: 'short',
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatTime(isoDateTime: string): string {
  return timeFormatter.format(new Date(isoDateTime));
}

export function formatDate(isoDateTime: string): string {
  return dateFormatter.format(new Date(isoDateTime));
}

export function formatDuration(durationMinutes: number): string {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

export function formatStops(stops: number): string {
  return stops === 0 ? 'Direto' : `${stops} parada${stops > 1 ? 's' : ''}`;
}

export function formatMiles(miles: number): string {
  return miles.toLocaleString('pt-BR');
}
