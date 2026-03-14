import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import BottomTabBar from '@/components/shared/BottomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Use our custom tab bar for all platforms
        tabBarStyle: Platform.select({
          // The custom bar is absolutely positioned, so we hide the native one
          default: { display: 'none' },
        }),
      }}
    >
      {/* Tab 1 — Inspo */}
      <Tabs.Screen
        name="inspo"
        options={{
          title: 'Inspo',
          tabBarLabel: 'Home',
        }}
      />

      {/* Tab 2 — Wardrobe (acts as Search in nav) */}
      <Tabs.Screen
        name="wardrobe"
        options={{
          title: 'Wardrobe',
          tabBarLabel: 'Search',
        }}
      />

      {/* Tab 3 — Outfits (active in the Stitch design) */}
      <Tabs.Screen
        name="outfits"
        options={{
          title: 'Outfits',
          tabBarLabel: 'Outfits',
        }}
      />

      {/* Hide legacy index & two tabs from the Expo template */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}
