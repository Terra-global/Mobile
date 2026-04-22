import React from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, TouchableWithoutFeedback, Keyboard, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '@/utils/api';
import { useAuthStore } from '@/store/authStore';
import { useAlertStore } from '@/store/alertStore';

export default function BioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuthStore();
  const showAlert = useAlertStore(state => state.showAlert);
  const [value, setValue] = React.useState(user?.bio || '');
  const [loading, setLoading] = React.useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await api.patch('/users/profile', { bio: value });
      updateUser({ bio: value });
      showAlert('Bio updated successfully!', 'success');
      router.back();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to update bio';
      showAlert(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
        <StatusBar style="light" />
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#c1ff72" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Bio</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.content}>
          <TextInput 
            style={[styles.textArea, { height: 120, paddingTop: 16 }]} 
            value={value} 
            onChangeText={setValue} 
            placeholder="Tell us about yourself..." 
            placeholderTextColor="#999" 
            multiline 
            textAlignVertical="top" 
          />
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
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e2126' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { color: '#fff', fontSize: 15, fontFamily: 'Roboto', opacity: 0.7, letterSpacing: 0.5 },
  content: { paddingHorizontal: 24, paddingTop: 16, gap: 16 },
  textArea: { backgroundColor: '#38383d', borderRadius: 12, minHeight: 160, padding: 16, color: '#fff', fontSize: 15, fontFamily: 'Roboto' },
  updateButton: { backgroundColor: '#c1ff72', borderRadius: 12, height: 56, alignItems: 'center', justifyContent: 'center' },
  updateButtonText: { color: '#1e2126', fontSize: 18, fontFamily: 'Roboto-Bold' },
});
