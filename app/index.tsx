import React, { useEffect } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { StatusBar } from 'expo-status-bar';

import { useAuthStore } from '@/store/authStore';

export default function LandingScreen() {
  const router = useRouter();
  const fadeAnim = new Animated.Value(1);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    // Auto-transition after 2.5 seconds
    const timer = setTimeout(() => {
      if (token) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [token]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ThemedText style={styles.title}>
          Terra
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Unifying Farmers
        </ThemedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e2126',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 72,
    lineHeight: 84,
    color: '#fff',
    fontFamily: 'Roboto-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 28,
    color: '#fff',
    fontFamily: 'Roboto',
    textAlign: 'center',
    letterSpacing: 1,
  },
});
