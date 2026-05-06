import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useSport } from '../context/SportContext';
import { spacing, typography } from '../theme';
import type { RatingHistoryPoint } from '../api/players';

interface Props {
  points: RatingHistoryPoint[];
  height?: number;
}

/**
 * Lightweight sparkline-style rating chart. Uses expo-bundled react-native-svg,
 * no third-party chart library required. Renders a smoothed line + area fill
 * + endpoint dot. Shows a friendly empty state if there are fewer than 2 points.
 */
export default function RatingChart({ points, height = 140 }: Props) {
  const { theme } = useSport();
  const width = Dimensions.get('window').width - spacing.base * 2 - spacing.base * 2;

  if (!points || points.length < 2) {
    return (
      <View style={[styles.empty, { height, backgroundColor: theme.pageBgTint }]}>
        <Text style={[typography.small, { color: theme.textMuted }]}>
          Not enough match data yet for a chart.
        </Text>
      </View>
    );
  }

  const padX = 8;
  const padY = 16;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const ratings = points.map((p) => p.rating);
  const min = Math.min(...ratings);
  const max = Math.max(...ratings);
  const range = Math.max(1, max - min);

  const x = (i: number) => padX + (i / (points.length - 1)) * chartW;
  const y = (r: number) => padY + chartH - ((r - min) / range) * chartH;

  // Build a smooth cubic curve through the points (Catmull–Rom → Bezier).
  let d = `M ${x(0)} ${y(points[0].rating)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)].rating;
    const p1 = points[i].rating;
    const p2 = points[i + 1].rating;
    const p3 = points[Math.min(points.length - 1, i + 2)].rating;
    const cp1x = x(i) + (x(i + 1) - x(Math.max(0, i - 1))) / 6;
    const cp1y = y(p1) + (y(p2) - y(p0)) / 6;
    const cp2x = x(i + 1) - (x(Math.min(points.length - 1, i + 2)) - x(i)) / 6;
    const cp2y = y(p2) - (y(p3) - y(p1)) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x(i + 1)} ${y(p2)}`;
  }
  const area = `${d} L ${x(points.length - 1)} ${padY + chartH} L ${x(0)} ${padY + chartH} Z`;

  const last = points[points.length - 1];
  const first = points[0];
  const totalDelta = last.rating - first.rating;

  return (
    <View>
      <View style={styles.headerRow}>
        <View>
          <Text style={[typography.caption, { color: theme.textMuted }]}>CURRENT</Text>
          <Text style={[typography.h1, { color: theme.primary, fontSize: 28, letterSpacing: -0.3 }]}>
            {last.rating}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[typography.caption, { color: theme.textMuted }]}>LAST {points.length} MATCHES</Text>
          <Text style={[
            typography.bodyStrong,
            { color: totalDelta >= 0 ? theme.successGreen : theme.dangerRed },
          ]}>
            {totalDelta >= 0 ? '▲' : '▼'} {Math.abs(totalDelta)}
          </Text>
        </View>
      </View>

      <Svg width={width} height={height}>
        <Defs>
          <SvgGradient id="ratingFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.accent} stopOpacity="0.4" />
            <Stop offset="1" stopColor={theme.accent} stopOpacity="0" />
          </SvgGradient>
        </Defs>

        {/* baseline */}
        <Line
          x1={padX}
          x2={padX + chartW}
          y1={padY + chartH}
          y2={padY + chartH}
          stroke={theme.divider}
          strokeWidth={1}
        />

        <Path d={area} fill="url(#ratingFill)" />
        <Path d={d} stroke={theme.accent} strokeWidth={2.5} fill="none" strokeLinecap="round" />

        {/* endpoint dot */}
        <Circle cx={x(points.length - 1)} cy={y(last.rating)} r={5} fill={theme.accent} stroke="#fff" strokeWidth={2} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
});
