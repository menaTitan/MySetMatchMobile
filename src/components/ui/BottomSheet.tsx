import React from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, ViewStyle, StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Hint shown under the title — keep short. */
  subtitle?: string;
  /** When true, the sheet grows to ~90% of the screen (good for forms). */
  tall?: boolean;
  /** Wrap children in a ScrollView. Defaults to true. Disable for FlatList content. */
  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Standard bottom sheet — handle bar, gradient-free header with title + close,
 * keyboard-aware. The single source of truth for modal sheets across the app
 * (filter sheets, picker lists, edit forms, refunds, etc.).
 */
export default function BottomSheet({
  visible, onClose, title, subtitle, tall, scrollable = true, contentStyle, children,
}: Props) {
  const { theme } = useSport();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.border,
                borderTopWidth: 1,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                maxHeight: tall ? '92%' : '78%',
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.handle, { backgroundColor: theme.borderStrong }]} />
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.h2, { color: theme.textPrimary, textTransform: 'uppercase', letterSpacing: 0.6 }]}>{title}</Text>
                {subtitle ? (
                  <Text style={[typography.small, { color: theme.textMuted, marginTop: 2 }]}>{subtitle}</Text>
                ) : null}
              </View>
              <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]} hitSlop={8}>
                <Ionicons name="close" size={18} color={theme.textSecondary} />
              </Pressable>
            </View>

            {scrollable ? (
              <ScrollView
                contentContainerStyle={[styles.body, contentStyle]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>
            ) : (
              <View style={[styles.body, contentStyle]}>{children}</View>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingBottom: spacing.xl,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 36, height: 3, borderRadius: 2,
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
