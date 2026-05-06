import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_THEME, radii, spacing, typography } from '../theme';

interface Props {
  /** Human-friendly label shown in the error message ("Home", "Market", …). */
  scope?: string;
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors inside one part of the app so a crash in (for example)
 * MarketplaceScreen doesn't take down the tab bar and the rest of the app.
 * Sits at the root of each tab's stack.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Keep a trace in Metro for quick local debugging.
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary${this.props.scope ? ':' + this.props.scope : ''}]`, error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    const scope = this.props.scope ?? 'this screen';
    return (
      <View style={[styles.wrap, { backgroundColor: DEFAULT_THEME.pageBg }]}>
        <View style={[styles.iconBox, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
          <Ionicons name="warning" size={30} color={DEFAULT_THEME.dangerRed} />
        </View>
        <Text style={[typography.h3, { color: DEFAULT_THEME.textPrimary, textAlign: 'center' }]}>
          Something went wrong
        </Text>
        <Text style={[typography.small, { color: DEFAULT_THEME.textMuted, textAlign: 'center', maxWidth: 320 }]}>
          {`${scope} crashed unexpectedly. Tap below to try again, or switch to another tab.`}
        </Text>
        <Pressable
          onPress={this.reset}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: DEFAULT_THEME.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="refresh" size={14} color="#fff" />
          <Text style={[typography.smallStrong, { color: '#fff' }]}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center', justifyContent: 'center',
    padding: spacing.xl, gap: spacing.sm,
  },
  iconBox: {
    width: 72, height: 72, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.base, paddingVertical: 10,
    borderRadius: radii.pill,
    marginTop: spacing.md,
  },
});
