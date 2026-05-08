import React from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, typography } from '../../theme';

interface Props {
  visible: boolean;
  photoUrl?: string;
  /** Optional caption shown at the bottom (e.g. player name). */
  caption?: string;
  onClose: () => void;
}

/**
 * Full-screen photo viewer — dark backdrop, contain-fit image, tap anywhere
 * to dismiss. Used to "maximize" a profile photo from anywhere in the app.
 */
export default function PhotoLightbox({ visible, photoUrl, caption, onClose }: Props) {
  if (!photoUrl) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <SafeAreaView style={styles.safe} pointerEvents="box-none">
          <View style={styles.topBar} pointerEvents="box-none">
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.imageWrap} pointerEvents="none">
            <Image source={{ uri: photoUrl }} style={styles.image} resizeMode="contain" />
          </View>

          {caption ? (
            <View style={styles.captionWrap} pointerEvents="none">
              <Text style={[
                typography.display,
                { color: '#fff', fontSize: 20, lineHeight: 24, letterSpacing: 1, textAlign: 'center' },
              ]} numberOfLines={1}>
                {caption}
              </Text>
            </View>
          ) : null}
        </SafeAreaView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row', justifyContent: 'flex-end',
    paddingHorizontal: spacing.base, paddingTop: spacing.sm,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  imageWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.base },
  image: { width: '100%', height: '100%' },
  captionWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, paddingTop: spacing.md },
});
