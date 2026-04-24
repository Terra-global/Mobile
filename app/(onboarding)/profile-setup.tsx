import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';

const PROFILE_ITEMS = [
  { label: 'Profile Picture', hasAvatar: true, route: '/(onboarding)/profile-pic' },
  { label: 'Username', route: '/(onboarding)/username' },
  { label: 'Bio', route: '/(onboarding)/bio' },
  { label: 'Website', route: '/(onboarding)/website' },
  { label: 'Farm Type', route: '/(onboarding)/farm-type' },
  { label: 'Add Social Url', route: '/(onboarding)/social-url' },
  { label: 'Join Socials', route: '/(onboarding)/join-socials' },
  { label: 'Settings', route: '/(onboarding)/settings' },
];

export default function ProfileSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(state => state.user);
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background, paddingTop: Math.max(insets.top, 20) }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* ── Fixed Header ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={themeColors.tint} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: themeColors.subtext }]}>User Center</Text>
        <View style={styles.backButton} />
      </View>

      {/* ── User Info ── */}
      <View style={styles.userRow}>
        <Image 
          source={{ uri: user?.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=DemoUser' }} 
          style={[styles.avatar, { backgroundColor: themeColors.card }]} 
        />
        <View>
          <Text style={[styles.userName, { color: themeColors.text }]}>{user?.username || 'New User'}</Text>
          <Text style={[styles.userEmail, { color: themeColors.subtext }]}>{user?.email}</Text>
        </View>
      </View>

      {/* ── Scrollable Profile Items ── */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Personal Profile</Text>

        {PROFILE_ITEMS.map((item, index) => (
          <TouchableOpacity key={index} style={styles.profileRow} onPress={() => router.push(item.route as any)}>
            <Text style={[styles.profileRowLabel, { color: themeColors.text }]}>{item.label}</Text>
            <View style={styles.profileRowRight}>
              {item.hasAvatar && (
                <Image 
                  source={{ uri: user?.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=DemoUser' }} 
                  style={[styles.miniAvatar, { backgroundColor: themeColors.card }]} 
                />
              )}
              <Ionicons name="chevron-forward" size={20} color={themeColors.tint} />
            </View>
          </TouchableOpacity>
        ))}

        {/* Go Home Button */}
        <TouchableOpacity style={[styles.goHomeButton, { backgroundColor: themeColors.tint }]} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.goHomeButtonText}>Go Home</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Fixed Footer ── */}
      <View style={[styles.footer, { backgroundColor: themeColors.background, paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <Text style={[styles.footerText, { color: themeColors.text }]}>About Us</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 15,
    fontFamily: 'Roboto',
    letterSpacing: 0.5,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#38383d',
  },
  userName: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
  },
  userEmail: {
    fontSize: 13,
    fontFamily: 'Roboto',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Roboto-Bold',
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  profileRowLabel: {
    fontSize: 15,
    fontFamily: 'Roboto',
  },
  profileRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#38383d',
  },
  arrow: {
    color: '#c1ff72',
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  footerText: {
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
  },
  goHomeButton: {
    backgroundColor: '#c1ff72',
    borderRadius: 16,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  goHomeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
  },
});
