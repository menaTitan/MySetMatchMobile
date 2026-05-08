import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';

interface TapProps {
  onPress: () => void;
  placeholder?: string;
  value?: never;
  onChangeText?: never;
  autoFocus?: never;
  surface?: 'header' | 'page';
}

interface InputProps {
  onPress?: never;
  placeholder?: string;
  value: string;
  onChangeText: (v: string) => void;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  surface?: 'header' | 'page';
}

type Props = TapProps | InputProps;

/**
 * Two modes:
 * - Tap-target (default in headers): renders a Pressable that opens SearchScreen.
 * - Real input (used inside content): renders a TextInput.
 */
export default function SearchBar(props: Props) {
  const { theme } = useSport();
  const placeholder = props.placeholder ?? 'Search players, tournaments, groups…';
  const surface = props.surface ?? (props.onPress ? 'header' : 'page');

  const isHeader = surface === 'header';
  const wrapStyle = isHeader
    ? { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }
    : { backgroundColor: theme.cardBg, borderColor: theme.border };
  const iconColor = isHeader ? 'rgba(250,250,250,0.7)' : theme.textMuted;
  const textColor = isHeader ? 'rgba(250,250,250,0.95)' : theme.textPrimary;
  const placeholderColor = isHeader ? 'rgba(250,250,250,0.55)' : theme.textMuted;

  // Input mode
  if ('onChangeText' in props && props.onChangeText) {
    return (
      <View style={[styles.wrap, wrapStyle]}>
        <Ionicons name="search" size={16} color={iconColor} />
        <TextInput
          value={props.value}
          onChangeText={props.onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          autoFocus={props.autoFocus}
          onSubmitEditing={props.onSubmitEditing}
          style={[typography.smallStrong, { flex: 1, color: textColor, padding: 0 }]}
          returnKeyType="search"
        />
        {props.value ? (
          <Pressable onPress={() => props.onChangeText('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={iconColor} />
          </Pressable>
        ) : null}
      </View>
    );
  }

  // Tap-target mode
  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [styles.wrap, wrapStyle, pressed && { opacity: 0.8 }]}
    >
      <Ionicons name="search" size={16} color={iconColor} />
      <Text style={[typography.smallStrong, { color: placeholderColor, flex: 1 }]} numberOfLines={1}>
        {placeholder}
      </Text>
      {isHeader ? (
        <View style={[styles.hint, { backgroundColor: theme.accent }]}>
          <Ionicons name="sparkles" size={10} color={theme.textInverse} />
          <Text style={[styles.hintText, { color: theme.textInverse }]}>ALL</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.xs,
  },
  hintText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
