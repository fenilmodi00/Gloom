import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store/auth.store';

// Step components
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.stepDot,
            index + 1 <= currentStep && styles.stepDotActive,
          ]}
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
      Alert.alert('Permission Required', 'Please allow camera access to take a photo.');
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
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        // Step 1: Name input
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What should we call you?</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Your name"
              placeholderTextColor="#6B6B6B"
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <TouchableOpacity
              style={[
                styles.continueButton,
                !canProceedStep1 && styles.buttonDisabled,
              ]}
              disabled={!canProceedStep1}
              onPress={() => setStep(2)}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );

      case 2:
        // Step 2: Style preferences
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What's your style?</Text>
            <Text style={styles.stepSubtitle}>Select all that apply</Text>
            
            <View style={styles.styleGrid}>
              {styleOptions.map((option) => {
                const isSelected = stylePreferences.includes(option.id);
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.styleOption,
                      isSelected && styles.styleOptionSelected,
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        setStylePreferences(stylePreferences.filter((s) => s !== option.id));
                      } else {
                        setStylePreferences([...stylePreferences, option.id]);
                      }
                    }}
                  >
                    <Text style={styles.styleEmoji}>{option.emoji}</Text>
                    <Text
                      style={[
                        styles.styleLabel,
                        isSelected && styles.styleLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[
                styles.continueButton,
                !canProceedStep2 && styles.buttonDisabled,
              ]}
              disabled={!canProceedStep2}
              onPress={() => setStep(3)}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );

      case 3:
        // Step 3: Body photo
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Add your body photo</Text>
            <Text style={styles.stepSubtitle}>
              This helps us recommend outfits that fit you perfectly
            </Text>

            <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
              {bodyPhoto ? (
                <Image source={{ uri: bodyPhoto }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoIcon}>📷</Text>
                  <Text style={styles.photoText}>Tap to add photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.continueButton,
                !canProceedStep3 && styles.buttonDisabled,
              ]}
              disabled={!canProceedStep3}
              onPress={() => setStep(4)}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );

      case 4:
        // Step 4: Completion
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>You're all set!</Text>
            <Text style={styles.stepSubtitle}>
              We've saved your preferences. Let's find your perfect style.
            </Text>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Name</Text>
              <Text style={styles.summaryValue}>{name}</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Style</Text>
              <Text style={styles.summaryValue}>
                {stylePreferences.map(
                  (s) => styleOptions.find((o) => o.id === s)?.label
                ).join(', ')}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.continueButton, loading && styles.buttonDisabled]}
              disabled={loading}
              onPress={handleComplete}
            >
              <Text style={styles.continueButtonText}>
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Progress */}
      <View style={styles.progressContainer}>
        <StepIndicator currentStep={step} totalSteps={totalSteps} />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2EE',
  },
  progressContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0DDD5',
  },
  stepDotActive: {
    backgroundColor: '#8B7355',
    width: 24,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 32,
  },
  nameInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0DDD5',
    marginBottom: 24,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#8B7355',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  styleOption: {
    width: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  styleOptionSelected: {
    borderColor: '#8B7355',
    backgroundColor: '#F5F2EE',
  },
  styleEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  styleLabel: {
    fontSize: 14,
    color: '#6B6B6B',
  },
  styleLabelSelected: {
    color: '#8B7355',
    fontWeight: '600',
  },
  photoButton: {
    aspectRatio: 3 / 4,
    maxHeight: 400,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0DDD5',
    borderStyle: 'dashed',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  photoText: {
    fontSize: 16,
    color: '#6B6B6B',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B6B6B',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
});
