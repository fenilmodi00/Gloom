/**
 * Outfit Board Screen
 *
 * Example usage of the OutfitBoard component.
 * Displays clothing items in a fashion flat-lay moodboard style.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native';
import { Stack } from 'expo-router/stack';

import { OutfitBoard, useOutfitSlots } from '@/components/outfit-board';

export default function OutfitScreen() {
  const slots = useOutfitSlots();

  return (
    <>
      <Stack.Screen options={{ title: 'Outfit Board' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.container}
      >
        <View style={styles.boardWrapper}>
          <OutfitBoard
            top={slots.top}
            bottom={slots.bottom}
            shoes={slots.shoes}
            accessory={slots.accessory}
          />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: '#E8E5E0',
  },
  boardWrapper: {
    width: '100%',
    alignItems: 'center',
  },
});
