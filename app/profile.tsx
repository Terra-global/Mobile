import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity, RefreshControl, FlatList, Modal, Pressable, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import PostCard from '../components/PostCard';
import UserPreviewModal from '../components/UserPreviewModal';
import { useLoadingStore } from '../store/loadingStore';
import { useThemeStore } from '../store/themeStore';
import { Colors } from '../constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useAuthStore(state => state.user);
  
  // If no ID is provided, we're viewing our own profile
  const userId = id || currentUser?.id;
  const isOwnProfile = userId === currentUser?.id;

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts');
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const clearAuth = useAuthStore(state => state.clearAuth);
  const setIsLoading = useLoadingStore(state => state.setIsLoading);
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];

  const fetchProfile = async () => {
    if (!userId) return;
    try {
      const res = await api.get(`/users/profile/${userId}`);
      if (res.data.success) {
        setProfile(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchPosts = async () => {
    if (!userId) return;
    try {
      const res = await api.get(`/posts/user/${userId}`);
      if (res.data.success) {
        setPosts(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch user posts:', error);
    }
  };
  
  const fetchLikedPosts = async () => {
    if (!userId) return;
    try {
      const res = await api.get(`/posts/user/${userId}/likes`);
      if (res.data.success) {
        setLikedPosts(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch liked posts:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchProfile(), 
      activeTab === 'posts' ? fetchPosts() : fetchLikedPosts()
    ]);
    setLoading(false);
    setIsLoading(false);
  };

  const [processingLikes, setProcessingLikes] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    loadData();
  }, [userId, activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchPosts()]);
    setRefreshing(false);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.profileInfo}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: (isOwnProfile ? currentUser?.avatarUrl : profile?.avatarUrl) || 'https://api.dicebear.com/7.x/identicon/png?seed=' + profile?.username }} 
            style={[styles.avatar, { borderColor: themeColors.background, backgroundColor: themeColors.card }]} 
          />
        </View>

        <Text style={[styles.name, { color: themeColors.text }]}>
          {profile?.farmType?.name && (
            <Text>{{'Subsistence Farmer': '🌾', 'Hobby Farmer': '🏡', 'Smallholder': '🌱', 'Contract Farmer': '📋', 'Livestock Producer': '🐄', 'Arable Farmer': '🌽', 'Horticulturalist': '🍅', 'Aquaculture Farmer': '🐟'}[profile.farmType.name as string] || '🌱'} </Text>
          )}{profile?.username || 'user'}
        </Text>
        <Text style={[styles.handle, { color: themeColors.subtext }]}>@{profile?.username?.toLowerCase()}</Text>
        
        {profile?.bio && <Text style={[styles.bio, { color: themeColors.text, opacity: 0.9 }]}>{profile.bio}</Text>}
        
        {profile?.website && (
          <TouchableOpacity onPress={() => Linking.openURL(profile.website)} style={styles.websiteRow}>
            <Ionicons name="link-outline" size={16} color={themeColors.tint} />
            <Text style={[styles.websiteText, { color: themeColors.tint }]}>{profile.website.replace(/^https?:\/\//, '')}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: themeColors.text }]}>{profile?._count?.following || 0}</Text>
            <Text style={[styles.statLabel, { color: themeColors.subtext }]}>Following</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: themeColors.text }]}>{profile?._count?.followers || 0}</Text>
            <Text style={[styles.statLabel, { color: themeColors.subtext }]}>Followers</Text>
          </View>
          {isOwnProfile && (
            <TouchableOpacity style={styles.statItem} onPress={() => router.push('/account/referrals' as any)}>
              <Text style={[styles.statNumber, { color: themeColors.text }]}>{profile?._count?.referrals || 0}</Text>
              <Text style={[styles.statLabel, { color: themeColors.subtext }]}>Referrals</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[styles.tabs, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'posts' && [styles.activeTab, { borderBottomColor: themeColors.tint }]]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'posts' ? themeColors.text : themeColors.subtext }]}>Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'likes' && [styles.activeTab, { borderBottomColor: themeColors.tint }]]}
          onPress={() => setActiveTab('likes')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'likes' ? themeColors.text : themeColors.subtext }]}>Likes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.topNavTitle, { color: themeColors.text }]}>{profile?.username}</Text>
        {isOwnProfile ? (
          <TouchableOpacity onPress={() => setIsMenuVisible(true)}>
            <Ionicons name="ellipsis-vertical" size={20} color={themeColors.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 20 }} />
        )}
      </View>

      <FlatList
        data={activeTab === 'posts' ? posts : likedPosts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <PostCard 
            id={item.id}
            author={{
              id: item.user.id,
              name: item.user.username || 'Anonymous',
              avatar: item.user.avatarUrl,
              farmType: item.user.farmType?.name,
            }}
            onMessagePress={
              currentUser?.id !== item.user.id 
                ? () => router.push(`/messages/${item.user.id}?name=${encodeURIComponent(item.user.username)}` as any)
                : undefined
            }
            content={item.content}
            tags={item.tags}
            postType={item.postType}
            price={item.price}
            priceUnit={item.priceUnit}
            quantity={item.quantity}
            quantityUnit={item.quantityUnit}
            location={item.location}
            images={item.imageUrls}
            time={new Date(item.createdAt).toLocaleDateString()}
            likes={item._count?.likes || 0}
            comments={item._count?.comments || 0}
            views={item.views || 0}
            isLiked={item.likes && item.likes.length > 0}
            onLikePress={() => toggleLike(item.id)}
            onDeletePress={item.userId === currentUser?.id ? () => handleDeletePost(item.id) : undefined}
            onAuthorPress={() => {
              setSelectedUserId(item.userId);
              setIsPreviewVisible(true);
            }}
            onPress={() => router.push({
              pathname: '/post/[id]',
              params: { id: item.id }
            })}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.tint} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: themeColors.subtext }]}>no posts yet</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <UserPreviewModal 
        userId={selectedUserId}
        isVisible={isPreviewVisible}
        onClose={() => setIsPreviewVisible(false)}
      />

      {/* Settings Menu Dropdown */}
      {isMenuVisible && (
        <Pressable 
          style={styles.dropdownOverlay} 
          onPress={() => setIsMenuVisible(false)}
        >
          <View style={[styles.menuContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                setIsMenuVisible(false);
                router.push('/account');
              }}
            >
              <Ionicons name="settings-outline" size={20} color={themeColors.text} />
              <Text style={[styles.menuText, { color: themeColors.text }]}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                setIsMenuVisible(false);
                router.push('/account/referrals' as any);
              }}
            >
              <Ionicons name="people-outline" size={20} color={themeColors.text} />
              <Text style={[styles.menuText, { color: themeColors.text }]}>Referrals</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingVertical: 12,
  },
  topNavTitle: { fontSize: 18, fontWeight: 'bold' },
  header: { borderBottomWidth: 0.5 },
  profileInfo: { paddingHorizontal: 16, marginTop: 20 },
  avatarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
  },
  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 2 },
  handle: { fontSize: 15, marginBottom: 12 },
  bio: { fontSize: 15, lineHeight: 20, marginBottom: 12 },
  websiteRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  websiteText: { fontSize: 14, fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  statItem: { flexDirection: 'row', gap: 4 },
  statNumber: { fontWeight: 'bold' },
  statLabel: { },
  tabs: { flexDirection: 'row', borderBottomWidth: 0.5 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  activeTab: { borderBottomWidth: 2 },
  tabText: { fontWeight: 'bold', fontSize: 15 },
  activeTabText: { },
  emptyContainer: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 16 },
  dropdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    borderRadius: 12,
    width: 180,
    padding: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    marginVertical: 4,
  },
});
