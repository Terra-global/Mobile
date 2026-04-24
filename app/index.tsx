import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const token = useAuthStore(state => state.token);
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // If already logged in, skip welcome
    if (token) {
      const timer = setTimeout(() => {
        router.replace('/(tabs)');
      }, 1000);
      return () => clearTimeout(timer);
    }

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, [token]);

  if (token) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <Animated.Text style={[styles.loadingText, { color: themeColors.text }]}>Terra</Animated.Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      {/* Decorative Background Elements */}
      <View style={[styles.circle1, { backgroundColor: theme === 'dark' ? 'rgba(79, 57, 246, 0.05)' : 'rgba(79, 57, 246, 0.03)' }]} />
      <View style={[styles.circle2, { backgroundColor: theme === 'dark' ? 'rgba(79, 57, 246, 0.03)' : 'rgba(79, 57, 246, 0.02)' }]} />

      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.header, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
            }
          ]}
        >
          <View style={[styles.logoContainer, { shadowColor: themeColors.tint }]}>
            <Ionicons name="earth" size={80} color={themeColors.tint} />
          </View>
          <Text style={[styles.title, { color: themeColors.text }]}>Terra</Text>
          <Text style={[styles.subtitle, { color: themeColors.subtext }]}>Unifying the world of agriculture, one update at a time.</Text>
        </Animated.View>

        <Animated.View 
          style={[
            styles.footer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: themeColors.tint, shadowColor: themeColors.tint }]}
            onPress={() => router.push('/(auth)/signup')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.7}
          >
            <Text style={[styles.secondaryButtonText, { color: themeColors.subtext }]}>
              Already have an account? <Text style={[styles.loginHighlight, { color: themeColors.text }]}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Animated.View style={[styles.legal, { opacity: fadeAnim }]}>
        <Text style={[styles.legalText, { color: themeColors.subtext, opacity: 0.7 }]}>By continuing, you agree to our Terms and Privacy Policy.</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 42,
    fontFamily: 'Roboto',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    marginBottom: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  title: {
    fontSize: 48,
    fontFamily: 'Roboto',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 26,
    fontFamily: 'Roboto',
    maxWidth: '85%',
  },
  footer: {
    gap: 16,
  },
  primaryButton: {
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
  },
  secondaryButton: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontFamily: 'Roboto',
  },
  loginHighlight: {
    fontFamily: 'Roboto-Bold',
  },
  legal: {
    paddingHorizontal: 40,
    paddingBottom: 20,
    alignItems: 'center',
  },
  legalText: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
  // Decorative circles
  circle1: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  circle2: {
    position: 'absolute',
    bottom: '20%',
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
});
