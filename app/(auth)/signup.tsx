import React, { useState, useRef } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, Animated, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import api from '@/utils/api';
import { useAuthStore } from '@/store/authStore';
import { useAlertStore } from '@/store/alertStore';
import { ActivityIndicator } from 'react-native';
import CountryPicker, { Country, DARK_THEME } from 'react-native-country-picker-modal';
import * as NavigationBar from 'expo-navigation-bar';
import { handleGoogleSignIn } from '@/utils/google-auth';

const { width } = Dimensions.get('window');

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore(state => state.setAuth);
  const showAlert = useAlertStore(state => state.showAlert);

  const [activeTab, setActiveTab] = useState('email');
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Form State
  const [country, setCountry] = useState('United States');
  const [countryCode, setCountryCode] = useState<any>('US');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const nextStep = () => {
    if (!country.trim()) {
      showAlert('Please enter your country', 'error');
      return;
    }
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleSignup = async () => {
    if (!email || !password) {
      showAlert('Please fill in all fields', 'error');
      return;
    }
    if (password.length < 8) {
      showAlert('Password must be at least 8 characters', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        country,
      });

      const { user, token } = response.data.data;
      setAuth(user, token);
      
      Keyboard.dismiss();
      router.replace('/(onboarding)/welcome');
    } catch (error: any) {
      console.error('Signup Error:', error);
      let msg = 'Something went wrong';
      
      if (error.response) {
        msg = error.response.data.message || msg;
      } else if (error.request) {
        msg = 'Unable to reach the server. Please check your connection.';
      } else {
        msg = error.message;
      }
      
      showAlert(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* ── Fixed Header ── */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 40) }]}>
          <ThemedText style={styles.logoText}>Terra</ThemedText>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          {/* ── Fixed Tabs ── */}
          <View style={styles.fixedTabs}>
            <TouchableOpacity
              onPress={() => setActiveTab('email')}
              style={[styles.tab, activeTab === 'email' ? styles.activeTab : null]}
            >
              <Text style={activeTab === 'email' ? styles.activeTabText : styles.tabText}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('google')}
              style={[styles.tab, activeTab === 'google' ? styles.activeTab : null]}
            >
              <Text style={activeTab === 'google' ? styles.activeTabText : styles.tabText}>Google</Text>
            </TouchableOpacity>
            <View style={styles.flexFill} />
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.loginLinkText}>Log In</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'email' ? (
            <Animated.View style={[styles.carousel, { transform: [{ translateX: slideAnim }] }]}>
              {/* Step 1: Country */}
              <ScrollView style={styles.stepContainer} contentContainerStyle={styles.stepScrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.inputContainer}>
                  <View style={styles.countryPickerContainer}>
                    <CountryPicker
                      theme={{
                        ...DARK_THEME,
                        backgroundColor: '#1e2126',
                        onBackgroundTextColor: '#fff',
                        filterPlaceholderTextColor: '#999',
                        fontSize: 14,
                        fontFamily: 'Roboto',
                      }}
                      withFilter
                      withFlag
                      withCountryNameButton
                      withAlphaFilter
                      withCallingCode={false}
                      countryCode={countryCode}
                      onSelect={(selectedCountry: Country) => {
                        setCountry(selectedCountry.name as string);
                        setCountryCode(selectedCountry.cca2);
                      }}
                      onOpen={() => {
                        // Logic if needed
                      }}
                      onClose={() => {
                        // Logic if needed
                      }}
                      modalProps={{
                        animationType: 'slide',
                        presentationStyle: 'pageSheet',
                      }}
                    />
                    {!country && (
                      <View style={styles.placeholderOverlay} pointerEvents="none">
                        <Text style={styles.countryPlaceholder}>Select Country</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity style={styles.continueButton} onPress={nextStep}>
                  <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Step 2: Email & Password */}
              <ScrollView style={styles.stepContainer} contentContainerStyle={styles.stepScrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.inputContainer}>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Email" 
                    placeholderTextColor="#999" 
                    keyboardType="email-address" 
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                  <View style={styles.passwordContainer}>
                    <TextInput 
                      style={[styles.input, { flex: 1, backgroundColor: 'transparent' }]} 
                      placeholder="Password" 
                      placeholderTextColor="#999" 
                      secureTextEntry={!showPassword} 
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#999" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.passwordContainer}>
                    <TextInput 
                      style={[styles.input, { flex: 1, backgroundColor: 'transparent' }]} 
                      placeholder="Confirm Password" 
                      placeholderTextColor="#999" 
                      secureTextEntry={!showPassword} 
                      returnKeyType="done" 
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      onSubmitEditing={handleSignup} 
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#999" />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity 
                  style={[styles.continueButton, loading && { opacity: 0.7 }]} 
                  onPress={handleSignup}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#1e2126" />
                  ) : (
                    <Text style={styles.continueButtonText}>Sign Up</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          ) : (
            <View style={styles.googleContainer}>
              <ThemedText style={styles.googleHeading}>Create Account{"\n"}With Google OAuth</ThemedText>
              <TouchableOpacity 
                style={styles.continueButton} 
                onPress={() => handleGoogleSignIn(setAuth, router, showAlert, setLoading)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#1e2126" />
                ) : (
                  <Text style={styles.continueButtonText}>Continue With Google</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>

        {/* ── Fixed Footer ── */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TouchableOpacity onPress={() => setShowTerms(true)}>
            <Text style={styles.termsFooterText}>By Signing Up, You Accept Terms and Conditions</Text>
          </TouchableOpacity>
        </View>

        {/* ── Terms Modal ── */}
        <Modal visible={showTerms} transparent animationType="fade">
          <View style={[styles.modalOverlay, { paddingTop: insets.top }]}>
            <View style={styles.modalContent}>
              <ScrollView>
                <Text style={styles.modalTitle}>Terms and Conditions</Text>
                <Text style={styles.modalText}>
                  1. Acceptance of Terms{"\n"}
                  By accessing and using Terra, you accept and agree to be bound by the terms and provision of this agreement.{"\n\n"}
                  2. User License{"\n"}
                  Permission is granted to temporarily download one copy of the materials for personal, non-commercial transitory viewing only.{"\n\n"}
                  3. Disclaimer{"\n"}
                  The materials on Terra's application are provided on 'as is' basis. Terra makes no warranties, expressed or implied.{"\n\n"}
                  4. Limitations{"\n"}
                  In no event shall Terra or its suppliers be liable for any damages arising out of the use or inability to use the materials.
                </Text>
              </ScrollView>
              <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowTerms(false)}>
                <Text style={styles.closeModalText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e2126' },
  header: { alignItems: 'center', paddingBottom: 32, backgroundColor: '#1e2126' },
  logoText: { fontSize: 80, lineHeight: 90, fontFamily: 'Roboto-Bold', color: '#fff', textAlign: 'center', letterSpacing: -2 },
  keyboardView: { flex: 1 },
  fixedTabs: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, paddingHorizontal: 24 },
  flexFill: { flex: 1 },
  loginLinkText: { color: '#c1ff72', fontFamily: 'Roboto-Bold', fontSize: 14 },
  tab: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  activeTab: { backgroundColor: '#38383d' },
  activeTabText: { color: '#c1ff72', fontFamily: 'Roboto-Bold', fontSize: 14 },
  tabText: { color: '#fff', fontFamily: 'Roboto-Bold', fontSize: 14, opacity: 0.6 },
  carousel: { flexDirection: 'row', width: width * 2, flex: 1 },
  stepContainer: { width },
  stepScrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  inputContainer: { gap: 16, marginBottom: 32 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#38383d', borderRadius: 16, height: 60, paddingRight: 16 },
  eyeIcon: { padding: 4 },
  input: { backgroundColor: '#38383d', borderRadius: 16, height: 60, paddingLeft: 20, paddingRight: 20, color: '#fff', fontSize: 14, fontFamily: 'Roboto' },
  countryPickerContainer: {
    backgroundColor: '#38383d',
    borderRadius: 16,
    height: 60,
    justifyContent: 'center',
    paddingLeft: 8, // Adjust for flag button padding
    width: '100%',
    position: 'relative',
  },
  placeholderOverlay: {
    position: 'absolute',
    left: 52, // Positioned after flag to align with other field text
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  countryPlaceholder: {
    color: '#999',
    fontFamily: 'Roboto',
    fontSize: 14,
  },
  continueButton: { backgroundColor: '#c1ff72', borderRadius: 16, height: 60, alignItems: 'center', justifyContent: 'center' },
  continueButtonText: { color: '#1e2126', fontSize: 18, fontFamily: 'Roboto-Bold' },
  googleContainer: { flex: 1, paddingHorizontal: 24, marginTop: 20 },
  googleHeading: { fontSize: 28, fontFamily: 'Roboto-Bold', color: '#fff', lineHeight: 36, marginBottom: 40 },
  footer: { alignItems: 'center', paddingTop: 12, paddingHorizontal: 24, backgroundColor: '#1e2126' },
  termsFooterText: { color: '#999', fontSize: 13, fontFamily: 'Roboto', textAlign: 'center', lineHeight: 18 },
  modalOverlay: { flex: 1, backgroundColor: '#1e2126' },
  modalContent: { backgroundColor: '#1e2126', flex: 1, padding: 24 },
  modalTitle: { color: '#fff', fontSize: 18, fontFamily: 'Roboto-Bold', marginBottom: 16 },
  modalText: { color: '#fff', fontSize: 14, fontFamily: 'Roboto', opacity: 0.8, lineHeight: 22 },
  closeModalButton: { marginTop: 24, backgroundColor: '#38383d', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  closeModalText: { color: '#fff', fontSize: 16, fontFamily: 'Roboto-Bold' },
});
