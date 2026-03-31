import React from 'react';
import { View, StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';

const MAX_WIDTH = 600;

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Centers content with a max-width on wide (desktop/web) screens.
 * On narrow screens, renders full-width as normal.
 */
export default function WebContainer({ children, style }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width > MAX_WIDTH;

  return (
    <View style={[styles.outer, style]}>
      <View style={[styles.inner, isWide && { maxWidth: MAX_WIDTH }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  inner: {
    flex: 1,
    width: '100%',
  },
});
