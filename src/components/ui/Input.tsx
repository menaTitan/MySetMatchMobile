import React, { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';

interface Props extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  hint?: string;
}

/**
 * Standard text field. Dark surface, cyber-accent focus border.
 */
const Input = forwardRef<TextInput, Props>(function Input(
  {
    label, error, leftIcon, rightIcon, onRightIconPress, containerStyle, hint,
    onFocus, onBlur, ...rest
  }, ref
) {
  const { theme } = useSport();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? theme.dangerRed : focused ? theme.accent : theme.border;

  return (
    <View style={[{ marginBottom: spacing.base }, containerStyle]}>
      {label ? (
        <Text style={[
          typography.overline,
          { color: theme.textSecondary, marginBottom: 6, fontSize: 10, letterSpacing: 1.4 },
        ]}>{label}</Text>
      ) : null}
      <View style={[styles.box, { borderColor, backgroundColor: theme.cardBg, borderRadius: radii.md }]}>
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={18}
            color={focused ? theme.accent : theme.textMuted}
            style={styles.leftIcon}
            // @ts-ignore - pointerEvents is valid on View-based components
            pointerEvents="none"
          />
        ) : null}
        <TextInput
          ref={ref}
          style={[styles.input, { color: theme.textPrimary }]}
          placeholderTextColor={theme.textMuted}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          underlineColorAndroid="transparent"
          {...rest}
        />
        {rightIcon ? (
          <Pressable onPress={onRightIconPress} hitSlop={8} style={styles.rightIcon}>
            <Ionicons name={rightIcon} size={18} color={theme.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.msg, { color: theme.dangerRed }]}>{error}</Text> : null}
      {hint && !error ? <Text style={[styles.msg, { color: theme.textMuted }]}>{hint}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 14,
  },
  leftIcon: { marginRight: 8 },
  rightIcon: { paddingLeft: 8 },
  msg: { ...typography.caption, marginTop: 4, marginLeft: 4 },
});

export default Input;
