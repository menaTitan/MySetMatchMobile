import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radii, spacing, typography } from '../../theme';

export type ToastKind = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  duration?: number;
}

type Show = (message: string, kind?: ToastKind, duration?: number) => void;

const ToastContext = createContext<{ show: Show } | null>(null);

// Module-level dispatcher so non-React code (e.g. axios interceptors) can push toasts.
let externalShow: Show | null = null;
export function emitToast(message: string, kind: ToastKind = 'info', duration?: number) {
  externalShow?.(message, kind, duration);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const show: Show = useCallback((message, kind = 'info', duration = 3500) => {
    const id = nextId.current++;
    setItems((prev) => [...prev, { id, kind, message, duration }]);
    if (duration > 0) {
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  useEffect(() => {
    externalShow = show;
    return () => { if (externalShow === show) externalShow = null; };
  }, [show]);

  const dismiss = (id: number) => setItems((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <SafeAreaView edges={['top']} pointerEvents="box-none" style={styles.layer}>
        <View style={styles.stack} pointerEvents="box-none">
          {items.map((t) => (
            <ToastRow key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </View>
      </SafeAreaView>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx?.show ?? ((msg: string) => console.warn('[toast]', msg));
}

function ToastRow({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }),
    ]).start();
  }, []);

  const palette = getPalette(toast.kind);

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: palette.bg, opacity, transform: [{ translateY }] },
      ]}
    >
      <Ionicons name={palette.icon} size={18} color="#fff" />
      <Text style={[typography.smallStrong, { color: '#fff', flex: 1 }]} numberOfLines={3}>
        {toast.message}
      </Text>
      <Pressable onPress={onDismiss} hitSlop={8}>
        <Ionicons name="close" size={16} color="rgba(255,255,255,0.8)" />
      </Pressable>
    </Animated.View>
  );
}

function getPalette(kind: ToastKind): { bg: string; icon: keyof typeof Ionicons.glyphMap } {
  switch (kind) {
    case 'success': return { bg: '#16a34a', icon: 'checkmark-circle' };
    case 'error':   return { bg: '#dc2626', icon: 'alert-circle' };
    case 'warning': return { bg: '#d97706', icon: 'warning' };
    default:        return { bg: '#2563eb', icon: 'information-circle' };
  }
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 9999,
  },
  stack: {
    paddingHorizontal: spacing.base,
    gap: spacing.xs + 2,
    paddingTop: spacing.sm,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
