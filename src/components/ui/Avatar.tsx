import React from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSport } from '../../context/SportContext';

interface Props {
  name?: string;
  photoUrl?: string;
  size?: number;
  borderColor?: string;
  style?: ViewStyle;
}

export default function Avatar({ name, photoUrl, size = 48, borderColor, style }: Props) {
  const { theme } = useSport();
  const letter = name?.trim().charAt(0).toUpperCase() ?? '?';
  const wrap: ViewStyle = {
    width: size, height: size, borderRadius: size / 2,
    borderWidth: borderColor ? 2 : 0, borderColor: borderColor,
    overflow: 'hidden',
  };
  if (photoUrl) {
    return <View style={[wrap, style]}><Image source={{ uri: photoUrl }} style={{ width: '100%', height: '100%' }} /></View>;
  }
  return (
    <View style={[wrap, styles.center, { backgroundColor: theme.secondary }, style]}>
      <Text style={{ color: '#fff', fontSize: size * 0.4, fontWeight: '800' }}>{letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
