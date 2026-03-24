import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { OutfitBoard, useOutfitStore } from '@/components/outfit-board';

export default function OutfitScreen() {
  const { top, bottom, shoes, accessory } = useOutfitStore();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <OutfitBoard
          top={top}
          bottom={bottom}
          shoes={shoes}
          accessory={accessory}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E8E5E0',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
});
