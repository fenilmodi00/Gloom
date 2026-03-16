import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Camera, Search, Sparkles } from 'lucide-react-native';

interface EmptyStateProps {
  title: string;
  description: string;
  buttonTitle?: string;
  onPress: () => void;
  onSearchPress?: () => void;
  onOutfitPress?: () => void;
}

export function EmptyState({
  title,
  description,
  buttonTitle = 'Add item',
  onPress,
  onSearchPress,
  onOutfitPress,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Icon */}
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>👕</Text>
        </View>

        {/* Text */}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            onPress={onPress}
            style={styles.primaryButton}
            activeOpacity={0.8}
          >
            <Camera size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>{buttonTitle}</Text>
          </TouchableOpacity>

          {onSearchPress && (
            <TouchableOpacity
              onPress={onSearchPress}
              style={styles.secondaryButton}
              activeOpacity={0.8}
            >
              <Search size={18} color="#1A1A1A" />
              <Text style={styles.secondaryButtonText}>Search web</Text>
            </TouchableOpacity>
          )}

          {onOutfitPress && (
            <TouchableOpacity
              onPress={onOutfitPress}
              style={styles.outlineButton}
              activeOpacity={0.8}
            >
              <Sparkles size={18} color="#8B7355" />
              <Text style={styles.outlineButtonText}>Add items from outfit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#F5F2EE',
  },
  card: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 40,
    paddingHorizontal: 28,
    borderRadius: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F5F2EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconEmoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B6B6B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  buttonsContainer: {
    width: '100%',
    gap: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 999,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F2EE',
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 999,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D4C5B0',
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 999,
    gap: 8,
  },
  outlineButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B7355',
  },
});
