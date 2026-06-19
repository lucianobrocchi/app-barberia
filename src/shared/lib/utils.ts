import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatCurrency(amount: number, currency = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

/** Formatea un precio como "$4.500" (punto de miles, sin decimales). */
export function formatPrice(amount: number): string {
  return '$' + Math.round(amount).toLocaleString('es-AR', { maximumFractionDigits: 0 });
}

export function formatDate(date: string | Date, pattern = 'dd/MM/yyyy'): string {
  return format(new Date(date), pattern, { locale: es });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy 'a las' HH:mm", { locale: es });
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Iniciales (máx 2) de un nombre. */
export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** Paleta para avatares (cuando no hay color asignado por barbería). */
const AVATAR_PALETTE = [
  '#C9A84C', '#6366f1', '#ec4899', '#14b8a6',
  '#f59e0b', '#3b82f6', '#a855f7', '#22c55e',
];

/** Color determinístico a partir de un id/string (avatar estable, multi-tenant). */
export function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  mercadopago: 'MercadoPago',
  transfer: 'Transferencia',
  other: 'Otro',
};
