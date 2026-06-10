import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function formatPhone(phone: string | null): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

export function getSourceLabel(source: string | null): string {
  const labels: Record<string, string> = {
    form: 'Web Form',
    sms: 'Inbound SMS',
    demo_missed_call: 'Missed Call Demo',
    demo_ada: 'ADA Scan',
    demo_ai: 'AI Agent Demo',
    qr: 'QR Code',
    cold_email: 'Cold Email',
    fb_ad: 'Facebook Ad',
    manual: 'Manual Entry',
    external_api: 'API',
  };
  return source ? labels[source] || source : 'Unknown';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: '#64748B',
    contacted: '#3B82F6',
    qualified: '#F59E0B',
    customer: '#22C55E',
    lost: '#EF4444',
  };
  return colors[status] || '#64748B';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    customer: 'Customer',
    lost: 'Lost',
  };
  return labels[status] || status;
}
