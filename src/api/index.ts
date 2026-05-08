// Barrel — re-exports every domain API module so callers can keep using
// `import { tournamentsApi } from '../../api'` without per-domain paths.

export { default as api } from './client';
export { authApi }          from './auth';
export { sportsApi }        from './sports';
export { playerApi }        from './players';
export type { PublicPlayerProfile, RatingHistoryPoint, HeadToHead } from './players';
export { tournamentsApi }   from './tournaments';
export type {
  CreateTournamentPayload, RegistrationRow,
  PlayerSearchRow, TournamentPaymentRow, TournamentWinner,
} from './tournaments';
export { matchesApi }       from './matches';
export type { PlayerForMatchRow, LiveGameRow } from './matches';
export { leaderboardApi }   from './leaderboard';
export { feedApi, REACTIONS, toReactionInt } from './feed';
export type { ReactionKind, ReactionsBreakdown, ReactionUser, MentionUser, PostVisibility } from './feed';
export { marketplaceApi }   from './marketplace';
export type { UpdateListingPayload } from './marketplace';
export { privateGroupsApi } from './privateGroups';
export type { GroupMember } from './privateGroups';
export { chatApi }          from './chat';
export type { ChatParticipantDto, ChatRoomDto, ChatMessageDto, SuggestedUser } from './chat';
export { searchApi }        from './search';
export type { SearchResults } from './search';
export { locationsApi }     from './locations';
export { paymentApi }       from './payments';
export type { PaymentRow }  from './payments';
export { aiChatApi }        from './aiChat';
export type { AIMessage }   from './aiChat';
export { pushApi }          from './push';
export { adminApi }         from './admin';
export type {
  AdminStats, AdminUser, AdminUserDetail, AdminPayment,
  AnalyticsResponse, AdminTournamentRow, CountryRow, RegionRow, CityRow,
} from './admin';
export { contactApi }       from './contact';
