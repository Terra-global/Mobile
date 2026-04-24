import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(state => state.user);
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background, paddingTop: Math.max(insets.top, 20) }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* ── User Info ── */}
      <View style={styles.userRow}>
        <Image 
          source={{ uri: user?.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=DemoUser' }} 
          style={[styles.avatar, { backgroundColor: themeColors.card }]} 
        />
        <View>
          <Text style={[styles.userName, { color: themeColors.text }]}>{user?.username || 'New User'}</Text>
          <Text style={[styles.userEmail, { color: themeColors.subtext }]}>{user?.email || 'No email'}</Text>
        </View>
      </View>

      {/* ── Body ── */}
      <View style={styles.body}>
        <ThemedText style={[styles.welcomeText, { color: themeColors.text }]}>Welcome</ThemedText>

        <TouchableOpacity
          style={[styles.completeButton, { backgroundColor: themeColors.tint }]}
          onPress={() => router.push('/(onboarding)/profile-setup')}
        >
          <Text style={styles.completeButtonText}>Complete Your Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pitchLink}>
          <Text style={[styles.pitchText, { color: themeColors.text }]}>Watch Our Pitch</Text>
        </TouchableOpacity>
      </View>

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
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 20,
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
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  welcomeText: {
    fontSize: 48,
    fontFamily: 'Roboto',
    marginBottom: 32,
    lineHeight: 56,
  },
  completeButton: {
    borderRadius: 16,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
  },
  pitchLink: {
    paddingVertical: 8,
  },
  pitchText: {
    fontSize: 15,
    fontFamily: 'Roboto',
    opacity: 0.8,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  footerText: {
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
  },
});
