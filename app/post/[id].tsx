import React from 'react';
import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import api from '../../utils/api';
import UserPreviewModal from '../../components/UserPreviewModal';
import { useAlertStore } from '../../store/alertStore';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
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

  React.useEffect(() => {
    if (id) {
      fetchPost();
      fetchComments();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await api.get(`/posts/${id}`);
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
      const response = await api.get(`/posts/${id}/comments`);
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
      const isLiked = post.likes && post.likes.length > 0;
      setPost({
        ...post,
        _count: {
          ...post._count,
          likes: isLiked ? Math.max(0, post._count.likes - 1) : post._count.likes + 1
        },
        likes: isLiked ? [] : [{ id: 'temp' }]
      });
      await api.post(`/posts/${id}/like`);
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
      const response = await api.post(`/posts/${id}/comments`, { content: newComment });
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
      await Share.share({
        message: `Check out this update on Terra: "${post.content}"`,
        url: post.imageUrl
      });
    } catch (error) {
      console.error('Sharing failed:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.errorContainer}>
        <ActivityIndicator color="#c1ff72" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Post not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLiked = post.likes && post.likes.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#c1ff72" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>post</Text>
          <View style={{ width: 40 }} />
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
              setSelectedUserId(post.userId);
              setIsPreviewVisible(true);
            }}>
              <Image 
                source={{ uri: post.user.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=' + post.user.username }} 
                style={styles.avatar} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              setSelectedUserId(post.userId);
              setIsPreviewVisible(true);
            }}>
              <View>
                <Text style={styles.authorName}>{post.user.username || 'Anonymous'}</Text>
                <Text style={styles.timeText}>{new Date(post.createdAt).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <Text style={styles.content}>{post.content}</Text>

          {/* Image */}
          {post.imageUrl && (
            <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <Text style={styles.statText}><Text style={styles.statNumber}>{post._count?.likes || 0}</Text> likes</Text>
            <Text style={styles.statText}><Text style={styles.statNumber}>{post._count?.comments || 0}</Text> comments</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Interactions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} onPress={toggleLike}>
              <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? "#ff4b4b" : "#94a3b8"} />
              <Text style={[styles.actionText, isLiked && { color: '#ff4b4b' }]}>like</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={22} color="#94a3b8" />
              <Text style={styles.actionText}>comment</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={24} color="#94a3b8" />
              <Text style={styles.actionText}>share</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />
          
          {/* Comments List */}
          <View style={styles.commentsSection}>
            <Text style={styles.sectionLabel}>comments ({post._count?.comments || 0})</Text>
            
            {comments.length === 0 ? (
              <Text style={styles.placeholderText}>no comments yet. be the first to share your thoughts!</Text>
            ) : (
              comments.map((comment: any) => (
                <View key={comment.id} style={styles.commentItem}>
                  <TouchableOpacity onPress={() => {
                    setSelectedUserId(comment.userId);
                    setIsPreviewVisible(true);
                  }}>
                    <Image 
                      source={{ uri: comment.user.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=' + comment.user.username }} 
                      style={styles.commentAvatar} 
                    />
                  </TouchableOpacity>
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                      <TouchableOpacity onPress={() => {
                        setSelectedUserId(comment.userId);
                        setIsPreviewVisible(true);
                      }}>
                        <Text style={styles.commentUser}>{comment.user.username}</Text>
                      </TouchableOpacity>
                      <Text style={styles.commentTime}>{new Date(comment.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.commentText}>{comment.content}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Comment Input Bar */}
        <View style={[
          styles.inputBar, 
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }
        ]}>
          <TextInput
            style={styles.input}
            placeholder="add a comment..."
            placeholderTextColor="#64748b"
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
              <ActivityIndicator size="small" color="#c1ff72" />
            ) : (
              <Ionicons name="send" size={20} color={newComment.trim() ? "#c1ff72" : "#38383d"} />
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
  container: { flex: 1, backgroundColor: '#1e2126' },
  headerContainer: { backgroundColor: '#1e2126', borderBottomWidth: 1, borderBottomColor: '#2a2d34' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 18, fontFamily: 'Roboto-Bold', textTransform: 'lowercase' },
  scrollContent: { padding: 20 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#38383d' },
  authorName: { color: '#fff', fontSize: 16, fontFamily: 'Roboto-Bold' },
  timeText: { color: '#64748b', fontSize: 13, fontFamily: 'Roboto' },
  content: { color: '#e2e8f0', fontSize: 18, lineHeight: 28, fontFamily: 'Roboto', marginBottom: 20 },
  postImage: { width: '100%', height: 300, borderRadius: 12, marginBottom: 20, backgroundColor: '#2a2d34' },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  statText: { color: '#64748b', fontSize: 14, fontFamily: 'Roboto' },
  statNumber: { color: '#fff', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#2a2d34', width: '100%' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionText: { color: '#94a3b8', fontSize: 14, fontFamily: 'Roboto-Bold' },
  commentsSection: { paddingVertical: 20 },
  sectionLabel: { color: '#fff', fontSize: 16, fontFamily: 'Roboto-Bold', marginBottom: 20, textTransform: 'lowercase' },
  commentItem: { 
    flexDirection: 'row', 
    gap: 12, 
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: -20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2d34',
  },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#38383d' },
  commentContent: { flex: 1 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentUser: { color: '#fff', fontSize: 13, fontFamily: 'Roboto-Bold' },
  commentTime: { color: '#64748b', fontSize: 11 },
  commentText: { color: '#e2e8f0', fontSize: 14, lineHeight: 20 },
  placeholderText: { color: '#64748b', fontSize: 14, fontFamily: 'Roboto', textAlign: 'center', marginTop: 20 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2a2d34',
    backgroundColor: '#1e2126',
  },
  input: { flex: 1, color: '#fff', fontSize: 15, maxHeight: 100, paddingVertical: 8 },
  sendButton: { padding: 8 },
  errorContainer: { flex: 1, backgroundColor: '#1e2126', alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { color: '#fff', fontSize: 16 },
  backLink: { color: '#c1ff72', fontSize: 14 },
});
