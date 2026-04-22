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

export default function ProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
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
  const clearAuth = useAuthStore(state => state.clearAuth);
  const setIsLoading = useLoadingStore(state => state.setIsLoading);

  const fetchProfile = async () => {
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
    try {
      const res = await api.get(`/posts/user/${userId}`);
      if (res.data.success) {
        setPosts(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch user posts:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchProfile(), fetchPosts()]);
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

  useEffect(() => {
    loadData();
  }, [userId]);

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
            source={{ uri: profile?.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=' + profile?.username }} 
            style={styles.avatar} 
          />
        </View>

        <Text style={styles.name}>{profile?.username || 'user'}</Text>
        <Text style={styles.handle}>@{profile?.username?.toLowerCase()}</Text>
        
        {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
        
        {profile?.website && (
          <TouchableOpacity onPress={() => Linking.openURL(profile.website)} style={styles.websiteRow}>
            <Ionicons name="link-outline" size={16} color="#c1ff72" />
            <Text style={styles.websiteText}>{profile.website.replace(/^https?:\/\//, '')}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile?._count?.following || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile?._count?.followers || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
          <Text style={[styles.tabText, styles.activeTabText]}>Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Likes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>{profile?.username}</Text>
        {isOwnProfile ? (
          <TouchableOpacity onPress={() => setIsMenuVisible(true)}>
            <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 20 }} />
        )}
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <PostCard 
            id={item.id}
            author={{
              name: item.user.username || 'Anonymous',
              avatar: item.user.avatarUrl
            }}
            content={item.content}
            image={item.imageUrl}
            time={new Date(item.createdAt).toLocaleDateString()}
            likes={item._count?.likes || 0}
            comments={item._count?.comments || 0}
            isLiked={item.likes && item.likes.length > 0}
            onLikePress={() => toggleLike(item.id)}
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c1ff72" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>no posts yet</Text>
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
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                setIsMenuVisible(false);
                router.push('/account');
              }}
            >
              <Ionicons name="settings-outline" size={20} color="#fff" />
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e2126' },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topNavTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  header: { borderBottomWidth: 1, borderBottomColor: '#2a2d34' },
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
    borderColor: '#1e2126',
    backgroundColor: '#38383d',
  },
  name: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 2 },
  handle: { color: '#64748b', fontSize: 15, marginBottom: 12 },
  bio: { color: '#e2e8f0', fontSize: 15, lineHeight: 20, marginBottom: 12 },
  websiteRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  websiteText: { color: '#c1ff72', fontSize: 14, fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  statItem: { flexDirection: 'row', gap: 4 },
  statNumber: { color: '#fff', fontWeight: 'bold' },
  statLabel: { color: '#64748b' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#2a2d34' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#c1ff72' },
  tabText: { color: '#64748b', fontWeight: 'bold', fontSize: 15 },
  activeTabText: { color: '#fff' },
  emptyContainer: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 16 },
  dropdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#2a2d34',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#38383d',
    marginVertical: 4,
  },
});
