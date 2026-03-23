import BottomTabBar from '@/components/shared/BottomTabBar';
import Colors from '@/constants/Colors';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: Colors.light.bgCanvas },
        // Use our custom tab bar for all platforms
        tabBarStyle: {
          display: 'none',
          height: 0,
          opacity: 0,
          position: 'absolute',
          backgroundColor: 'transparent',
        },
      }}
    >
      {/* Tab 1 — Inspo (Home) */}
      <Tabs.Screen
        name="inspo/index"
        options={{
          title: 'Inspo',
          tabBarLabel: 'Home',
        }}
      />

      {/* Tab 2 — Wardrobe */}
      <Tabs.Screen
        name="wardrobe/index"
        options={{
          title: 'Wardrobe',
          tabBarLabel: 'Wardrobe',
        }}
      />

      {/* Tab 3 — Outfits */}
      <Tabs.Screen
        name="outfits/index"
        options={{
          title: 'Outfits',
          tabBarLabel: 'Outfits',
        }}
      />

      {/* Hidden route — Favorites should not appear as a tab */}
      <Tabs.Screen
        name="favorites/index"
        options={{
          href: null,
          title: 'Saved',
          tabBarLabel: 'Saved',
        }}
      />

      {/* Hidden route — nested add item flow */}
      <Tabs.Screen
        name="wardrobe/add-item"
        options={{
          href: null,
        }}
      />

      {/* Hidden route — outfit builder */}
      <Tabs.Screen
        name="wardrobe/outfit-builder"
        options={{
          href: null,
        }}
      />

      {/* Tab 4 — Profile */}
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
    </Tabs>
  );
}
