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
import BracketsScreen from '../screens/main/BracketsScreen';
import ScoreEntryScreen from '../screens/main/ScoreEntryScreen';
import CommunityScreen from '../screens/main/CommunityScreen';
import GroupDetailScreen from '../screens/main/GroupDetailScreen';
import ChatListScreen from '../screens/main/ChatListScreen';
import ChatRoomScreen from '../screens/main/ChatRoomScreen';
import NewChatScreen from '../screens/main/NewChatScreen';
import MarketplaceScreen from '../screens/main/MarketplaceScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import AssistantScreen from '../screens/main/AssistantScreen';
import SearchScreen from '../screens/main/SearchScreen';
import PlayerProfileScreen from '../screens/main/PlayerProfileScreen';
import HeadToHeadScreen from '../screens/main/HeadToHeadScreen';
import CreateTournamentScreen from '../screens/main/CreateTournamentScreen';
import ManageTournamentScreen from '../screens/main/ManageTournamentScreen';
import AdminHomeScreen from '../screens/main/AdminHomeScreen';
import AdminUsersScreen from '../screens/main/AdminUsersScreen';
import AdminPaymentsScreen from '../screens/main/AdminPaymentsScreen';
import PaymentHistoryScreen from '../screens/main/PaymentHistoryScreen';
import ErrorBoundary from '../components/ErrorBoundary';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const PlayStack = createNativeStackNavigator();
const CommunityStack = createNativeStackNavigator();
const MarketStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function makeHeaderStyle(primary: string) {
  return {
    headerStyle: { backgroundColor: primary },
    headerTintColor: '#fff',
    headerTitleStyle: { fontWeight: '800' as const, fontSize: 18, fontFamily: typography.h3.fontFamily },
    headerShadowVisible: false,
  };
}

function HomeNav() {
  const { theme } = useSport();
  return (
    <ErrorBoundary scope="Home">
      <HomeStack.Navigator screenOptions={makeHeaderStyle(theme.primary)}>
        <HomeStack.Screen name="HomeFeed" component={DashboardScreen} options={{ headerShown: false }} />
      </HomeStack.Navigator>
    </ErrorBoundary>
  );
}

function PlayNav() {
  const { theme } = useSport();
  return (
    <ErrorBoundary scope="Play">
      <PlayStack.Navigator screenOptions={makeHeaderStyle(theme.primary)}>
        <PlayStack.Screen name="PlayHome"         component={PlayHubScreen}         options={{ headerShown: false }} />
        <PlayStack.Screen name="TournamentDetail" component={TournamentDetailScreen} options={{ title: 'Tournament' }} />
        <PlayStack.Screen name="Brackets"         component={BracketsScreen}         options={({ route }: any) => ({ title: route.params?.name ?? 'Brackets' })} />
        <PlayStack.Screen name="ScoreEntry"       component={ScoreEntryScreen}       options={{ title: 'Enter Score' }} />
        <PlayStack.Screen name="CreateTournament" component={CreateTournamentScreen} options={{ title: 'New Tournament' }} />
        <PlayStack.Screen name="ManageTournament" component={ManageTournamentScreen} options={{ title: 'Manage', headerShown: false }} />
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
        <CommunityStack.Screen name="ChatList"  component={ChatListScreen}  options={{ headerShown: false }} />
        <CommunityStack.Screen name="ChatRoom"  component={ChatRoomScreen}  options={{ title: 'Chat' }} />
        <CommunityStack.Screen name="NewChat"   component={NewChatScreen}   options={{ title: 'New Message' }} />
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
      </MarketStack.Navigator>
    </ErrorBoundary>
  );
}

function ProfileNav() {
  const { theme } = useSport();
  return (
    <ErrorBoundary scope="Profile">
      <ProfileStack.Navigator screenOptions={makeHeaderStyle(theme.primary)}>
        <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} options={{ headerShown: false }} />
        <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
        <ProfileStack.Screen name="Assistant"   component={AssistantScreen}   options={{ headerShown: false }} />
        <ProfileStack.Screen name="AdminHome"     component={AdminHomeScreen}     options={{ headerShown: false }} />
        <ProfileStack.Screen name="AdminUsers"    component={AdminUsersScreen}    options={{ headerShown: false }} />
        <ProfileStack.Screen name="AdminPayments" component={AdminPaymentsScreen} options={{ headerShown: false }} />
        <ProfileStack.Screen name="PaymentHistory" component={PaymentHistoryScreen} options={{ headerShown: false }} />
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
            <View style={[styles.iconWrap, focused && { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
              <Ionicons name={name} size={focused ? 24 : 22} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
        tabBarStyle: {
          backgroundColor: theme.primary,
          borderTopWidth: 0,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          height: Platform.OS === 'ios' ? 86 : 70,
          elevation: 12,
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
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
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 48, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
});
