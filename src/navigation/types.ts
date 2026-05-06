import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

/* ── Root tab navigator ─────────────────────────────────────────────────── */
export type RootTabParamList = {
  Dashboard: undefined;
  Tournaments: undefined;
  Matches: undefined;
  Community: undefined;
  Leaderboard: undefined;
  Marketplace: undefined;
  Profile: undefined;
};

/* ── Tournaments stack ──────────────────────────────────────────────────── */
export type TournamentsStackParamList = {
  TournamentList: undefined;
  TournamentDetail: { id: string };
  Brackets: { tournamentId: string; name?: string };
};

/* ── Matches stack ──────────────────────────────────────────────────────── */
export type MatchesStackParamList = {
  MatchList: undefined;
  ScoreEntry: { matchId: string };
  LiveScore: undefined;
};

/* ── Community stack (includes chat) ────────────────────────────────────── */
export type CommunityStackParamList = {
  CommunityHome: undefined;
  GroupDetail: { groupId: string; groupName: string };
  ChatList: undefined;
  ChatRoom: { roomId: string; title?: string };
  NewChat: undefined;
};

/* ── Marketplace stack ──────────────────────────────────────────────────── */
export type MarketplaceStackParamList = {
  MarketplaceHome: undefined;
};

/* ── Profile stack ──────────────────────────────────────────────────────── */
export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  Assistant: undefined;
};

/* ── Auth stack ─────────────────────────────────────────────────────────── */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

/* ── Screen prop helpers ────────────────────────────────────────────────── */
export type TournamentsScreenProps<K extends keyof TournamentsStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<TournamentsStackParamList, K>,
    BottomTabScreenProps<RootTabParamList>
  >;

export type MatchesScreenProps<K extends keyof MatchesStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<MatchesStackParamList, K>,
    BottomTabScreenProps<RootTabParamList>
  >;

export type CommunityScreenProps<K extends keyof CommunityStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<CommunityStackParamList, K>,
    BottomTabScreenProps<RootTabParamList>
  >;

export type ProfileScreenProps<K extends keyof ProfileStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ProfileStackParamList, K>,
    BottomTabScreenProps<RootTabParamList>
  >;

export type AuthScreenProps<K extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, K>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootTabParamList {}
  }
}
