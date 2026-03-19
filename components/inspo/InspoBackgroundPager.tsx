import React, { useRef } from 'react';
import { View, FlatList, Dimensions, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

export interface InspoBackgroundPagerProps {
  images: string[];
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function InspoBackgroundPager({ images }: InspoBackgroundPagerProps) {
  const renderItem = ({ item }: { item: string }) => (
    <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
      <Image
        source={{ uri: item }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={200}
      />
      {/* Dark overlay to ensure text/UI visibility if needed, or subtle gradient */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.1)' }]} />
    </View>
  );

  return (
    <View style={StyleSheet.absoluteFillObject} className="z-0">
      <FlatList
        data={images}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item}-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
      />
    </View>
  );
}
