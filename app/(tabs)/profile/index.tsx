import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/store/auth.store';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useTabAnimation } from '@/lib/hooks/useTabAnimation';
import Animated from 'react-native-reanimated';
import { useModelImageStore } from '@/lib/store/model-image.store';
import { useEffect } from 'react';
import { ModelImageGrid } from '@/components/shared/ModelImageGrid';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuthStore();
  const { images, fetchImages, deleteImage } = useModelImageStore();
  const router = useRouter();
  const { animatedStyle } = useTabAnimation('profile/index');

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>
            {user?.name?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>

          <Text style={styles.name}>
            {user?.name || 'Style Enthusiast'}
          </Text>

          <Text style={styles.subtitle}>
            {user?.style_tags?.join(' · ') || 'Setting up your style profile'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Looks</Text>
          <ModelImageGrid
            images={images}
            onImageDelete={deleteImage}
          />
        </View>

        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Style Preferences</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Help & Support</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.bgCanvas,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: '600',
    color: Colors.light.textPrimary,
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    fontSize: 32,
    fontWeight: '600',
    color: Colors.light.bgSurface,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  section: {
    marginTop: 16,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.textPrimary,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  menu: {
    backgroundColor: Colors.light.bgSurface,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  menuItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.bgMuted,
  },
  menuText: {
    fontSize: 16,
    color: Colors.light.textPrimary,
  },
  signOutButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignSelf: 'center',
    marginBottom: 32,
  },
  signOutText: {
    fontSize: 16,
    color: Colors.light.stateError,
    fontWeight: '500',
  },
});
