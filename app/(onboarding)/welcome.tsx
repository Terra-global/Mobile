import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(state => state.user);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      <StatusBar style="light" />

      {/* ── User Info ── */}
      <View style={styles.userRow}>
        <Image 
          source={{ uri: user?.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=DemoUser' }} 
          style={styles.avatar} 
        />
        <View>
          <Text style={styles.userName}>{user?.username || 'New User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
        </View>
      </View>

      {/* ── Body ── */}
      <View style={styles.body}>
        <ThemedText style={styles.welcomeText}>Welcome</ThemedText>

        <TouchableOpacity
          style={styles.completeButton}
          onPress={() => router.push('/(onboarding)/profile-setup')}
        >
          <Text style={styles.completeButtonText}>Complete Your Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pitchLink}>
          <Text style={styles.pitchText}>Watch Our Pitch</Text>
        </TouchableOpacity>
      </View>

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
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  welcomeText: {
    fontSize: 48,
    fontFamily: 'Roboto',
    color: '#fff',
    marginBottom: 32,
    lineHeight: 56,
  },
  completeButton: {
    backgroundColor: '#c1ff72',
    borderRadius: 16,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  completeButtonText: {
    color: '#1e2126',
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
  },
  pitchLink: {
    paddingVertical: 8,
  },
  pitchText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Roboto',
    opacity: 0.8,
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
});
