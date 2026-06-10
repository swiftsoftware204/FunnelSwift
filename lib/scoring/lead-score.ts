import { Contact, Event, LeadTier } from '@/types';

const SOURCE_SCORES: Record<string, number> = {
  demo_missed_call: 20,
  demo_ada: 18,
  demo_ai: 18,
  sms: 15,
  form: 12,
  cold_email: 10,
  fb_ad: 8,
  manual: 5,
  qr: 5,
  external_api: 7,
};

export function calculateLeadScore(contact: Contact, events: Event[]): number {
  let score = 0;

  // Source quality
  if (contact.source) {
    score += SOURCE_SCORES[contact.source] ?? 5;
  }

  // Engagement signals
  const demoViewed = events.some(e => e.event_type === 'demo_viewed');
  const repliedToSMS = events.some(e => e.event_type === 'sms_reply');
  const formComplete = events.some(e => e.event_type === 'form_submitted');
  if (demoViewed) score += 20;
  if (repliedToSMS) score += 15;
  if (formComplete) score += 10;

  // Data completeness
  if (contact.email) score += 5;
  if (contact.phone) score += 5;
  if (contact.business_name) score += 3;
  if (contact.website) score += 2;

  // Recency decay (past 30 days)
  const daysSinceCreated =
    (Date.now() - new Date(contact.created_at).getTime()) / 86400000;
  if (daysSinceCreated > 30) score = Math.floor(score * 0.7);
  if (daysSinceCreated > 60) score = Math.floor(score * 0.5);

  return Math.min(100, score);
}

export function getLeadTier(score: number): LeadTier {
  if (score >= 70) return 'hot';
  if (score >= 45) return 'warm';
  return 'cold';
}

export function getTierColor(tier: LeadTier): string {
  const colors: Record<LeadTier, string> = {
    hot: '#EF4444',
    warm: '#F59E0B',
    cold: '#94A3B8',
  };
  return colors[tier];
}

export function getTierLabel(tier: LeadTier): string {
  const labels: Record<LeadTier, string> = {
    hot: 'Hot Lead',
    warm: 'Warm Lead',
    cold: 'Cold Lead',
  };
  return labels[tier];
}
