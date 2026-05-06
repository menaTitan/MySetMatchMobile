import React from 'react';
import { StyleSheet, View, ViewStyle, StatusBar } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useSport } from '../../context/SportContext';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: Edge[];
  background?: 'page' | 'tint' | 'white' | 'primary';
  statusBarStyle?: 'light' | 'dark' | 'auto';
}

export default function Screen({
  children, style, edges = ['top', 'bottom'], background = 'page', statusBarStyle,
}: Props) {
  const { theme } = useSport();
  const bg =
    background === 'primary' ? theme.primary :
    background === 'white'   ? theme.cardBg   :
    background === 'tint'    ? theme.pageBgTint : theme.pageBg;

  return (
    <>
      <StatusBar barStyle={statusBarStyle === 'light' || background === 'primary' ? 'light-content' : 'dark-content'} />
      <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: bg }, style]}>
        {children}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
