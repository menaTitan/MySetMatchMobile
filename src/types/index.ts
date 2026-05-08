export interface Sport {
  id: string;
  name: string;
  slug: string;
  icon: string;
  winningScore: number;
  defaultBestOf: number;
  winByPoints: number;
  supportsDoubles: boolean;
}

export interface Player {
  id: string;
  name: string;
  clubName?: string;
  profilePhotoUrl?: string;
  country?: string;
  city?: string;
  globalRating: number;
  countryRating: number;
  handedness?: string;
  playStyle?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  player: Player;
}

export interface SportRating {
  sportId: string;
  sportName: string;
  sportIcon: string;
  globalRating: number;
  countryRating: number;
}

export interface MatchSummary {
  id: string;
  opponentName: string;
  opponentId: string;
  opponentPhotoUrl?: string;
  won: boolean;
  mySets: number;
  opponentSets: number;
  scoreDisplay?: string;
  date?: string;
  tournamentName: string;
  stage: string;
  sportName?: string;
  sportIcon?: string;
}

export interface TournamentSummary {
  id: string;
  name: string;
  startDate: string;
  city?: string;
  country?: string;
  sportName?: string;
  sportIcon?: string;
  type: string;
  registeredCount: number;
  maxPlayers?: number;
  isRegistered: boolean;
}

export interface TournamentDetail extends TournamentSummary {
  description?: string;
  endDate?: string;
  entryFee?: number;
  venueAddress?: string;
  status: string;
  isDoubles: boolean;
  registrations: Player[];
  organizerId?: string;
  isOrganizer?: boolean;
}

export interface Dashboard {
  player: Player;
  displayRating: number;
  globalRank: number;
  countryRank: number;
  cityRank: number;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  recentForm: string[];
  recentMatches: MatchSummary[];
  upcomingTournaments: TournamentSummary[];
  sportRatings: SportRating[];
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  name: string;
  clubName?: string;
  profilePhotoUrl?: string;
  country?: string;
  city?: string;
  rating: number;
  totalMatches: number;
  winRate: number;
}

export interface Comment {
  id: string;
  content: string;
  authorId?: string;
  authorName: string;
  authorPhotoUrl?: string;
  createdDate: string;
  parentCommentId?: string;
  replies?: Comment[];
}

export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  profilePhotoUrl?: string;
  content: string;
  imageUrl?: string;
  sportId?: string;
  sportName?: string;
  likeCount: number;
  commentCount: number;
  myReaction?: string;
  createdDate: string;
  comments: Comment[];
}

export interface FeedResponse {
  items: FeedPost[];
  total: number;
}

export interface MatchPlayer {
  id: string;
  name: string;
}

export interface MatchSet {
  setNumber: number;
  player1Score: number;
  player2Score: number;
}

export interface MatchDetail {
  id: string;
  player1: MatchPlayer | null;
  player2: MatchPlayer | null;
  player1SetsWon: number;
  player2SetsWon: number;
  winnerId?: string;
  status: string;
  stage: string;
  round?: string;
  tournamentName: string;
  tournamentId: string;
  sportName?: string;
  sportIcon?: string;
  scheduledDateTime?: string;
  amPlayer1: boolean;
  sets: MatchSet[];
  defaultBestOf: number;
  winningScore: number;
  winByPoints: number;
}

export interface BracketSet {
  setNumber: number;
  player1Score: number;
  player2Score: number;
}

export interface BracketMatch {
  id: string;
  player1: { id: string; name: string } | null;
  player2: { id: string; name: string } | null;
  player1SetsWon: number;
  player2SetsWon: number;
  winnerId?: string;
  status: string;
  stage?: string;
  round?: string;
  sets: BracketSet[];
}

export interface BracketRound {
  stage: string;
  round: string;
  matches: BracketMatch[];
}

// ── Marketplace ───────────────────────────────────────────────────────────────

export const MARKETPLACE_CATEGORIES = [
  'Paddle', 'Blade', 'Rubber', 'Ball', 'Table', 'Net & Post',
  'Shoes', 'Clothing', 'Bag & Case', 'Training Equipment', 'Accessories', 'Other',
] as const;

export const MARKETPLACE_CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'] as const;

export type MarketplaceCategory = typeof MARKETPLACE_CATEGORIES[number];
export type MarketplaceCondition = typeof MARKETPLACE_CONDITIONS[number];

export interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: MarketplaceCategory;
  condition: MarketplaceCondition;
  brand?: string;
  model?: string;
  imageUrls: string[];
  sellerId: string;
  sellerName: string;
  sellerPhotoUrl?: string;
  city?: string;
  country?: string;
  createdDate: string;
  isMyListing: boolean;
  isSold: boolean;
}

export interface MarketplaceListingsResponse {
  items: MarketplaceListing[];
  total: number;
}

// ── Private Groups ────────────────────────────────────────────────────────────

export interface PrivateGroup {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  postCount: number;
  isAdmin: boolean;
  imageUrl?: string;
  lastPostDate?: string;
}

export interface PrivatePost {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  profilePhotoUrl?: string;
  content: string;
  imageUrl?: string;
  createdDate: string;
  likeCount: number;
  commentCount: number;
  myReaction?: string;
  comments: Comment[];
}

export interface PrivatePostsResponse {
  items: PrivatePost[];
  total: number;
}
