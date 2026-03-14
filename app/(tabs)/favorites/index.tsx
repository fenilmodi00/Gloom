import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.emoji}>♡</Text>
        <Text style={styles.title}>No saved items yet</Text>
        <Text style={styles.subtitle}>
          Save your favorite outfits and inspiration
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2EE',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: '600',
    color: '#1A1A1A',
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
    color: '#2D2F1D',
    opacity: 0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: 8,
  },
});
