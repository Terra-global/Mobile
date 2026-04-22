import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Modal, ActivityIndicator, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface UserPreviewModalProps {
  userId: string | null;
  isVisible: boolean;
  onClose: () => void;
}

export default function UserPreviewModal({ userId, isVisible, onClose }: UserPreviewModalProps) {
  const router = useRouter();
  const currentUser = useAuthStore(state => state.user);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [processingFollow, setProcessingFollow] = useState(false);

  useEffect(() => {
    if (isVisible && userId) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [isVisible, userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/users/profile/${userId}`);
      if (res.data.success) {
        setProfile(res.data.data);
        setFollowing(res.data.data.isFollowing);
      }
    } catch (error) {
      console.error('Failed to fetch preview profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (processingFollow || !userId) return;
    
    try {
      setProcessingFollow(true);
      const res = await api.post(`/users/follow/${userId}`);
      if (res.data.success) {
        setFollowing(res.data.data.following);
        // Update local profile count optimistically
        setProfile((prev: any) => ({
          ...prev,
          _count: {
            ...prev._count,
            followers: res.data.data.following 
              ? prev._count.followers + 1 
              : Math.max(0, prev._count.followers - 1)
          }
        }));
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    } finally {
      setProcessingFollow(false);
    }
  };

  const viewFullProfile = () => {
    onClose();
    router.push({
      pathname: '/profile',
      params: { id: userId }
    });
  };

  if (!userId) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.modalContent}>
        <View style={styles.handle} />
        
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#c1ff72" size="large" />
          </View>
        ) : (
          <View style={styles.profileContainer}>
            <View style={styles.header}>
              <Image 
                source={{ uri: profile?.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=' + profile?.username }} 
                style={styles.avatar} 
              />
              <View style={styles.headerText}>
                <Text style={styles.name}>{profile?.username}</Text>
                <Text style={styles.handleText}>@{profile?.username?.toLowerCase()}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile?._count?.followers || 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile?._count?.following || 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile?._count?.posts || 0}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
            </View>

            {profile?.bio && <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>}

            <View style={styles.actions}>
              {currentUser?.id !== userId && (
                <TouchableOpacity 
                  style={[styles.button, following ? styles.unfollowButton : styles.followButton]}
                  onPress={handleFollow}
                  disabled={processingFollow}
                >
                  <Text style={[styles.buttonText, following && styles.unfollowButtonText]}>
                    {following ? 'following' : 'follow'}
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={styles.viewProfileButton} onPress={viewFullProfile}>
                <Text style={styles.viewProfileText}>view full profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#1e2126',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 320,
    paddingHorizontal: 20,
    paddingBottom: 40,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#38383d',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  loadingBox: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileContainer: {
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#38383d',
  },
  headerText: {
    marginLeft: 16,
  },
  name: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  handleText: {
    color: '#64748b',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 12,
    textTransform: 'lowercase',
  },
  bio: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followButton: {
    backgroundColor: '#c1ff72',
  },
  unfollowButton: {
    borderWidth: 1,
    borderColor: '#38383d',
    backgroundColor: 'transparent',
  },
  buttonText: {
    color: '#1e2126',
    fontSize: 15,
    fontWeight: 'bold',
  },
  unfollowButtonText: {
    color: '#fff',
  },
  viewProfileButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#38383d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewProfileText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
