import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store/auth.store';
import { showToast } from '@/components/shared/Toast';

// Step components
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <View className="flex-row gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          className={`h-2 rounded-full ${index + 1 === currentStep ? 'bg-primary w-6' : 'bg-divider w-2'}`}
        />
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuthStore();
  
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [stylePreferences, setStylePreferences] = useState<string[]>([]);
  const [bodyPhoto, setBodyPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const totalSteps = 4;

  // Style options for step 2
  const styleOptions = [
    { id: 'minimalist', label: 'Minimalist', emoji: '⬜' },
    { id: 'streetwear', label: 'Streetwear', emoji: '👟' },
    { id: 'ethnic', label: 'Ethnic', emoji: '🥻' },
    { id: 'formal', label: 'Formal', emoji: '👔' },
    { id: 'casual', label: 'Casual', emoji: '👕' },
  ];

  // Step 1: Name validation
  const canProceedStep1 = name.trim().length >= 2;

  // Step 2: Style validation
  const canProceedStep2 = stylePreferences.length > 0;

  // Step 3: Body photo validation
  const canProceedStep3 = !!bodyPhoto;

  // Handle pick image
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      showToast({ type: 'error', message: 'Camera permission required' });
      return;
    }

    Alert.alert(
      'Add Photo',
      'Choose how to add your body photo',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [3, 4],
              quality: 0.8,
            });
            
            if (!result.canceled && result.assets[0]) {
              setBodyPhoto(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              aspect: [3, 4],
              quality: 0.8,
            });
            
            if (!result.canceled && result.assets[0]) {
              setBodyPhoto(result.assets[0].uri);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Handle complete onboarding
  const handleComplete = async () => {
    setLoading(true);
    
    try {
      // Upload body photo if available
      let bodyPhotoUrl = null;
      
      if (bodyPhoto) {
        const fileName = `${user?.id}/body-photo.jpg`;
        const response = await fetch(bodyPhoto);
        const blob = await response.blob();
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('wardrobe-images')
          .upload(fileName, blob);
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('wardrobe-images')
            .getPublicUrl(fileName);
          bodyPhotoUrl = publicUrl;
        }
      }

      // Update user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          style_tags: stylePreferences,
          body_photo_url: bodyPhotoUrl,
        })
        .eq('id', user?.id)
        .select()
        .single();

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      if (profile) {
        setUser(profile);
      }

      router.replace('/(tabs)/inspo' as any);
    } catch (error) {
      console.error('Onboarding error:', error);
      showToast({ type: 'error', message: 'Failed to complete onboarding' });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        // Step 1: Name input
        return (
          <View className="flex-1 justify-center">
            <Text className="font-hero text-4xl text-textPrimary text-center mb-2">What should we call you?</Text>
            <TextInput
              className="bg-card rounded-xl py-4 px-5 text-lg text-textPrimary border border-divider mb-6 text-center font-body"
              placeholder="Your name"
              placeholderTextColor="#6B6B6B"
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <TouchableOpacity
              className={`bg-primary py-4 rounded-xl items-center mt-6 ${!canProceedStep1 ? 'opacity-50' : ''}`}
              disabled={!canProceedStep1}
              onPress={() => setStep(2)}
            >
              <Text className="text-white text-base font-semibold font-ui">Continue</Text>
            </TouchableOpacity>
          </View>
        );

      case 2:
        // Step 2: Style preferences
        return (
          <View className="flex-1 justify-center">
            <Text className="font-hero text-4xl text-textPrimary text-center mb-2">What's your style?</Text>
            <Text className="text-base text-textSecondary text-center mb-8 font-body">Select all that apply</Text>
            
            <View className="flex-row flex-wrap justify-center gap-3">
              {styleOptions.map((option) => {
                const isSelected = stylePreferences.includes(option.id);
                return (
                  <TouchableOpacity
                    key={option.id}
                    className={`w-[45%] rounded-xl p-5 items-center border-2 ${isSelected ? 'border-primary bg-bgCanvas' : 'border-transparent bg-card'}`}
                    onPress={() => {
                      if (isSelected) {
                        setStylePreferences(stylePreferences.filter((s) => s !== option.id));
                      } else {
                        setStylePreferences([...stylePreferences, option.id]);
                      }
                    }}
                  >
                    <Text className="text-3xl mb-2">{option.emoji}</Text>
                    <Text className={`text-sm font-body ${isSelected ? 'text-primary font-semibold' : 'text-textSecondary'}`}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              className={`bg-primary py-4 rounded-xl items-center mt-6 ${!canProceedStep2 ? 'opacity-50' : ''}`}
              disabled={!canProceedStep2}
              onPress={() => setStep(3)}
            >
              <Text className="text-white text-base font-semibold font-ui">Continue</Text>
            </TouchableOpacity>
          </View>
        );

      case 3:
        // Step 3: Body photo
        return (
          <View className="flex-1 justify-center">
            <Text className="font-hero text-4xl text-textPrimary text-center mb-2">Add your body photo</Text>
            <Text className="text-base text-textSecondary text-center mb-8 font-body">
              This helps us recommend outfits that fit you perfectly
            </Text>

            <TouchableOpacity className="aspect-[3/4] max-h-[400px] rounded-2xl overflow-hidden bg-card border-2 border-divider border-dashed" onPress={pickImage}>
              {bodyPhoto ? (
                <Image source={{ uri: bodyPhoto }} className="w-full h-full" />
              ) : (
                <View className="flex-1 justify-center items-center">
                  <Text className="text-5xl mb-3">📷</Text>
                  <Text className="text-base text-textSecondary font-body">Tap to add photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className={`bg-primary py-4 rounded-xl items-center mt-6 ${!canProceedStep3 ? 'opacity-50' : ''}`}
              disabled={!canProceedStep3}
              onPress={() => setStep(4)}
            >
              <Text className="text-white text-base font-semibold font-ui">Continue</Text>
            </TouchableOpacity>
          </View>
        );

      case 4:
        // Step 4: Completion
        return (
          <View className="flex-1 justify-center">
            <Text className="font-hero text-4xl text-textPrimary text-center mb-2">You're all set!</Text>
            <Text className="text-base text-textSecondary text-center mb-8 font-body">
              We've saved your preferences. Let's find your perfect style.
            </Text>

            <View className="bg-card rounded-xl p-4 mb-3">
              <Text className="text-xs text-textSecondary mb-1 font-ui">Name</Text>
              <Text className="text-base text-textPrimary font-medium font-body">{name}</Text>
            </View>

            <View className="bg-card rounded-xl p-4 mb-3">
              <Text className="text-xs text-textSecondary mb-1 font-ui">Style</Text>
              <Text className="text-base text-textPrimary font-medium font-body">
                {stylePreferences.map(
                  (s) => styleOptions.find((o) => o.id === s)?.label
                ).join(', ')}
              </Text>
            </View>

            <TouchableOpacity
              className={`bg-primary py-4 rounded-xl items-center mt-6 ${loading ? 'opacity-50' : ''}`}
              disabled={loading}
              onPress={handleComplete}
            >
              <Text className="text-white text-base font-semibold font-ui">
                {loading ? 'Setting up...' : 'Start Exploring'}
              </Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-bgCanvas" style={{ paddingTop: insets.top }}>
      {/* Progress */}
      <View className="py-6 items-center">
        <StepIndicator currentStep={step} totalSteps={totalSteps} />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>
    </View>
  );
}
