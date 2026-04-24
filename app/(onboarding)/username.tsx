import React from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import api from '@/utils/api';
import { useAuthStore } from '@/store/authStore';
import { useAlertStore } from '@/store/alertStore';
import { ActivityIndicator } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';

export default function UsernameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuthStore();
  const showAlert = useAlertStore(state => state.showAlert);
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];
  const [value, setValue] = React.useState(user?.username || 'Demo User');
  const [loading, setLoading] = React.useState(false);

  const handleUpdate = async () => {
    if (!value.trim()) {
      showAlert('Username cannot be empty', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.patch('/users/profile', { username: value });
      updateUser({ username: value });
      router.back();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to update username';
      showAlert(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: themeColors.background, paddingTop: Math.max(insets.top, 20) }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={themeColors.tint} />
          </TouchableOpacity>
          <Text style={[styles.topBarTitle, { color: themeColors.subtext }]}>Username</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.content}>
          <TextInput 
            style={[styles.input, { backgroundColor: themeColors.card, color: themeColors.text }]} 
            value={value} 
            onChangeText={setValue} 
            placeholderTextColor={themeColors.subtext} 
            autoCapitalize="none" 
          />
          <TouchableOpacity 
            style={[styles.updateButton, { backgroundColor: themeColors.tint }, loading && { opacity: 0.7 }]} 
            onPress={handleUpdate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.updateButtonText}>Update</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 15, fontFamily: 'Roboto', letterSpacing: 0.5 },
  content: { paddingHorizontal: 24, paddingTop: 16, gap: 16 },
  input: { borderRadius: 12, height: 56, paddingHorizontal: 16, fontSize: 15, fontFamily: 'Roboto' },
  updateButton: { borderRadius: 12, height: 56, alignItems: 'center', justifyContent: 'center' },
  updateButtonText: { color: '#fff', fontSize: 18, fontFamily: 'Roboto-Bold' },
});
