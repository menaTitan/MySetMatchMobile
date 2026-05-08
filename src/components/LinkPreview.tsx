import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { WebView } from 'react-native-webview';
import { useSport } from '../context/SportContext';
import { radii, spacing, typography } from '../theme';
import { getDisplayHost, getYouTubeId, getYouTubeThumbnail } from '../utils/linkPreview';

interface Props {
  url: string;
  /** When false, hides the close (X) button — used in the post feed. */
  onRemove?: () => void;
}

/**
 * Inline link preview card. YouTube URLs render the video thumbnail with a
 * play overlay; everything else falls back to a compact "site card" with the
 * link icon and hostname. Tapping anywhere opens the URL in the in-app browser.
 */
export default function LinkPreview({ url, onRemove }: Props) {
  const { theme } = useSport();
  const ytId = getYouTubeId(url);
  const host = getDisplayHost(url);
  const [playing, setPlaying] = useState(false);

  const open = () => { WebBrowser.openBrowserAsync(url).catch(() => {}); };

  if (ytId) {
    return (
      <View style={[
        styles.ytWrap,
        { borderColor: theme.border, backgroundColor: theme.cardBg },
      ]}>
        <View style={styles.ytThumbWrap}>
          {playing ? (
            <WebView
              style={styles.ytThumb}
              source={{
                // youtube-nocookie.com is YouTube's privacy-enhanced embed
                // domain — it doesn't tie playback to the viewer's signed-in
                // YouTube account, which avoids the "your account is being
                // used in another location" pause when the same account has
                // video playing on another device/tab.
                // playsinline=1 keeps it inside the player on iOS instead of
                // hijacking to fullscreen; modestbranding hides the YT logo.
                uri: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&playsinline=1&modestbranding=1&rel=0`,
              }}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={['*']}
              setSupportMultipleWindows={false}
            />
          ) : (
            <Pressable onPress={() => setPlaying(true)} style={StyleSheet.absoluteFillObject}>
              <Image
                source={{ uri: getYouTubeThumbnail(ytId) }}
                style={styles.ytThumb}
                resizeMode="cover"
              />
              <View style={styles.ytPlayOverlay}>
                <View style={styles.ytPlayCircle}>
                  <Ionicons name="play" size={22} color="#fff" style={{ marginLeft: 3 }} />
                </View>
              </View>
              <View style={styles.ytBadge}>
                <Ionicons name="logo-youtube" size={11} color="#fff" />
                <Text style={styles.ytBadgeText}>YOUTUBE</Text>
              </View>
            </Pressable>
          )}
        </View>
        <View style={styles.ytFooter}>
          <Pressable onPress={open} hitSlop={4} style={{ flex: 1 }}>
            <Text
              style={[typography.caption, { color: theme.textMuted, fontSize: 10 }]}
              numberOfLines={1}
            >
              {host}
            </Text>
          </Pressable>
          {playing ? (
            <Pressable onPress={() => setPlaying(false)} hitSlop={6} style={styles.ytFooterBtn}>
              <Ionicons name="close" size={12} color={theme.textMuted} />
              <Text style={[typography.caption, { color: theme.textMuted, fontSize: 10 }]}>
                CLOSE
              </Text>
            </Pressable>
          ) : null}
        </View>
        {onRemove && !playing ? <RemoveBtn onPress={onRemove} /> : null}
      </View>
    );
  }

  return (
    <Pressable
      onPress={open}
      style={({ pressed }) => [
        styles.linkWrap,
        { borderColor: theme.border, backgroundColor: theme.cardBg },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={[styles.linkIconBox, { backgroundColor: theme.featureBg, borderColor: `${theme.accent}40` }]}>
        <Ionicons name="link-outline" size={18} color={theme.accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[typography.overline, { color: theme.accent, fontSize: 10 }]} numberOfLines={1}>
          {host.toUpperCase()}
        </Text>
        <Text style={[typography.smallStrong, { color: theme.textPrimary, fontSize: 13 }]} numberOfLines={2}>
          {url}
        </Text>
      </View>
      <Ionicons name="open-outline" size={14} color={theme.textMuted} />
      {onRemove ? <RemoveBtn onPress={onRemove} /> : null}
    </Pressable>
  );
}

function RemoveBtn({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.removeBtn}>
      <Ionicons name="close" size={12} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // YouTube
  ytWrap: {
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  ytThumbWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  ytThumb: { width: '100%', height: '100%' },
  ytPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ytPlayCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,0,0,0.92)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  ytBadge: {
    position: 'absolute',
    top: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6, paddingVertical: 3,
    borderRadius: radii.xs,
  },
  ytBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  ytFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
  },
  ytFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Generic link
  linkWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    position: 'relative',
  },
  linkIconBox: {
    width: 36, height: 36,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  // Shared
  removeBtn: {
    position: 'absolute',
    top: 6, right: 6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
});
