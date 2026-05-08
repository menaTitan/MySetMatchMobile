import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../context/SportContext';
import { typography } from '../theme';

import DashboardScreen from '../screens/main/DashboardScreen';
import PlayHubScreen from '../screens/main/PlayHubScreen';
import TournamentDetailScreen from '../screens/main/TournamentDetailScreen';
import TournamentArchiveScreen from '../screens/main/TournamentArchiveScreen';
import TournamentPaymentsScreen from '../screens/main/TournamentPaymentsScreen';
import TournamentWinnersScreen from '../screens/main/TournamentWinnersScreen';
import ParticipantsScreen from '../screens/main/ParticipantsScreen';
import BracketsScreen from '../screens/main/BracketsScreen';
import BracketEditorScreen from '../screens/main/BracketEditorScreen';
import ScoreEntryScreen from '../screens/main/ScoreEntryScreen';
import StartNewGameScreen from '../screens/main/StartNewGameScreen';
import LiveScoreScreen from '../screens/main/LiveScoreScreen';
import MatchHistoryScreen from '../screens/main/MatchHistoryScreen';
import CommunityScreen from '../screens/main/CommunityScreen';
import GroupDetailScreen from '../screens/main/GroupDetailScreen';
import GroupMembersScreen from '../screens/main/GroupMembersScreen';
import ChatListScreen from '../screens/main/ChatListScreen';
import ChatRoomScreen from '../screens/main/ChatRoomScreen';
import NewChatScreen from '../screens/main/NewChatScreen';
import NewGroupChatScreen from '../screens/main/NewGroupChatScreen';
import ChatParticipantsScreen from '../screens/main/ChatParticipantsScreen';
import ReactionsScreen from '../screens/main/ReactionsScreen';
import MarketplaceScreen from '../screens/main/MarketplaceScreen';
import MyListingsScreen from '../screens/main/MyListingsScreen';
import EditListingScreen from '../screens/main/EditListingScreen';
import ListingDetailScreen from '../screens/main/ListingDetailScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import AssistantScreen from '../screens/main/AssistantScreen';
import SearchScreen from '../screens/main/SearchScreen';
import PlayerProfileScreen from '../screens/main/PlayerProfileScreen';
import HeadToHeadScreen from '../screens/main/HeadToHeadScreen';
import CreateTournamentScreen from '../screens/main/CreateTournamentScreen';
import ManageTournamentScreen from '../screens/main/ManageTournamentScreen';
import AddPlayerScreen from '../screens/main/AddPlayerScreen';
import AdminHomeScreen from '../screens/main/AdminHomeScreen';
import AdminUsersScreen from '../screens/main/AdminUsersScreen';
import AdminEditUserScreen from '../screens/main/AdminEditUserScreen';
import AdminPaymentsScreen from '../screens/main/AdminPaymentsScreen';
import AdminTournamentsScreen from '../screens/main/AdminTournamentsScreen';
import AdminAnalyticsScreen from '../screens/main/AdminAnalyticsScreen';
import AdminLocationsScreen from '../screens/main/AdminLocationsScreen';
import AdminDebugScreen from '../screens/main/AdminDebugScreen';
import PaymentHistoryScreen from '../screens/main/PaymentHistoryScreen';
import StaticContentScreen from '../screens/main/StaticContentScreen';
import ContactScreen from '../screens/main/ContactScreen';
import PublicRegistrationScreen from '../screens/main/PublicRegistrationScreen';
import RegistrationSuccessScreen from '../screens/main/RegistrationSuccessScreen';
import ErrorBoundary from '../components/ErrorBoundary';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const PlayStack = createNativeStackNavigator();
const CommunityStack = createNativeStackNavigator();
const MarketStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function makeHeaderStyle(_primary: string) {
  // Headers sit on the near-black base; we drop the heavy primary fill in favor
  // of a flat surface with a 1px bottom border via headerShadowVisible: false.
  return {
    headerStyle: { backgroundColor: '#101014' },
    headerTintColor: '#FAFAFA',
    headerTitleStyle: {
      fontWeight: '400' as const,
      fontSize: 18,
      letterSpacing: 1.2,
      fontFamily: typography.display.fontFamily,
      textTransform: 'uppercase' as const,
    },
    headerShadowVisible: false,
  };
}

function HomeNav() {
  const { theme } = useSport();
  return (
    <ErrorBoundary scope="Home">
      <HomeStack.Navigator screenOptions={makeHeaderStyle(theme.primary)}>
        <HomeStack.Screen name="HomeFeed" component={DashboardScreen} options={{ headerShown: false }} />
        <HomeStack.Screen name="MatchHistory" component={MatchHistoryScreen} options={{ headerShown: false }} />
      </HomeStack.Navigator>
    </ErrorBoundary>
  );
}

