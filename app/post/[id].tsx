import React from 'react';
import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Share, Dimensions, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import api from '../../utils/api';
import UserPreviewModal from '../../components/UserPreviewModal';
import { useAlertStore } from '../../store/alertStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [post, setPost] = React.useState<any>(null);
  const [comments, setComments] = React.useState<any[]>([]);
  const [newComment, setNewComment] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [postingComment, setPostingComment] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = React.useState(false);
  const { showAlert } = useAlertStore();
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];

  React.useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await api.get(`/posts/${postId}`);
      if (response.data.success) {
        setPost(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch post:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`/posts/${postId}/comments`);
      if (response.data.success) {
        setComments(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const [liking, setLiking] = React.useState(false);

  const toggleLike = async () => {
    if (!post || liking) return;
    try {
      setLiking(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const isLiked = post.likes && post.likes.length > 0;
      setPost({
        ...post,
        _count: {
          ...post._count,
          likes: isLiked ? Math.max(0, post._count.likes - 1) : post._count.likes + 1
        },
        likes: isLiked ? [] : [{ id: 'temp' }]
      });
      await api.post(`/posts/${postId}/like`);
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setLiking(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      setPostingComment(true);
      const response = await api.post(`/posts/${postId}/comments`, { content: newComment });
      if (response.data.success) {
        setComments([response.data.data, ...comments]);
        setPost({
          ...post,
          _count: { ...post._count, comments: post._count.comments + 1 }
        });
        setNewComment('');
        showAlert('Comment posted! 💬', 'success');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      showAlert('Failed to post comment. Try again.', 'error');
    } finally {
      setPostingComment(false);
    }
  };

  const handleShare = async () => {
    try {
      Haptics.selectionAsync();
      await Share.share({
        message: `Check out this update on Terra: "${post.content}"`,
        url: post.imageUrls?.[0]
      });
    } catch (error) {
      console.error('Sharing failed:', error);
    }
  };

  const handleDeletePost = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const res = await api.delete(`/posts/${postId}`);
      if (res.data.success) {
        showAlert('Post deleted', 'success');
        router.back();
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      showAlert('Failed to delete post', 'error');
    }
  };

  if (loading) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator color={themeColors.tint} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.errorText, { color: themeColors.text }]}>Post not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: themeColors.tint }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLiked = post.likes && post.likes.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <SafeAreaView edges={['top']} style={[styles.headerContainer, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={themeColors.tint} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>post</Text>
          {post.userId === useAuthStore.getState().user?.id ? (
            <TouchableOpacity onPress={() => {
              Alert.alert(
                'Delete Post',
                'Are you sure you want to delete this update?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: handleDeletePost },
                ]
              );
            }} style={styles.backButton}>
              <Ionicons name="trash-outline" size={24} color="#f91880" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Author */}
          <View style={styles.authorRow}>
            <TouchableOpacity onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedUserId(post.userId);
              setIsPreviewVisible(true);
            }}>
              <Image 
                source={{ uri: post.user.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=' + post.user.username }} 
                style={[styles.avatar, { backgroundColor: themeColors.card }]} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              setSelectedUserId(post.userId);
              setIsPreviewVisible(true);
            }}>
              <View>
                <Text style={[styles.authorName, { color: themeColors.text }]}>{post.user.username || 'Anonymous'}</Text>
                <Text style={[styles.timeText, { color: themeColors.subtext }]}>{new Date(post.createdAt).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <Text style={[styles.content, { color: themeColors.text }]}>{post.content}</Text>

          {/* Images Gallery */}
          {post.imageUrls && post.imageUrls.length > 0 && (
            <View style={styles.imageGalleryContainer}>
              <ScrollView 
                horizontal 
                pagingEnabled 
                showsHorizontalScrollIndicator={false}
                style={styles.imageGallery}
              >
                {post.imageUrls.map((img: string, idx: number) => (
                  <Image 
                    key={idx} 
                    source={{ uri: img }} 
                    style={[styles.postImage, { width: Dimensions.get('window').width - 40, backgroundColor: themeColors.card }]} 
                    resizeMode="cover" 
                  />
                ))}
              </ScrollView>
              {post.imageUrls.length > 1 && (
                <View style={styles.paginationDot}>
                  <Text style={styles.paginationText}>1/{post.imageUrls.length}</Text>
                </View>
              )}
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <Text style={[styles.statText, { color: themeColors.subtext }]}><Text style={[styles.statNumber, { color: themeColors.text }]}>{post._count?.likes || 0}</Text> likes</Text>
            <Text style={[styles.statText, { color: themeColors.subtext }]}><Text style={[styles.statNumber, { color: themeColors.text }]}>{post._count?.comments || 0}</Text> comments</Text>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          {/* Interactions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} onPress={toggleLike}>
              <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "#f91880" : themeColors.subtext} />
              <Text style={[styles.actionText, { color: isLiked ? '#f91880' : themeColors.subtext }]}>like</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={22} color={themeColors.subtext} />
              <Text style={[styles.actionText, { color: themeColors.subtext }]}>comment</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={24} color={themeColors.subtext} />
              <Text style={[styles.actionText, { color: themeColors.subtext }]}>share</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
          
          {/* Comments List */}
          <View style={styles.commentsSection}>
            <Text style={[styles.sectionLabel, { color: themeColors.text }]}>comments ({post._count?.comments || 0})</Text>
            
            {comments.length === 0 ? (
              <Text style={[styles.placeholderText, { color: themeColors.subtext }]}>no comments yet. be the first to share your thoughts!</Text>
            ) : (
              comments.map((comment: any) => (
                <View key={comment.id} style={[styles.commentItem, { borderBottomColor: themeColors.border }]}>
                  <TouchableOpacity onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedUserId(comment.userId);
                    setIsPreviewVisible(true);
                  }}>
                    <Image 
                      source={{ uri: comment.user.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=' + comment.user.username }} 
                      style={[styles.commentAvatar, { backgroundColor: themeColors.card }]} 
                    />
                  </TouchableOpacity>
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                      <TouchableOpacity onPress={() => {
                        setSelectedUserId(comment.userId);
                        setIsPreviewVisible(true);
                      }}>
                        <Text style={[styles.commentUser, { color: themeColors.text }]}>{comment.user.username}</Text>
                      </TouchableOpacity>
                      <Text style={[styles.commentTime, { color: themeColors.subtext }]}>{new Date(comment.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <Text style={[styles.commentText, { color: themeColors.text }]}>{comment.content}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Comment Input Bar */}
        <View style={[
          styles.inputBar, 
          { 
            paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
            backgroundColor: themeColors.background,
            borderTopColor: themeColors.border
          }
        ]}>
          <TextInput
            style={[styles.input, { color: themeColors.text }]}
            placeholder="add a comment..."
            placeholderTextColor={themeColors.subtext}
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <TouchableOpacity 
            onPress={handleAddComment} 
            disabled={postingComment || !newComment.trim()}
            style={styles.sendButton}
          >
            {postingComment ? (
              <ActivityIndicator size="small" color={themeColors.tint} />
            ) : (
              <Ionicons name="send" size={20} color={newComment.trim() ? themeColors.tint : themeColors.border} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <UserPreviewModal 
        userId={selectedUserId}
        isVisible={isPreviewVisible}
        onClose={() => setIsPreviewVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { borderBottomWidth: 0.5 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: 'Roboto-Bold', textTransform: 'lowercase' },
  scrollContent: { padding: 20 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  authorName: { fontSize: 16, fontFamily: 'Roboto-Bold' },
  timeText: { fontSize: 13, fontFamily: 'Roboto' },
  content: { fontSize: 18, lineHeight: 28, fontFamily: 'Roboto', marginBottom: 20 },
  imageGalleryContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  imageGallery: {
    borderRadius: 12,
  },
  postImage: { height: 300, borderRadius: 12 },
  paginationDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paginationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  statText: { fontSize: 14, fontFamily: 'Roboto' },
  statNumber: { fontWeight: 'bold' },
  divider: { height: 0.5, width: '100%' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionText: { fontSize: 14, fontFamily: 'Roboto-Bold' },
  commentsSection: { paddingVertical: 20 },
  sectionLabel: { fontSize: 16, fontFamily: 'Roboto-Bold', marginBottom: 20, textTransform: 'lowercase' },
  commentItem: { 
    flexDirection: 'row', 
    gap: 12, 
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: -20,
    borderBottomWidth: 0.5,
  },
  commentAvatar: { width: 36, height: 36, borderRadius: 18 },
  commentContent: { flex: 1 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentUser: { fontSize: 13, fontFamily: 'Roboto-Bold' },
  commentTime: { fontSize: 11 },
  commentText: { fontSize: 14, lineHeight: 20 },
  placeholderText: { fontSize: 14, fontFamily: 'Roboto', textAlign: 'center', marginTop: 20 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  input: { flex: 1, fontSize: 15, maxHeight: 100, paddingVertical: 8 },
  sendButton: { padding: 8 },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 16 },
  backLink: { fontSize: 14 },
});
