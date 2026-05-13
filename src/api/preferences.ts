import api from './client';

export interface UserPreferences {
  // Email
  emailTournamentAnnouncements: boolean;
  emailMatchResults: boolean;
  emailPostComments: boolean;
  emailPostReactions: boolean;
  emailDirectMessages: boolean;
  emailClubInvitations: boolean;
  emailMarketing: boolean;
  // Push
  pushMatchResults: boolean;
  pushPostComments: boolean;
  pushPostReactions: boolean;
  pushDirectMessages: boolean;
  pushClubInvitations: boolean;
  pushTournamentReminders: boolean;
  // Privacy
  showOnLeaderboards: boolean;
  allowDirectMessagesFromAnyone: boolean;
  showLocationOnProfile: boolean;
  showEquipmentOnProfile: boolean;
}

export const preferencesApi = {
  get: () => api.get<UserPreferences>('/players/me/preferences'),
  /** PATCH semantics — send only the keys you want to change. */
  update: (patch: Partial<UserPreferences>) =>
    api.patch<UserPreferences>('/players/me/preferences', patch),
};
