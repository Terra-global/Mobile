import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';

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

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      <StatusBar style="light" />

      {/* ── Fixed Header ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#c1ff72" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>User Center</Text>
        <View style={styles.backButton} />
      </View>

      {/* ── User Info ── */}
      <View style={styles.userRow}>
        <Image 
          source={{ uri: user?.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=DemoUser' }} 
          style={styles.avatar} 
        />
        <View>
          <Text style={styles.userName}>{user?.username || 'New User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </View>

      {/* ── Scrollable Profile Items ── */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Personal Profile</Text>

        {PROFILE_ITEMS.map((item, index) => (
          <TouchableOpacity key={index} style={styles.profileRow} onPress={() => router.push(item.route as any)}>
            <Text style={styles.profileRowLabel}>{item.label}</Text>
            <View style={styles.profileRowRight}>
              {item.hasAvatar && (
                <Image 
                  source={{ uri: user?.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=DemoUser' }} 
                  style={styles.miniAvatar} 
                />
              )}
              <Ionicons name="chevron-forward" size={20} color="#c1ff72" />
            </View>
          </TouchableOpacity>
        ))}

        {/* Go Home Button */}
        <TouchableOpacity style={styles.goHomeButton} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.goHomeButtonText}>Go Home</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Fixed Footer ── */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.footerText}>About Us</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e2126',
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
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Roboto',
    opacity: 0.7,
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
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
  },
  userEmail: {
    color: '#999',
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
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Roboto-Bold',
    marginBottom: 16,
    opacity: 0.9,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  profileRowLabel: {
    color: '#fff',
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
    backgroundColor: '#1e2126',
  },
  footerText: {
    color: '#fff',
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
    color: '#1e2126',
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
  },
});
