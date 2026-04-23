import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, View, TouchableOpacity } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLoadingStore } from '@/store/loadingStore';
import SideDrawer from '@/components/SideDrawer';

export default function TabLayout() {
  const user = useAuthStore(state => state.user);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setIsLoading = useLoadingStore(state => state.setIsLoading);

  return (
    <SideDrawer>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            backgroundColor: '#1e2126',
            borderTopWidth: 1,
            borderTopColor: '#38383d',
            elevation: 0,
            shadowOpacity: 0,
            height: 56 + insets.bottom,
            paddingTop: 0,
            paddingBottom: insets.bottom,
          },
          // This forces ALL tab items to center their icons vertically
          tabBarItemStyle: {
            height: 56,
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 0,
            paddingBottom: 0,
          },
        }}>

        <Tabs.Screen
          name="index"
          listeners={{
            tabPress: () => setIsLoading(true),
            focus: () => setIsLoading(false),
          }}
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons name="home-outline" size={24} color={color} />
            ),
          }}
        />

        {/* Hidden screens - files exist but should not appear as tabs */}
        <Tabs.Screen name="inventory" options={{ href: null }} />

        <Tabs.Screen
          name="create"
          options={{
            tabBarButton: () => (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push('/new-post')}
                style={{
                  top: -10,
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: 70,
                }}>
                <View style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  backgroundColor: '#c1ff72',
                  shadowColor: '#c1ff72',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Ionicons name="add" size={32} color="#1e2126" />
                </View>
              </TouchableOpacity>
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
                width: 30,
                height: 30,
                borderRadius: 15,
                overflow: 'hidden',
                borderWidth: 2,
                borderColor: '#c1ff72',
                backgroundColor: '#38383d',
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
