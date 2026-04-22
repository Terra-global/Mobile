import React from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import api from '@/utils/api';
import { useAuthStore } from '@/store/authStore';
import { useAlertStore } from '@/store/alertStore';
import { ActivityIndicator } from 'react-native';

export default function SocialUrlScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuthStore();
  const showAlert = useAlertStore(state => state.showAlert);
  
  const [url1, setUrl1] = React.useState(user?.socialLinks?.[0]?.url || 'https://');
  const [url2, setUrl2] = React.useState(user?.socialLinks?.[1]?.url || 'https://');
  const [url3, setUrl3] = React.useState(user?.socialLinks?.[2]?.url || 'https://');
  const [loading, setLoading] = React.useState(false);

  const handleUpdate = async () => {
    const socialLinks = [];
    if (url1 && url1 !== 'https://') socialLinks.push({ platform: 'Link 1', url: url1 });
    if (url2 && url2 !== 'https://') socialLinks.push({ platform: 'Link 2', url: url2 });
    if (url3 && url3 !== 'https://') socialLinks.push({ platform: 'Link 3', url: url3 });

    setLoading(true);
    try {
      await api.patch('/users/profile', { socialLinks });
      updateUser({ socialLinks });
      showAlert('Social links updated successfully!', 'success');
      router.back();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to update social links';
      showAlert(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
        <StatusBar style="light" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#c1ff72" />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Social Url</Text>
            <View style={styles.backButton} />
          </View>

          {/* Inputs */}
          <View style={styles.content}>
            <TextInput style={[styles.input, styles.inputActive]} value={url1} onChangeText={setUrl1} placeholderTextColor="#999" keyboardType="url" autoCapitalize="none" />
            <TextInput style={styles.input} value={url2} onChangeText={setUrl2} placeholderTextColor="#999" keyboardType="url" autoCapitalize="none" />
            <TextInput style={styles.input} value={url3} onChangeText={setUrl3} placeholderTextColor="#999" keyboardType="url" autoCapitalize="none" returnKeyType="done" onSubmitEditing={Keyboard.dismiss} />
          </View>

          {/* Update Button */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <TouchableOpacity 
              style={[styles.updateButton, loading && { opacity: 0.7 }]} 
              onPress={handleUpdate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#1e2126" />
              ) : (
                <Text style={styles.updateButtonText}>Update</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e2126' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { color: '#fff', fontSize: 15, fontFamily: 'Roboto', opacity: 0.7, letterSpacing: 0.5 },
  content: { paddingHorizontal: 24, paddingTop: 16, gap: 16, flex: 1 },
  input: { backgroundColor: '#38383d', borderRadius: 12, height: 56, paddingHorizontal: 16, color: '#fff', fontSize: 15, fontFamily: 'Roboto' },
  inputActive: { borderWidth: 1.5, borderColor: '#7b5af5' },
  footer: { paddingHorizontal: 24, paddingTop: 12, backgroundColor: '#1e2126' },
  updateButton: { backgroundColor: '#c1ff72', borderRadius: 12, height: 56, alignItems: 'center', justifyContent: 'center' },
  updateButtonText: { color: '#1e2126', fontSize: 18, fontFamily: 'Roboto-Bold' },
});
