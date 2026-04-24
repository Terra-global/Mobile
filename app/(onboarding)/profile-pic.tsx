import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';

import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { useAlertStore } from '../../store/alertStore';

const AVATAR_OPTIONS = [
  'DemoUser', 'User123', 'Anon42', 'CoolCat', 'SpaceDog', 'PixelArt',
];

export default function ProfilePicScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuthStore();
  const { showAlert } = useAlertStore();
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Use current user avatar if it exists and isn't a dicebear one
  const currentAvatar = user?.avatarUrl || `https://api.dicebear.com/7.x/identicon/png?seed=${AVATAR_OPTIONS[selected]}`;

  const handleSelect = async (index: number) => {
    setSelected(index);
    const url = `https://api.dicebear.com/7.x/identicon/png?seed=${AVATAR_OPTIONS[index]}`;
    try {
      setLoading(true);
      await api.patch('/users/profile', { avatarUrl: url });
      updateUser({ avatarUrl: url });
      showAlert('Avatar updated!', 'success');
    } catch (error) {
      console.error('Failed to update avatar:', error);
      showAlert('Failed to save selected avatar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Gallery access needed for uploads', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      
      // Extract file name and type from URI
      const filename = uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);
      
      formData.append('folder', 'avatars');

      console.log('Uploading to:', api.defaults.baseURL + '/upload/single');
      const response = await api.post('/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const newUrl = response.data.data.url;
        // Update user profile with the new R2 URL
        await api.patch('/users/profile', { avatarUrl: newUrl });
        updateUser({ avatarUrl: newUrl });
        showAlert('Profile picture updated!', 'success');
      }
    } catch (error: any) {
      console.error('Upload detailed error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config?.url
      });
      showAlert(error.response?.data?.message || error.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background, paddingTop: Math.max(insets.top, 20) }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={themeColors.tint} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: themeColors.subtext }]}>Profile Picture</Text>
        <TouchableOpacity 
          style={styles.nextButton} 
          onPress={() => router.push('/(onboarding)/bio')}
        >
          <Text style={[styles.nextText, { color: themeColors.tint }]}>Next</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Avatar Display */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: currentAvatar }} style={styles.avatar} />
            {uploading && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator color={themeColors.tint} />
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.uploadBtn, { backgroundColor: themeColors.tint }]} 
            onPress={pickImage}
            disabled={uploading}
          >
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.uploadBtnText}>Upload from Gallery</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={[styles.line, { backgroundColor: themeColors.border }]} />
          <Text style={[styles.dividerText, { color: themeColors.subtext }]}>OR CHOOSE AN AVATAR</Text>
          <View style={[styles.line, { backgroundColor: themeColors.border }]} />
        </View>

        {/* Avatar Grid */}
        <View style={styles.grid}>
          {AVATAR_OPTIONS.map((seed, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleSelect(index)}
              style={[
                styles.gridItem, 
                currentAvatar.includes(AVATAR_OPTIONS[index]) && { borderColor: themeColors.tint }
              ]}
              disabled={loading || uploading}
            >
              <Image 
                source={{ uri: `https://api.dicebear.com/7.x/identicon/png?seed=${seed}` }}
                style={styles.gridAvatar} 
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.saveNote, { color: themeColors.subtext }]}>Changes are saved automatically</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 15, fontFamily: 'Roboto', letterSpacing: 0.5 },
  nextButton: { paddingHorizontal: 12, paddingVertical: 6 },
  nextText: { fontSize: 16, fontWeight: '600' },
  
  content: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  
  avatarContainer: { alignItems: 'center', marginBottom: 40 },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#38383d',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: { width: '100%', height: '100%' },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#c1ff72',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
  },
  uploadBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 30, width: '100%' },
  line: { flex: 1, height: 1 },
  dividerText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginBottom: 40 },
  gridItem: { borderRadius: 36, borderWidth: 2, borderColor: 'transparent', padding: 2 },
  gridAvatar: { width: 64, height: 64, borderRadius: 32 },
  
  saveNote: { fontSize: 12, fontFamily: 'Roboto' },
});
