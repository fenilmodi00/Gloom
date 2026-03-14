import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store/auth.store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        {/* Logo / Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>✦</Text>
          <Text style={styles.title}>StyleAI</Text>
          <Text style={styles.subtitle}>Your Personal AI Stylist</Text>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Text style={styles.errorDismiss}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {!otpSent ? (
          <>
            {/* Phone Input Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Continue with Phone</Text>
              
              <View style={styles.phoneInputContainer}>
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter phone number"
                  placeholderTextColor="#6B6B6B"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (!isValidPhone(phone) || otpLoading) && styles.buttonDisabled,
                ]}
                onPress={handleSendOtp}
                disabled={!isValidPhone(phone) || otpLoading}
              >
                {otpLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-In */}
            <TouchableOpacity
              style={[styles.secondaryButton, loading && styles.buttonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#1A1A1A" />
              ) : (
                <>
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.secondaryButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* OTP Verification Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Enter OTP</Text>
              <Text style={styles.otpSubtitle}>
                We sent a 6-digit code to +91{phone}
              </Text>
              
              <TextInput
                style={styles.otpInput}
                placeholder="------"
                placeholderTextColor="#6B6B6B"
                value={otp}
                onChangeText={(text) => setOtp(text.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (otp.length !== 6 || loading) && styles.buttonDisabled,
                ]}
                onPress={handleVerifyOtp}
                disabled={otp.length !== 6 || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Verify & Continue</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={() => {
                  setOtpSent(false);
                  setOtp('');
                }}
              >
                <Text style={styles.resendText}>Change phone number</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2EE',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 48,
    color: '#8B7355',
    marginBottom: 16,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#1A1A1A',
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B6B6B',
    marginTop: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FADBD8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  errorText: {
    flex: 1,
    color: '#C0392B',
    fontSize: 14,
  },
  errorDismiss: {
    color: '#C0392B',
    fontSize: 18,
    marginLeft: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0DDD5',
  },
  countryCode: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 16,
  },
  primaryButton: {
    backgroundColor: '#8B7355',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0DDD5',
  },
  dividerText: {
    color: '#6B6B6B',
    fontSize: 14,
    marginHorizontal: 16,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0DDD5',
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
    marginRight: 12,
  },
  secondaryButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '500',
  },
  otpSubtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 16,
  },
  otpInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0DDD5',
    marginBottom: 24,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    color: '#8B7355',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    fontSize: 12,
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: 48,
  },
});
