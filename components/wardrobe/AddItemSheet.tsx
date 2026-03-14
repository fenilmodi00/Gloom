import React, { forwardRef, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Camera, Image as ImageIcon } from 'lucide-react-native';

interface AddItemSheetProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSelectMethod: (method: 'camera' | 'gallery') => void;
}

export const AddItemSheet = forwardRef<BottomSheet, AddItemSheetProps>(
  ({ onSelectMethod }, ref) => {
    const snapPoints = ['30%'];

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      ),
      []
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: '#FFFFFF', borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: '#D4C5B0', width: 40 }}
      >
        <View className="flex-1 p-6 space-y-4">
          <Text className="text-xl font-bold text-text-primary mb-2">Add to Wardrobe</Text>
          
          <Pressable
            onPress={() => onSelectMethod('camera')}
            className="flex-row items-center w-full bg-background p-4 rounded-xl mb-3"
          >
            <View className="w-10 h-10 rounded-full bg-accent/10 items-center justify-center mr-4">
              <Camera size={20} color="#8B7355" />
            </View>
            <View>
              <Text className="text-base font-bold text-text-primary">Take photo</Text>
              <Text className="text-sm text-text-secondary">Use camera to capture item</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => onSelectMethod('gallery')}
            className="flex-row items-center w-full bg-background p-4 rounded-xl"
          >
            <View className="w-10 h-10 rounded-full bg-accent/10 items-center justify-center mr-4">
              <ImageIcon size={20} color="#8B7355" />
            </View>
            <View>
              <Text className="text-base font-bold text-text-primary">Choose from gallery</Text>
              <Text className="text-sm text-text-secondary">Upload an existing photo</Text>
            </View>
          </Pressable>
        </View>
      </BottomSheet>
    );
  }
);
