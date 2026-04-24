import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import api from '@/utils/api';
import { useAuthStore } from '@/store/authStore';
import { useAlertStore } from '@/store/alertStore';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';
import { ActivityIndicator } from 'react-native';
import { handleGoogleSignIn } from '@/utils/google-auth';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore(state => state.setAuth);
  const showAlert = useAlertStore(state => state.showAlert);
  const [errorField, setErrorField] = useState<string | null>(null);
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorField(!email ? 'email' : 'password');
      showAlert('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    setErrorField(null);
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { user, token } = response.data.data;
      setAuth(user, token);
      
      Keyboard.dismiss();
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Login Error:', error);
      Keyboard.dismiss(); // Ensure keyboard is down so they see the alert
      
      let msg = 'Invalid email or password';
      if (error.response) {
        msg = error.response.data.message || msg;
        if (msg.toLowerCase().includes('password')) setErrorField('password');
        else if (msg.toLowerCase().includes('email')) setErrorField('email');
        else setErrorField('both');
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
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

        {/* ── Fixed Header ── */}
        <View style={[styles.header, { backgroundColor: themeColors.background, paddingTop: Math.max(insets.top, 40) }]}>
          <ThemedText style={[styles.logoText, { color: themeColors.text }]}>Terra</ThemedText>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          {/* ── Scrollable Form ── */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Sign Up link */}
            <View style={styles.formHeader}>
              <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                <Text style={[styles.signUpText, { color: themeColors.tint }]}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input, 
                  { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border },
                  (errorField === 'email' || errorField === 'both') && { borderColor: '#ff5a5a', borderWidth: 1 }
                ]}
                placeholder="Email"
                placeholderTextColor={themeColors.subtext}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errorField === 'email' || errorField === 'both') setErrorField(null);
                }}
              />
              <View style={[
                styles.passwordContainer,
                { backgroundColor: themeColors.card, borderColor: themeColors.border },
                (errorField === 'password' || errorField === 'both') && { borderColor: '#ff5a5a', borderWidth: 1 }
              ]}>
                <TextInput
                  style={[styles.input, { flex: 1, backgroundColor: 'transparent', borderWidth: 0, color: themeColors.text }]}
                  placeholder="Password"
                  placeholderTextColor={themeColors.subtext}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errorField === 'password' || errorField === 'both') setErrorField(null);
                  }}
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color={themeColors.subtext} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, { backgroundColor: themeColors.tint }, loading && { opacity: 0.7 }]} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Login to Continue</Text>
              )}
            </TouchableOpacity>

            <Text style={[styles.orText, { color: themeColors.text }]}>Or</Text>

            <TouchableOpacity 
              style={[styles.googleButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} 
              onPress={() => handleGoogleSignIn(setAuth, router, showAlert, setLoading)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={themeColors.text} />
              ) : (
                <Text style={[styles.googleButtonText, { color: themeColors.text }]}>Continue With Google</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* ── Fixed Footer ── */}
        <View style={[styles.footer, { backgroundColor: themeColors.background, paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TouchableOpacity onPress={() => setShowTerms(true)}>
            <Text style={[styles.privacyText, { color: themeColors.subtext }]}>Terms and Conditions</Text>
          </TouchableOpacity>
        </View>

        {/* ── Terms Modal ── */}
        <Modal visible={showTerms} transparent animationType="fade">
          <View style={[styles.modalOverlay, { backgroundColor: themeColors.background, paddingTop: insets.top }]}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.background }]}>
              <ScrollView>
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>Terms and Conditions</Text>
                <Text style={[styles.modalText, { color: themeColors.text }]}>
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
              <TouchableOpacity style={[styles.closeModalButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} onPress={() => setShowTerms(false)}>
                <Text style={[styles.closeModalText, { color: themeColors.text }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingBottom: 32 },
  logoText: { fontSize: 80, lineHeight: 90, fontFamily: 'Roboto-Bold', textAlign: 'center', letterSpacing: -2 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24 },
  formHeader: { alignItems: 'flex-end', marginBottom: 20 },
  signUpText: { fontFamily: 'Roboto-Bold', fontSize: 14 },
  inputContainer: { gap: 16, marginBottom: 24 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, height: 60, paddingRight: 16, borderWidth: 1 },
  eyeIcon: { padding: 4 },
  input: { borderRadius: 16, height: 60, paddingLeft: 20, paddingRight: 20, fontSize: 14, fontFamily: 'Roboto', borderWidth: 1 },
  loginButton: { borderRadius: 16, height: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  loginButtonText: { color: '#fff', fontSize: 18, fontFamily: 'Roboto-Bold' },
  orText: { textAlign: 'center', marginBottom: 16, fontFamily: 'Roboto', opacity: 0.8 },
  googleButton: { borderRadius: 30, height: 60, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  googleButtonText: { fontSize: 16, fontFamily: 'Roboto-Bold' },
  footer: { alignItems: 'center', paddingTop: 16 },
  privacyText: { fontSize: 14, fontFamily: 'Roboto', textDecorationLine: 'underline' },
  modalOverlay: { flex: 1 },
  modalContent: { flex: 1, padding: 24 },
  modalTitle: { fontSize: 18, fontFamily: 'Roboto-Bold', marginBottom: 16 },
  modalText: { fontSize: 14, fontFamily: 'Roboto', opacity: 0.8, lineHeight: 22 },
  closeModalButton: { marginTop: 24, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  closeModalText: { fontSize: 16, fontFamily: 'Roboto-Bold' },
});
