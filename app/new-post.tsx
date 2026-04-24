import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { useAlertStore } from '../store/alertStore';
import { useLoadingStore } from '../store/loadingStore';
import { useThemeStore } from '../store/themeStore';
import { Colors } from '../constants/theme';

export default function CreatePostScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const { showAlert } = useAlertStore();
  const setIsLoading = useLoadingStore(state => state.setIsLoading);
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];
  const [content, setContent] = React.useState('');
  const [images, setImages] = React.useState<string[]>([]);
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState('');
  const [showTagInput, setShowTagInput] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // User mentions states
  const [userResults, setUserResults] = React.useState<any[]>([]);
  const [showUserResults, setShowUserResults] = React.useState(false);
  const [mentionQuery, setMentionQuery] = React.useState('');

  // Marketplace states
  const [postType, setPostType] = React.useState<'REGULAR' | 'FOR_SALE' | 'LOOKING_FOR'>('REGULAR');
  const [price, setPrice] = React.useState('');
  const [priceUnit, setPriceUnit] = React.useState('');
  const [quantity, setQuantity] = React.useState('');
  const [quantityUnit, setQuantityUnit] = React.useState('');

  const addTag = () => {
    const cleaned = tagInput.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    if (cleaned && !tags.includes(cleaned) && tags.length < 8) {
      setTags(prev => [...prev, cleaned]);
    }
    setTagInput('');
    setShowTagInput(false); // Close after adding
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = result.assets.map(asset => asset.uri);
      setImages(prev => [...prev, ...newImages].slice(0, 5));
    }
  };

  const handlePost = async () => {
    if (!content.trim() && images.length === 0) return;

    try {
      setLoading(true);
      setIsLoading(true);

      let uploadedImageUrls: string[] = [];

      // If there are images, upload them first
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((uri) => {
          const fileName = uri.split('/').pop() || 'image.jpg';
          const match = /\.(\w+)$/.exec(fileName);
          const type = match ? `image/${match[1]}` : `image`;
          
          formData.append('files', {
            uri,
            name: fileName,
            type,
          } as any);
        });
        formData.append('folder', 'posts');

        const uploadResponse = await api.post('/upload/multiple', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (uploadResponse.data.success) {
          uploadedImageUrls = uploadResponse.data.data.map((item: any) => item.url);
        }
      }

      const postData = { 
        content, 
        imageUrls: uploadedImageUrls, 
        tags,
        postType,
        price: price ? Number(price) : undefined,
        priceUnit,
        quantity: quantity ? Number(quantity) : undefined,
        quantityUnit,
      };
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

  const handleContentChange = async (text: string) => {
    setContent(text);
    
    // Detect @ for mentions
    const lastWord = text.split(/\s/).pop() || '';
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      const query = lastWord.substring(1);
      setMentionQuery(query);
      try {
        const res = await api.get(`/search?type=users&query=${query}`);
        if (res.data.success) {
          setUserResults(res.data.data);
          setShowUserResults(res.data.data.length > 0);
        }
      } catch (err) {
        console.error('Mention search failed:', err);
      }
    } else {
      setShowUserResults(false);
    }
  };

  const selectUserForMention = (username: string) => {
    const parts = content.split(/\s/);
    parts.pop(); // Remove the partial mention
    const newContent = [...parts, `@${username} `].join(' ');
    setContent(newContent);
    setShowUserResults(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close-outline" size={28} color={themeColors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>new update</Text>
        
        <TouchableOpacity 
          onPress={handlePost} 
          disabled={loading || (!content.trim() && images.length === 0)}
          style={[styles.postButton, { backgroundColor: themeColors.tint }, (!content.trim() && images.length === 0) && styles.disabledButton]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
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
              style={[styles.avatar, { backgroundColor: themeColors.card }]} 
            />
            <View>
              <Text style={[styles.username, { color: themeColors.text }]}>{user?.username || 'anonymous'}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <TouchableOpacity onPress={() => setPostType('REGULAR')}>
                  <Text style={[styles.visibility, { color: postType === 'REGULAR' ? themeColors.tint : themeColors.subtext, fontWeight: postType === 'REGULAR' ? 'bold' : 'normal' }]}>Regular</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPostType('FOR_SALE')}>
                  <Text style={[styles.visibility, { color: postType === 'FOR_SALE' ? '#10b981' : themeColors.subtext, fontWeight: postType === 'FOR_SALE' ? 'bold' : 'normal' }]}>For Sale</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPostType('LOOKING_FOR')}>
                  <Text style={[styles.visibility, { color: postType === 'LOOKING_FOR' ? '#3b82f6' : themeColors.subtext, fontWeight: postType === 'LOOKING_FOR' ? 'bold' : 'normal' }]}>Looking For</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {postType !== 'REGULAR' && (
            <View style={[styles.marketInputContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.marketInput, { color: themeColors.text, borderColor: themeColors.border, flex: 1 }]}
                  placeholder="Price (₦)"
                  placeholderTextColor={themeColors.subtext}
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
                <TextInput
                  style={[styles.marketInput, { color: themeColors.text, borderColor: themeColors.border, flex: 1 }]}
                  placeholder="Per Unit (e.g. kg)"
                  placeholderTextColor={themeColors.subtext}
                  value={priceUnit}
                  onChangeText={setPriceUnit}
                />
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.marketInput, { color: themeColors.text, borderColor: themeColors.border, flex: 1 }]}
                  placeholder="Quantity"
                  placeholderTextColor={themeColors.subtext}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                />
                <TextInput
                  style={[styles.marketInput, { color: themeColors.text, borderColor: themeColors.border, flex: 1 }]}
                  placeholder="Unit (e.g. bags)"
                  placeholderTextColor={themeColors.subtext}
                  value={quantityUnit}
                  onChangeText={setQuantityUnit}
                />
              </View>
            </View>
          )}

          <TextInput
            style={[styles.input, { color: themeColors.text }]}
            placeholder="what's happening on your farm?"
            placeholderTextColor={themeColors.subtext}
            multiline
            autoFocus
            value={content}
            onChangeText={handleContentChange}
          />

          {/* User Mentions Dropdown */}
          {showUserResults && (
            <View style={[styles.mentionsDropdown, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <ScrollView keyboardShouldPersistTaps="always" style={{ maxHeight: 200 }}>
                {userResults.map((u) => (
                  <TouchableOpacity 
                    key={u.id} 
                    style={styles.mentionItem}
                    onPress={() => selectUserForMention(u.username)}
                  >
                    <Image source={{ uri: u.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=' + u.username }} style={styles.mentionAvatar} />
                    <Text style={[styles.mentionName, { color: themeColors.text }]}>{u.username}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Tags display */}
          {tags.length > 0 && (
            <View style={styles.tagsPreviewRow}>
              {tags.map((tag, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.tagChip, { borderColor: themeColors.tint + '66', backgroundColor: themeColors.card }]}
                  onPress={() => removeTag(tag)}
                >
                  <Text style={[styles.tagChipText, { color: themeColors.tint }]}>#{tag}</Text>
                  <Ionicons name="close-circle" size={14} color={themeColors.tint} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Tag input */}
          {showTagInput && (
            <View style={[styles.tagInputRow, { borderColor: themeColors.border, backgroundColor: themeColors.card }]}>
              <Text style={{ color: themeColors.tint, fontSize: 16 }}>#</Text>
              <TextInput
                style={[styles.tagInputField, { color: themeColors.text }]}
                placeholder="add a tag (e.g. maize, web3, livestock)"
                placeholderTextColor={themeColors.subtext}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
                returnKeyType="done"
                autoFocus
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => { setTagInput(''); setShowTagInput(false); }}>
                <Ionicons name="close-circle" size={22} color={themeColors.subtext} />
              </TouchableOpacity>
              <TouchableOpacity onPress={addTag}>
                <Ionicons name="checkmark-circle" size={22} color={themeColors.tint} />
              </TouchableOpacity>
            </View>
          )}

          {images.length > 0 && (
            <View style={styles.imagesGrid}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagesScroll}>
                {images.map((uri, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image source={{ uri }} style={styles.imagePreview} />
                    <TouchableOpacity 
                      style={styles.removeImage} 
                      onPress={() => setImages(prev => prev.filter((_, i) => i !== index))}
                    >
                      <Ionicons name="close-circle" size={24} color="#f91880" />
                    </TouchableOpacity>
                  </View>
                ))}
                {images.length < 5 && (
                  <TouchableOpacity style={[styles.addMoreButton, { borderColor: themeColors.border }]} onPress={pickImage}>
                    <Ionicons name="add" size={32} color={themeColors.subtext} />
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={[styles.toolbar, { borderTopColor: themeColors.border }]}>
          <TouchableOpacity style={styles.toolbarItem} onPress={pickImage}>
            <Ionicons name="image-outline" size={24} color={themeColors.tint} />
            <Text style={[styles.toolbarText, { color: themeColors.tint }]}>photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolbarItem}
            onPress={() => setShowTagInput(prev => !prev)}
          >
            <Ionicons name="pricetag-outline" size={24} color={showTagInput ? themeColors.tint : '#64748b'} />
            <Text style={[styles.toolbarText, { color: showTagInput ? themeColors.tint : '#64748b' }]}>tag {tags.length > 0 ? `(${tags.length})` : ''}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
  },
  headerTitle: { fontSize: 16, fontFamily: 'Roboto-Bold', textTransform: 'lowercase' },
  closeButton: { padding: 4 },
  postButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, minWidth: 70, alignItems: 'center' },
  disabledButton: { opacity: 0.5 },
  postButtonText: { color: '#fff', fontFamily: 'Roboto-Bold', fontSize: 14 },
  content: { flex: 1, padding: 20 },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a1a1a' },
  username: { color: '#fff', fontSize: 16, fontFamily: 'Roboto-Bold' },
  visibility: { color: '#64748b', fontSize: 12, fontFamily: 'Roboto' },
  input: { color: '#fff', fontSize: 18, fontFamily: 'Roboto', textAlignVertical: 'top', minHeight: 100 },
  imagesGrid: { marginTop: 20, marginHorizontal: -20 },
  imagesScroll: { paddingHorizontal: 20, gap: 12 },
  imageWrapper: { position: 'relative' },
  imagePreview: { width: 140, height: 140, borderRadius: 12 },
  removeImage: { position: 'absolute', top: -10, right: -10, backgroundColor: '#fff', borderRadius: 12 },
  addMoreButton: { 
    width: 140, 
    height: 140, 
    borderRadius: 12, 
    borderWidth: 2, 
    borderStyle: 'dashed', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  toolbar: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, gap: 24 },
  toolbarItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toolbarText: { fontSize: 14, fontFamily: 'Roboto' },
  tagsPreviewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tagChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  tagChipText: { fontSize: 13, fontFamily: 'Roboto', fontWeight: '600' },
  tagInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  tagInputField: { flex: 1, fontSize: 15, fontFamily: 'Roboto' },
  marketInputContainer: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  marketInput: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, fontSize: 14, fontFamily: 'Roboto' },
  mentionsDropdown: {
    position: 'absolute',
    top: 150, // Adjust based on input position
    left: 20,
    right: 20,
    zIndex: 1000,
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  mentionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  mentionName: {
    fontSize: 14,
    fontFamily: 'Roboto-Bold',
  },
});
