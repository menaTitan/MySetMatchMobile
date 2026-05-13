import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

/* ── Root tab navigator ─────────────────────────────────────────────────── */
export type RootTabParamList = {
  Home: undefined;
  Play: undefined;
  Community: undefined;
  Market: undefined;
  Profile: undefined;
};

/* ── Play stack ─────────────────────────────────────────────────────────── */
export type PlayStackParamList = {
  PlayHome: undefined;
  TournamentDetail: { id: string };
  TournamentArchive: undefined;
  TournamentPayments: { tournamentId: string; name?: string };
  TournamentWinners: { tournamentId: string; name?: string };
  Participants: { tournamentId: string; name?: string };
  Brackets: { tournamentId: string; name?: string };
  BracketEditor: { tournamentId: string; name?: string };
  ScoreEntry: { matchId: string };
  LiveScore: { tournamentId?: string; tournamentName?: string } | undefined;
  StartNewGame: undefined;
  MatchHistory: { playerId?: string } | undefined;
  CreateTournament: { id?: string; edit?: boolean } | undefined;
  ManageTournament: { id: string; name?: string };
  AddPlayer: { tournamentId: string; name?: string };
  PublicRegistration: { tournamentId?: string; tournamentName?: string } | undefined;
  RegistrationSuccess: { registrationId?: string; tournamentName?: string } | undefined;
};

/* ── Community stack ────────────────────────────────────────────────────── */
export type CommunityStackParamList = {
  CommunityHome: undefined;
  GroupDetail: { groupId: string; groupName: string };
  GroupMembers: { groupId: string; name?: string };
  Invitations: undefined;
  ChatList: undefined;
  ChatRoom: { roomId: string; title?: string };
  NewChat: undefined;
  NewGroupChat: undefined;
  ChatParticipants: { roomId: string; title?: string };
  Reactions: { postId: string };
};

/* ── Marketplace stack ──────────────────────────────────────────────────── */
export type MarketplaceStackParamList = {
  MarketplaceHome: undefined;
  MyListings: undefined;
  EditListing: { id: string };
  ListingDetail: { id: string };
};

/* ── Profile stack ──────────────────────────────────────────────────────── */
export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  Assistant: undefined;
  MatchHistory: { playerId?: string } | undefined;
  AdminHome: undefined;
  AdminUsers: undefined;
  AdminEditUser: { userId: string };
  AdminPayments: undefined;
  AdminTournaments: undefined;
  AdminAnalytics: undefined;
  AdminLocations: undefined;
  AdminDebug: undefined;
  PaymentHistory: undefined;
  About: undefined;
  Privacy: undefined;
  Terms: undefined;
  Refunds: undefined;
  Rules: undefined;
  Contact: undefined;
};

/* ── Home stack ─────────────────────────────────────────────────────────── */
export type HomeStackParamList = {
  HomeFeed: undefined;
  MatchHistory: { playerId?: string } | undefined;
};

/* ── Auth stack ─────────────────────────────────────────────────────────── */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email?: string; token?: string } | undefined;
  ConfirmEmail: { userId: string; token: string };
  CreateProfile: undefined;
};

/* ── Screen prop helpers ────────────────────────────────────────────────── */
export type PlayScreenProps<K extends keyof PlayStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<PlayStackParamList, K>,
    BottomTabScreenProps<RootTabParamList>
  >;

export type CommunityScreenProps<K extends keyof CommunityStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<CommunityStackParamList, K>,
    BottomTabScreenProps<RootTabParamList>
  >;

export type MarketplaceScreenProps<K extends keyof MarketplaceStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<MarketplaceStackParamList, K>,
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
