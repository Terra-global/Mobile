import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Modal, ActivityIndicator, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

import { useLoadingStore } from '../store/loadingStore';
import { useThemeStore } from '../store/themeStore';
import { Colors } from '../constants/theme';

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
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    Haptics.selectionAsync();
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
      <View style={[styles.modalContent, { backgroundColor: themeColors.background, borderTopColor: themeColors.border, borderTopWidth: 0.5 }]}>
        <View style={[styles.handle, { backgroundColor: themeColors.border }]} />
        
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={themeColors.tint} size="large" />
          </View>
        ) : (
          <View style={styles.profileContainer}>
            <View style={styles.header}>
              <Image 
                source={{ uri: profile?.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=' + profile?.username }} 
                style={styles.avatar} 
              />
              <View style={styles.headerText}>
                <Text style={[styles.name, { color: themeColors.text }]}>{profile?.username}</Text>
                <Text style={[styles.handleText, { color: themeColors.subtext }]}>@{profile?.username?.toLowerCase()}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: themeColors.text }]}>{profile?._count?.followers || 0}</Text>
                <Text style={[styles.statLabel, { color: themeColors.subtext }]}>followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: themeColors.text }]}>{profile?._count?.following || 0}</Text>
                <Text style={[styles.statLabel, { color: themeColors.subtext }]}>following</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: themeColors.text }]}>{profile?._count?.posts || 0}</Text>
                <Text style={[styles.statLabel, { color: themeColors.subtext }]}>posts</Text>
              </View>
            </View>

            {profile?.bio && <Text style={[styles.bio, { color: themeColors.text }]} numberOfLines={2}>{profile.bio}</Text>}

            <View style={styles.actions}>
              {currentUser?.id !== userId && (
                <TouchableOpacity 
                  style={[
                    styles.button, 
                    following ? styles.unfollowButton : styles.followButton, 
                    { 
                      backgroundColor: following ? 'transparent' : themeColors.tint, 
                      borderColor: following ? themeColors.border : themeColors.tint 
                    }
                  ]}
                  onPress={handleFollow}
                  disabled={processingFollow}
                  activeOpacity={0.8}
                >
                  {processingFollow ? (
                    <ActivityIndicator color={following ? themeColors.text : "#fff"} size="small" />
                  ) : (
                    <View style={styles.buttonInner}>
                      {following && <Ionicons name="checkmark" size={16} color={themeColors.text} style={{ marginRight: 4 }} />}
                      <Text style={[styles.buttonText, { color: following ? themeColors.text : '#fff' }]}>
                        {following ? 'Following' : 'Follow'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.viewProfileButton, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]} 
                onPress={viewFullProfile}
                activeOpacity={0.7}
              >
                <Text style={[styles.viewProfileText, { color: themeColors.text }]}>View Profile</Text>
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
    backgroundColor: 'transparent',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    minHeight: 340,
    paddingHorizontal: 24,
    paddingBottom: 40,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 30,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 24,
    opacity: 0.5,
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
    fontSize: 14,
    fontFamily: 'Roboto',
    opacity: 0.8,
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
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Roboto',
    textTransform: 'lowercase',
    marginTop: 2,
    opacity: 0.6,
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Roboto',
    marginBottom: 28,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followButton: {
  },
  unfollowButton: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'Roboto-Bold',
  },
  viewProfileButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewProfileText: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'Roboto-Bold',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
