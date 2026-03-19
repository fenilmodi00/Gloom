import React, { forwardRef, useMemo } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { TrendingGrid } from './TrendingGrid';
import type { TrendingSection, TrendingItem } from '@/types/inspo';

export interface InspoBottomSheetProps {
  sections: TrendingSection[];
  onTryOnPress?: (item: TrendingItem) => void;
}

export const InspoBottomSheet = forwardRef<BottomSheet, InspoBottomSheetProps>(
  ({ sections, onTryOnPress }, ref) => {
    const insets = useSafeAreaInsets();
    
    // Bottom sheet snap points
    const snapPoints = useMemo(() => ['20%', '50%', '85%'], []);

    return (
      <BottomSheet
        ref={ref}
        index={1} // Start at 50%
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        backgroundStyle={{
          backgroundColor: '#F5F3ED',
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
        }}
        handleIndicatorStyle={{
          width: 48,
          height: 6,
          backgroundColor: '#D6D3D1',
          borderRadius: 3,
        }}
        handleStyle={{
          paddingTop: 16,
          paddingBottom: 8,
        }}
      >
        <BottomSheetScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            paddingHorizontal: 24, 
            paddingTop: 8,
            paddingBottom: insets.bottom + 120 // Extra padding for bottom tab bar
          }}
          showsVerticalScrollIndicator={false}
        >
          <TrendingGrid sections={sections} onTryOnPress={onTryOnPress} />
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

InspoBottomSheet.displayName = 'InspoBottomSheet';

export default InspoBottomSheet;
