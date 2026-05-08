import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSport } from '../../context/SportContext';
import { navigate } from '../../navigation/navigationRef';

interface Props {
  name?: string;
  photoUrl?: string;
  size?: number;
  borderColor?: string;
  style?: ViewStyle;
  /**
   * Tapping the avatar navigates to that player's profile. Set to omit
   * (or pass an explicit `onPress`) to override.
   */
  playerId?: string;
  /** Custom press handler — overrides the default `playerId` navigation. */
  onPress?: () => void;
}

function openPlayerProfile(playerId: string) {
  // PlayerProfile is registered at the root stack (above the tab navigator).
  navigate('PlayerProfile', { playerId });
}

export default function Avatar({
  name, photoUrl, size = 48, borderColor, style, playerId, onPress,
}: Props) {
  const { theme } = useSport();
  const letter = name?.trim().charAt(0).toUpperCase() ?? '?';
  const wrap: ViewStyle = {
    width: size, height: size, borderRadius: size / 2,
    borderWidth: borderColor ? 2 : 0, borderColor,
    overflow: 'hidden',
  };

  const content = photoUrl ? (
    <View style={[wrap, style]}>
      <Image source={{ uri: photoUrl }} style={{ width: '100%', height: '100%' }} />
    </View>
  ) : (
    <View style={[wrap, styles.center, { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: theme.border }, style]}>
      <Text style={{ color: theme.accent, fontSize: size * 0.42, fontWeight: '800' }}>{letter}</Text>
    </View>
  );

  const press = onPress ?? (playerId ? () => openPlayerProfile(playerId) : undefined);
  if (!press) return content;
  return (
    <Pressable onPress={press} hitSlop={4} style={({ pressed }) => pressed && { opacity: 0.75 }}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