function PlayNav() {
  const { theme } = useSport();
  return (
    <ErrorBoundary scope="Play">
      <PlayStack.Navigator screenOptions={makeHeaderStyle(theme.primary)}>
        <PlayStack.Screen name="PlayHome"             component={PlayHubScreen}              options={{ headerShown: false }} />
        <PlayStack.Screen name="TournamentDetail"     component={TournamentDetailScreen}     options={{ title: 'Tournament' }} />
        <PlayStack.Screen name="TournamentArchive"    component={TournamentArchiveScreen}    options={{ headerShown: false }} />
        <PlayStack.Screen name="TournamentPayments"   component={TournamentPaymentsScreen}   options={{ headerShown: false }} />
        <PlayStack.Screen name="TournamentWinners"    component={TournamentWinnersScreen}    options={{ headerShown: false }} />
        <PlayStack.Screen name="Participants"         component={ParticipantsScreen}         options={{ headerShown: false }} />
        <PlayStack.Screen name="Brackets"             component={BracketsScreen}             options={({ route }: any) => ({ title: route.params?.name ?? 'Brackets' })} />
        <PlayStack.Screen name="BracketEditor"        component={BracketEditorScreen}        options={{ headerShown: false }} />
        <PlayStack.Screen name="ScoreEntry"           component={ScoreEntryScreen}           options={{ title: 'Enter Score' }} />
        <PlayStack.Screen name="LiveScore"            component={LiveScoreScreen}            options={{ headerShown: false }} />
        <PlayStack.Screen name="StartNewGame"         component={StartNewGameScreen}         options={{ headerShown: false }} />
        <PlayStack.Screen name="MatchHistory"         component={MatchHistoryScreen}         options={{ headerShown: false }} />
        <PlayStack.Screen name="CreateTournament"     component={CreateTournamentScreen}     options={{ title: 'New Tournament' }} />
        <PlayStack.Screen name="ManageTournament"     component={ManageTournamentScreen}     options={{ title: 'Manage', headerShown: false }} />
        <PlayStack.Screen name="AddPlayer"            component={AddPlayerScreen}            options={{ headerShown: false }} />
        <PlayStack.Screen name="PublicRegistration"   component={PublicRegistrationScreen}   options={{ headerShown: false }} />
        <PlayStack.Screen name="RegistrationSuccess"  component={RegistrationSuccessScreen}  options={{ headerShown: false }} />
      </PlayStack.Navigator>
    </ErrorBoundary>
  );
}

function CommunityNav() {
  const { theme } = useSport();
  return (
    <ErrorBoundary scope="Community">
      <CommunityStack.Navigator screenOptions={makeHeaderStyle(theme.primary)}>
        <CommunityStack.Screen name="CommunityHome" component={CommunityScreen} options={{ headerShown: false }} />
        <CommunityStack.Screen
          name="GroupDetail"
          component={GroupDetailScreen}
          options={({ route }: any) => ({ title: route.params?.groupName ?? 'Group' })}
        />
        <CommunityStack.Screen name="GroupMembers"      component={GroupMembersScreen}      options={{ headerShown: false }} />
        <CommunityStack.Screen name="ChatList"          component={ChatListScreen}          options={{ headerShown: false }} />
        <CommunityStack.Screen name="ChatRoom"          component={ChatRoomScreen}          options={{ title: 'Chat' }} />
        <CommunityStack.Screen name="NewChat"           component={NewChatScreen}           options={{ title: 'New Message' }} />
        <CommunityStack.Screen name="NewGroupChat"      component={NewGroupChatScreen}      options={{ headerShown: false }} />
        <CommunityStack.Screen name="ChatParticipants"  component={ChatParticipantsScreen}  options={{ headerShown: false }} />
        <CommunityStack.Screen name="Reactions"         component={ReactionsScreen}         options={{ headerShown: false }} />
      </CommunityStack.Navigator>
    </ErrorBoundary>
  );
}

function MarketNav() {
  const { theme } = useSport();
  return (
    <ErrorBoundary scope="Market">
      <MarketStack.Navigator screenOptions={makeHeaderStyle(theme.primary)}>
        <MarketStack.Screen name="MarketplaceHome" component={MarketplaceScreen} options={{ headerShown: false }} />
        <MarketStack.Screen name="MyListings"      component={MyListingsScreen}  options={{ headerShown: false }} />
        <MarketStack.Screen name="EditListing"     component={EditListingScreen} options={{ headerShown: false }} />
        <MarketStack.Screen name="ListingDetail"   component={ListingDetailScreen} options={{ title: 'Listing' }} />
      </MarketStack.Navigator>
    </ErrorBoundary>
  );
}

