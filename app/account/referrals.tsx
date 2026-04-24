import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../constants/theme';

export default function ReferralsScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];

  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchReferrals();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        updateUser(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchReferrals = async () => {
    try {
      const res = await api.get('/users/referrals');
      if (res.data.success) {
        setReferrals(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on Terra, the social marketplace for farmers! Use my referral code: ${user?.referralCode}\n\nDownload now: https://terra-mobile.app`,
      });
    } catch (error) {
      console.error('Error sharing referral code:', error);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.referralItem, { borderBottomColor: themeColors.border }]}>
      <Image 
        source={{ uri: item.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=' + item.username }} 
        style={styles.avatar} 
      />
      <View style={styles.textContainer}>
        <Text style={[styles.username, { color: themeColors.text }]}>{item.username}</Text>
        <Text style={[styles.date, { color: themeColors.subtext }]}>Joined {new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: themeColors.tint + '20' }]}>
        <Text style={[styles.badgeText, { color: themeColors.tint }]}>Active</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text }]}>Referrals</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.cardTitle, { color: themeColors.text }]}>Your Referral Code</Text>
          <Text style={[styles.cardSub, { color: themeColors.subtext }]}>Share this code with your friends to invite them to Terra.</Text>
          
          <View style={[styles.codeBox, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
            <Text style={[styles.codeText, { color: themeColors.tint }]}>{user?.referralCode || '-------'}</Text>
          </View>

          <TouchableOpacity style={[styles.shareButton, { backgroundColor: themeColors.tint }]} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color="#fff" />
            <Text style={styles.shareButtonText}>Share Code</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>People You Referred ({referrals.length})</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={themeColors.tint} style={{ marginTop: 40 }} />
        ) : referrals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={themeColors.border} />
            <Text style={[styles.emptyText, { color: themeColors.subtext }]}>You haven't referred anyone yet.</Text>
          </View>
        ) : (
          <View style={[styles.listContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            {referrals.map((item, index) => (
              <React.Fragment key={item.id}>
                {renderItem({ item })}
              </React.Fragment>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Added ScrollView import since it's used
import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 32,
  },
  cardTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  cardSub: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  codeBox: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  codeText: { fontSize: 32, fontWeight: 'bold', letterSpacing: 4 },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  shareButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  listContainer: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  textContainer: { flex: 1, marginLeft: 12 },
  username: { fontSize: 16, fontWeight: 'bold' },
  date: { fontSize: 13, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, marginTop: 16 },
});
