import React from 'react';
import { Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

/**
 * Renders a sport icon from the server's FontAwesome class strings
 * (e.g. "fas fa-table-tennis-paddle-ball") or an emoji fallback.
 */
export default function SportIcon({
  icon,
  size = 16,
  color = '#fff',
}: {
  icon?: string;
  size?: number;
  color?: string;
}) {
  if (!icon) return null;
  const trimmed = icon.trim();

  // Emoji or non-FA string — render directly as text
  if (!trimmed.startsWith('fa')) {
    return <Text style={{ fontSize: size }}>{trimmed}</Text>;
  }
  const match = trimmed.match(/fa-([a-z0-9-]+)/i);
  const name = match ? match[1] : 'circle';

  // Remap web (FA6) names to FA5 mobile equivalents. Anything not in this
  // table that doesn't exist in FA5 falls through to the catch handler below
  // and renders the bullet glyph instead of warning forever.
  const REMAP: Record<string, string> = {
    'table-tennis-paddle-ball': 'table-tennis',
    'racquet': 'table-tennis',
    'paddle-ball': 'table-tennis',
    'baseball-bat-ball': 'baseball-ball',
    // FA6 → FA5 sport-icon swaps used by the backend
    'feather-pointed': 'feather',
    'circle-dot': 'dot-circle',
  };
  const iconName = (REMAP[name] ?? name) as any;

  try {
    return <FontAwesome5 name={iconName} size={size} color={color} solid />;
  } catch {
    return <Text style={{ fontSize: size, color }}>●</Text>;
  }
}
