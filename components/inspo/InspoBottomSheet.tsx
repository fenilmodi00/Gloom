import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { forwardRef, useCallback, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { TrendingItem, TrendingSection } from '@/types/inspo';
import { TrendingGrid } from './TrendingGrid';

// Ref type forwarded by @gorhom/bottom-sheet — exposes snapToIndex(), expand(), close()
type BottomSheetRef = React.ElementRef<typeof BottomSheet>;

export interface InspoBottomSheetProps {
  sections: TrendingSection[];
  onTryOnPress?: (item: TrendingItem) => void;
  onIndexChange?: (index: number) => void;
}

export const InspoBottomSheet = forwardRef<BottomSheetRef, InspoBottomSheetProps>(
  ({ sections, onTryOnPress, onIndexChange }, ref) => {
    const insets = useSafeAreaInsets();

    // Bottom sheet snap points
    const snapPoints = useMemo(() => ['34%', '60%', '80%'], []);

    const handleChange = useCallback((index: number) => {
      if (onIndexChange) {
        onIndexChange(index);
      }
    }, [onIndexChange]);

    return (
      <BottomSheet
        ref={ref}
        index={1} // Start at 60%
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        topInset={insets.top + 65}
        onChange={handleChange}
        backgroundStyle={{
          backgroundColor: '#F5F3EC',
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
            paddingBottom: insets.bottom + 120
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
