import { View, Text, StyleSheet } from 'react-native';

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>
      <Text style={styles.subtitle}>Let's set up your profile</Text>
      <Text style={styles.placeholder}>
        Onboarding screens coming in Tasks 9-12
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2EE',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B6B6B',
    marginTop: 8,
    marginBottom: 32,
  },
  placeholder: {
    fontSize: 14,
    color: '#8B7355',
  },
});
