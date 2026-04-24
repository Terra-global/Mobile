import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, View, TouchableOpacity } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLoadingStore } from '@/store/loadingStore';
import SideDrawer from '@/components/SideDrawer';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';

export default function TabLayout() {
  const user = useAuthStore(state => state.user);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setIsLoading = useLoadingStore(state => state.setIsLoading);
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];

  return (
    <SideDrawer>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: themeColors.text,
          tabBarInactiveTintColor: themeColors.icon,
          tabBarStyle: {
            backgroundColor: themeColors.background,
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            height: 70 + insets.bottom,
            paddingTop: 4,
            paddingBottom: insets.bottom,
          },
          tabBarItemStyle: {
            height: 60,
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}>

        <Tabs.Screen
          name="index"
          listeners={{
            tabPress: () => setIsLoading(true),
            focus: () => setIsLoading(false),
          }}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "earth" : "earth-outline"} size={26} color={color} />
            ),
          }}
        />

        {/* Hidden screens - files exist but should not appear as tabs */}
        <Tabs.Screen name="inventory" options={{ href: null }} />

        <Tabs.Screen
          name="squares"
          options={{
            href: null,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "megaphone" : "megaphone-outline"} size={26} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="search"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "grid" : "grid-outline"} size={26} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="create"
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons name="add-circle-outline" size={28} color={color} />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              router.push('/new-post');
            },
          }}
        />

        <Tabs.Screen
          name="notifications"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "notifications" : "notifications-outline"} size={26} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile_tab"
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setIsLoading(true);
              router.push('/profile' as any);
            },
          }}
          options={{
            tabBarIcon: () => (
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: themeColors.card,
              }}>
                <Image
                  source={{ uri: user?.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=' + (user?.username || 'DemoUser') }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>
            ),
          }}
        />
      </Tabs>
    </SideDrawer>
  );
}
