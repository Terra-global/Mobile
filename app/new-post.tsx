import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { useAlertStore } from '../store/alertStore';
import { useLoadingStore } from '../store/loadingStore';

export default function CreatePostScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const { showAlert } = useAlertStore();
  const setIsLoading = useLoadingStore(state => state.setIsLoading);
  const [content, setContent] = React.useState('');
  const [image, setImage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !image) return;

    try {
      setLoading(true);
      setIsLoading(true);
      const postData = { content, imageUrl: image };
      const response = await api.post('/posts', postData);
      
      if (response.data.success) {
        showAlert('Update shared successfully! 🌱', 'success');
        router.back();
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      showAlert('Failed to share update. Please try again.', 'error');
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close-outline" size={28} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>new update</Text>
        
        <TouchableOpacity 
          onPress={handlePost} 
          disabled={loading || (!content.trim() && !image)}
          style={[styles.postButton, (!content.trim() && !image) && styles.disabledButton]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#1e2126" />
          ) : (
            <Text style={styles.postButtonText}>share</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.userRow}>
            <Image 
              source={{ uri: user?.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=DemoUser' }} 
              style={styles.avatar} 
            />
            <View>
              <Text style={styles.username}>{user?.username || 'anonymous'}</Text>
              <Text style={styles.visibility}>public update</Text>
            </View>
          </View>

          <TextInput
            style={styles.input}
            placeholder="what's happening on your farm?"
            placeholderTextColor="#64748b"
            multiline
            autoFocus
            value={content}
            onChangeText={setContent}
          />

          {image && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImage} onPress={() => setImage(null)}>
                <Ionicons name="close-circle" size={24} color="rgba(0,0,0,0.6)" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolbarItem} onPress={pickImage}>
            <Ionicons name="image-outline" size={24} color="#c1ff72" />
            <Text style={styles.toolbarText}>photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarItem}><Ionicons name="location-outline" size={24} color="#64748b" /><Text style={[styles.toolbarText, { color: '#64748b' }]}>location</Text></TouchableOpacity>
          <TouchableOpacity style={styles.toolbarItem}><Ionicons name="pricetag-outline" size={24} color="#64748b" /><Text style={[styles.toolbarText, { color: '#64748b' }]}>tag</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e2126' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2d32' },
  headerTitle: { color: '#fff', fontSize: 16, fontFamily: 'Roboto-Bold', textTransform: 'lowercase' },
  closeButton: { padding: 4 },
  postButton: { backgroundColor: '#c1ff72', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, minWidth: 70, alignItems: 'center' },
  disabledButton: { opacity: 0.5 },
  postButtonText: { color: '#1e2126', fontFamily: 'Roboto-Bold', fontSize: 14 },
  content: { flex: 1, padding: 20 },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#38383d' },
  username: { color: '#fff', fontSize: 16, fontFamily: 'Roboto-Bold' },
  visibility: { color: '#64748b', fontSize: 12, fontFamily: 'Roboto' },
  input: { color: '#fff', fontSize: 18, fontFamily: 'Roboto', textAlignVertical: 'top', minHeight: 100 },
  imagePreviewContainer: { marginTop: 20, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  imagePreview: { width: '100%', height: 200, borderRadius: 12 },
  removeImage: { position: 'absolute', top: 10, right: 10, backgroundColor: '#fff', borderRadius: 12 },
  toolbar: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#2a2d32', gap: 24 },
  toolbarItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toolbarText: { color: '#c1ff72', fontSize: 14, fontFamily: 'Roboto' },
});
