import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useDrawer } from '../../components/SideDrawer';
import PostCard from '../../components/PostCard';
import UserPreviewModal from '../../components/UserPreviewModal';
import api from '../../utils/api';
import { useLoadingStore } from '../../store/loadingStore';
import Shortcuts from '../../components/Shortcuts';


export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const { openDrawer } = useDrawer();
  const setIsLoading = useLoadingStore(state => state.setIsLoading);
  const [posts, setPosts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = React.useState(false);

  React.useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/posts/feed');
      if (response.data.success) {
        setPosts(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch feed:', error);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  const [processingLikes, setProcessingLikes] = React.useState<Set<string>>(new Set());

  const toggleLike = async (postId: string) => {
    if (processingLikes.has(postId)) return;
    
    try {
      setProcessingLikes(prev => new Set(prev).add(postId));

      // Optimistic UI update
      setPosts(currentPosts => currentPosts.map(post => {
        if (post.id === postId) {
          const isLiked = post.likes && post.likes.length > 0;
          return {
            ...post,
            _count: {
              ...post._count,
              likes: isLiked ? Math.max(0, post._count.likes - 1) : post._count.likes + 1
            },
            likes: isLiked ? [] : [{ id: 'temp-id' }]
          };
        }
        return post;
      }));

      await api.post(`/posts/${postId}/like`);
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // Optional: Fetch posts again to sync state if failed
      fetchPosts();
    } finally {
      setProcessingLikes(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'good morning';
    if (hour < 18) return 'good afternoon';
    return 'good evening';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <TextInput 
            style={styles.searchInput} 
            placeholder="search feed..." 
            placeholderTextColor="#64748b"
          />
        </View>

        <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
          <Ionicons name="menu-outline" size={28} color="#c1ff72" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchPosts} tintColor="#c1ff72" />
        }
      >
        <Text style={styles.greeting}>{getGreeting()}, {user?.username?.toLowerCase() || 'user'}</Text>
        
        <Text style={styles.sectionTitle}>latest updates</Text>
        
        {loading && posts.length === 0 ? (
          <View style={{ paddingVertical: 40 }}>
            <ActivityIndicator color="#c1ff72" />
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyFeed}>
            <Ionicons name="newspaper-outline" size={48} color="#2a2d34" />
            <Text style={styles.emptyText}>no updates yet. start a conversation!</Text>
          </View>
        ) : (
          posts.map(post => (
            <PostCard 
              key={post.id} 
              id={post.id}
              author={{
                name: post.user.username || 'Anonymous',
                avatar: post.user.avatarUrl
              }}
              time={new Date(post.createdAt).toLocaleDateString()}
              content={post.content}
              image={post.imageUrl}
              likes={post._count?.likes || 0}
              comments={post._count?.comments || 0}
              isLiked={post.likes && post.likes.length > 0}
              onLikePress={() => toggleLike(post.id)}
              onAuthorPress={() => {
                setSelectedUserId(post.userId);
                setIsPreviewVisible(true);
              }}
              onPress={() => router.push({
                pathname: '/post/[id]',
                params: { id: post.id }
              })}
            />
          ))
        )}
      </ScrollView>

      <UserPreviewModal 
        userId={selectedUserId}
        isVisible={isPreviewVisible}
        onClose={() => setIsPreviewVisible(false)}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e2126' },
  floatingSidebar: {
    position: 'absolute',
    right: 12,
    top: '30%',
    zIndex: 100,
  },
  topBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 10, 
    paddingVertical: 12,
    gap: 10
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: { flex: 1 },
  searchInput: { 
    backgroundColor: '#38383d', 
    borderRadius: 20, 
    height: 40, 
    paddingHorizontal: 16, 
    color: '#c1ff72', 
    fontSize: 13, 
    fontFamily: 'Roboto' 
  },
  
  scrollContent: { paddingTop: 12, paddingBottom: 100 },
  greeting: { color: '#fff', fontSize: 24, fontFamily: 'Roboto-Bold', marginBottom: 24, letterSpacing: -0.5, paddingHorizontal: 20 },
  
  sectionTitle: { 
    color: '#fff', 
    fontSize: 13, 
    fontFamily: 'Roboto', 
    marginBottom: 16, 
    textTransform: 'lowercase',
    opacity: 0.6,
    letterSpacing: 1,
    paddingHorizontal: 20
  },
  emptyFeed: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    fontFamily: 'Roboto',
    textAlign: 'center',
    opacity: 0.8,
  }
});
