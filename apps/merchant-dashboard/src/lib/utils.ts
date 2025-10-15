import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function shortenHash(hash: string, chars: number = 6): string {
  if (!hash) return '';
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    pending: 'status-pending',
    processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    confirmed: 'status-success',
    finalized: 'status-success',
    failed: 'status-failed',
    cancelled: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };
  return statusColors[status.toLowerCase()] || 'bg-gray-500/10 text-gray-400';
}
