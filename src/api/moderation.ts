import api from './client';

export type ReportableType = 'Post' | 'Comment' | 'User' | 'ChatMessage';

export interface BlockedUser {
  userId: string;
  userName?: string;
  fullName?: string;
  profilePhotoUrl?: string;
  blockedDate: string;
}

export const moderationApi = {
  /** Flag a post / comment / chat message / user for moderator review. */
  report: (data: {
    contentType: ReportableType;
    contentId?: string;
    reportedUserId?: string;
    reason: string;
    notes?: string;
  }) => api.post<{ id: string; reported: true }>('/moderation/report', data),

  /** Hide all content from `userId` and flag them for moderator review. */
  block: (userId: string, reason?: string) =>
    api.post<{ blocked?: true; alreadyBlocked?: true }>('/moderation/block', { userId, reason }),
  unblock: (userId: string) =>
    api.delete(`/moderation/block/${userId}`),
  blocks: () => api.get<BlockedUser[]>('/moderation/blocks'),
};

/** Reasons offered in the Report sheet — kept short for tap-friendly UX. */
export const REPORT_REASONS = [
  'Spam or scam',
  'Harassment or bullying',
  'Hate speech',
  'Sexual or explicit content',
  'Violence or threats',
  'Impersonation',
  'Other',
] as const;