function ProfileNav() {
  const { theme } = useSport();
  return (
    <ErrorBoundary scope="Profile">
      <ProfileStack.Navigator screenOptions={makeHeaderStyle(theme.primary)}>
        <ProfileStack.Screen name="ProfileHome"        component={ProfileScreen}            options={{ headerShown: false }} />
        <ProfileStack.Screen name="EditProfile"        component={EditProfileScreen}        options={{ title: 'Edit Profile' }} />
        <ProfileStack.Screen name="Assistant"          component={AssistantScreen}          options={{ headerShown: false }} />
        <ProfileStack.Screen name="MatchHistory"       component={MatchHistoryScreen}       options={{ headerShown: false }} />

        <ProfileStack.Screen name="AdminHome"          component={AdminHomeScreen}          options={{ headerShown: false }} />
        <ProfileStack.Screen name="AdminUsers"         component={AdminUsersScreen}         options={{ headerShown: false }} />
        <ProfileStack.Screen name="AdminEditUser"      component={AdminEditUserScreen}      options={{ headerShown: false }} />
        <ProfileStack.Screen name="AdminPayments"      component={AdminPaymentsScreen}      options={{ headerShown: false }} />
        <ProfileStack.Screen name="AdminTournaments"   component={AdminTournamentsScreen}   options={{ headerShown: false }} />
        <ProfileStack.Screen name="AdminAnalytics"     component={AdminAnalyticsScreen}     options={{ headerShown: false }} />
        <ProfileStack.Screen name="AdminLocations"     component={AdminLocationsScreen}     options={{ headerShown: false }} />
        <ProfileStack.Screen name="AdminDebug"         component={AdminDebugScreen}         options={{ headerShown: false }} />

        <ProfileStack.Screen name="PaymentHistory"     component={PaymentHistoryScreen}     options={{ headerShown: false }} />
        <ProfileStack.Screen name="About"              component={StaticContentScreen}      options={{ headerShown: false }} initialParams={{ kind: 'About' }} />
        <ProfileStack.Screen name="Privacy"            component={StaticContentScreen}      options={{ headerShown: false }} initialParams={{ kind: 'Privacy' }} />
        <ProfileStack.Screen name="Terms"              component={StaticContentScreen}      options={{ headerShown: false }} initialParams={{ kind: 'Terms' }} />
        <ProfileStack.Screen name="Refunds"            component={StaticContentScreen}      options={{ headerShown: false }} initialParams={{ kind: 'Refunds' }} />
        <ProfileStack.Screen name="Rules"              component={StaticContentScreen}      options={{ headerShown: false }} initialParams={{ kind: 'Rules' }} />
        <ProfileStack.Screen name="Contact"            component={ContactScreen}            options={{ headerShown: false }} />
      </ProfileStack.Navigator>
    </ErrorBoundary>
  );
}

const TAB_ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
  Home:      { on: 'home',        off: 'home-outline' },
  Play:      { on: 'trophy',      off: 'trophy-outline' },
  Community: { on: 'chatbubbles', off: 'chatbubbles-outline' },
  Market:    { on: 'storefront',  off: 'storefront-outline' },
  Profile:   { on: 'person',      off: 'person-outline' },
};

function TabsNav() {
  const { theme } = useSport();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          const set = TAB_ICONS[route.name] ?? TAB_ICONS.Home;
          const name = focused ? set.on : set.off;
          return (
            <View style={[styles.iconWrap, focused && { backgroundColor: `${theme.accent}1F` }]}>
              <Ionicons name={name} size={focused ? 24 : 22} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.pageBg,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          height: Platform.OS === 'ios' ? 86 : 70,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginTop: -2,
          fontFamily: typography.caption.fontFamily,
        },
        tabBarItemStyle: { paddingVertical: 4 },
        ...makeHeaderStyle(theme.primary),
      })}
    >
      <Tab.Screen name="Home"      component={HomeNav}      options={{ headerShown: false }} />
      <Tab.Screen name="Play"      component={PlayNav}      options={{ headerShown: false }} />
      <Tab.Screen name="Community" component={CommunityNav} options={{ headerShown: false }} />
      <Tab.Screen name="Market"    component={MarketNav}    options={{ headerShown: false }} />
      <Tab.Screen name="Profile"   component={ProfileNav}   options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen name="Main" component={TabsNav} options={{ headerShown: false }} />
      <RootStack.Screen
        name="Search"
        component={SearchScreen}
        options={{ headerShown: false, presentation: 'modal', animation: 'fade_from_bottom' }}
      />
      <RootStack.Screen
        name="PlayerProfile"
        component={PlayerProfileScreen}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="HeadToHead"
        component={HeadToHeadScreen}
        options={({ route }: any) => ({
          title: route.params?.opponentName ? `vs ${route.params.opponentName}` : 'Head to Head',
        })}
      />
      <RootStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 48, height: 32, borderRadius: 4,
    alignItems: 'center', justifyContent: 'center',
  },
});
