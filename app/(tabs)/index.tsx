import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useDrawer } from '../../components/SideDrawer';
import PostCard from '../../components/PostCard';
import UserPreviewModal from '../../components/UserPreviewModal';
import api from '../../utils/api';
import { useLoadingStore } from '../../store/loadingStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../constants/theme';
import Shortcuts from '../../components/Shortcuts';
import LiveTownhallHub from '../../components/LiveTownhallHub';


export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const { openDrawer } = useDrawer();
  const setIsLoading = useLoadingStore(state => state.setIsLoading);
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];
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

  const handleDeletePost = async (postId: string) => {
    try {
      const res = await api.delete(`/posts/${postId}`);
      if (res.data.success) {
        setPosts(prev => prev.filter(p => p.id !== postId));
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'good morning';
    if (hour < 18) return 'good afternoon';
    return 'good evening';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.searchBox} 
          onPress={() => router.push('/search')}
        >
          <View style={[styles.searchInput, { 
            backgroundColor: themeColors.card, 
            borderColor: themeColors.border,
            justifyContent: 'center'
          }]}>
            <Text style={{ color: themeColors.subtext, fontFamily: 'Roboto' }}>search feed...</Text>
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/messages' as any)}>
            <Ionicons name="chatbubbles-outline" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
            <Ionicons name="apps-outline" size={26} color={themeColors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchPosts} tintColor={themeColors.tint} />
        }
      >
        <Text style={[styles.greeting, { color: themeColors.text }]}>{getGreeting()}, {user?.username?.toLowerCase() || 'user'}</Text>
        
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>latest updates</Text>
        
        {loading && posts.length === 0 ? (
          <View style={{ paddingVertical: 40 }}>
            <ActivityIndicator color={themeColors.tint} />
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyFeed}>
            <Ionicons name="newspaper-outline" size={48} color={themeColors.border} />
            <Text style={[styles.emptyText, { color: themeColors.subtext }]}>no updates yet. start a conversation!</Text>
          </View>
        ) : (
          posts.map(post => (
            <PostCard 
              key={post.id} 
              id={post.id}
              author={{
                id: post.user.id,
                name: post.user.username || 'Anonymous',
                avatar: post.user.avatarUrl,
                farmType: post.user.farmType?.name,
              }}
              onMessagePress={
                user?.id !== post.user.id 
                  ? () => router.push(`/messages/${post.user.id}?name=${encodeURIComponent(post.user.username)}` as any)
                  : undefined
              }
              time={new Date(post.createdAt).toLocaleDateString()}
              content={post.content}
              tags={post.tags}
              postType={post.postType}
              price={post.price}
              priceUnit={post.priceUnit}
              quantity={post.quantity}
              quantityUnit={post.quantityUnit}
              location={post.location}
              images={post.imageUrls}
              likes={post._count?.likes || 0}
              comments={post._count?.comments || 0}
              views={post.views || 0}
              isLiked={post.likes && post.likes.length > 0}
              onLikePress={() => toggleLike(post.id)}
              onDeletePress={post.userId === user?.id ? () => handleDeletePost(post.id) : undefined}
              onAuthorPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

      {/* Floating Market Square Button */}
      <TouchableOpacity 
        style={[styles.floatingSquare, { backgroundColor: themeColors.tint }]}
        onPress={() => router.push('/squares' as any)}
      >
        <Ionicons name="megaphone" size={24} color="#fff" />
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    borderRadius: 12, 
    height: 44, 
    paddingHorizontal: 16, 
    fontSize: 14, 
    fontFamily: 'Roboto',
    borderWidth: 1,
  },
  
  scrollContent: { paddingTop: 12, paddingBottom: 100 },
  greeting: { fontSize: 24, fontFamily: 'Roboto-Bold', marginBottom: 24, letterSpacing: -0.5, paddingHorizontal: 20 },
  
  sectionTitle: { 
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
  },
  floatingSquare: {
    position: 'absolute',
    bottom: 20, // Just above the bottom nav
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 100,
  },
});
