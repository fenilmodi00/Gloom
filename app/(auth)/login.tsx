import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store/auth.store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, Phone, ArrowLeft, Loader2 } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setUser, setSession } = useAuthStore();
  
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate Indian phone number (10 digits)
  const isValidPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10;
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'styleai://login/callback',
        },
      });
      
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  // Handle Send OTP
  const handleSendOtp = async () => {
    if (!isValidPhone(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setOtpLoading(true);
    setError(null);

    try {
      // Format phone with +91 country code
      const formattedPhone = `+91${phone.replace(/\D/g, '')}`;
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        setError(error.message);
      } else {
        setOtpSent(true);
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formattedPhone = `+91${phone.replace(/\D/g, '')}`;
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms',
      });

      if (error) {
        setError(error.message);
      } else if (data.session) {
        setSession(data.session.access_token);
        
        // Check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user?.id)
          .single();
        
        if (profile?.name) {
          setUser(profile);
          router.replace('/(tabs)/inspo' as any);
        } else {
          router.replace('/(auth)/onboarding' as any);
        }
      }
    } catch (err) {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bgCanvas"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View 
        className="flex-1 px-8 justify-center"
        style={{ paddingTop: insets.top }}
      >
        {/* Logo / Header */}
        <View className="items-center mb-12">
          <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
            <Text className="text-4xl text-primary">✦</Text>
          </View>
          <Text className="text-4xl font-bold italic tracking-tight text-textPrimary">StyleAI</Text>
          <Text className="text-base text-textSecondary mt-2">Your Personal AI Stylist</Text>
        </View>

        {/* Error Message */}
        {error && (
          <View className="flex-row items-center justify-between bg-stateError/10 p-4 rounded-xl mb-6">
            <Text className="flex-1 text-stateError text-sm">{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Text className="text-stateError text-lg ml-3 font-semibold">✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {!otpSent ? (
          <>
            {/* Phone Input Section */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-textPrimary mb-4">Continue with Phone</Text>
              
              <View className="flex-row items-center bg-bgSurface rounded-xl px-4 border border-bgMuted mb-4">
                <Text className="text-base text-textPrimary font-medium mr-2">+91</Text>
                <TextInput
                  className="flex-1 text-base text-textPrimary py-4"
                  placeholder="Enter phone number"
                  placeholderTextColor="#A89880"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              <TouchableOpacity
                className={`py-4 rounded-xl items-center bg-primary ${(!isValidPhone(phone) || otpLoading) ? 'opacity-50' : ''}`}
                onPress={handleSendOtp}
                disabled={!isValidPhone(phone) || otpLoading}
              >
                {otpLoading ? (
                  <ActivityIndicator color="#FDFAF6" />
                ) : (
                  <Text className="text-textOnDark text-base font-semibold">Send OTP</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-[1px] bg-bgMuted" />
              <Text className="text-textSecondary text-sm mx-4">or</Text>
              <View className="flex-1 h-[1px] bg-bgMuted" />
            </View>

            {/* Google Sign-In */}
            <TouchableOpacity
              className={`flex-row items-center justify-center bg-bgSurface py-4 rounded-xl border border-bgMuted ${loading ? 'opacity-50' : ''}`}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#1A1A1A" />
              ) : (
                <>
                  <Text className="text-blue-500 font-bold text-lg mr-3">G</Text>
                  <Text className="text-textPrimary text-base font-medium">Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* OTP Verification Section */}
            <View className="mb-6">
              <View className="flex-row items-center mb-4">
                <TouchableOpacity onPress={() => setOtpSent(false)} className="mr-3">
                  <ArrowLeft size={20} color="#1A1A1A" />
                </TouchableOpacity>
                <Text className="text-lg font-semibold text-textPrimary">Enter OTP</Text>
              </View>
              <Text className="text-sm text-textSecondary mb-4">
                We sent a 6-digit code to +91{phone}
              </Text>
              
              <TextInput
                className="bg-bgSurface rounded-xl py-4 px-6 text-2xl text-center tracking-[8px] text-textPrimary border border-bgMuted mb-6"
                placeholder="------"
                placeholderTextColor="#A89880"
                value={otp}
                onChangeText={(text) => setOtp(text.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              <TouchableOpacity
                className={`py-4 rounded-xl items-center bg-primary ${(otp.length !== 6 || loading) ? 'opacity-50' : ''}`}
                onPress={handleVerifyOtp}
                disabled={otp.length !== 6 || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FDFAF6" />
                ) : (
                  <Text className="text-textOnDark text-base font-semibold">Verify & Continue</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="items-center mt-4"
                onPress={() => {
                  setOtpSent(false);
                  setOtp('');
                }}
              >
                <Text className="text-primary text-sm font-medium">Change phone number</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Footer */}
        <Text className="text-xs text-textSecondary text-center mt-12 leading-5">
          By continuing, you agree to our{'\n'}
          <Text className="underline font-medium">Terms of Service</Text> and <Text className="underline font-medium">Privacy Policy</Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

