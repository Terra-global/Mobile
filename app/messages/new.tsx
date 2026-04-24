import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../constants/theme';

export default function NewMessageScreen() {
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];

  useEffect(() => {
    fetchFollowing();
  }, []);

  const fetchFollowing = async () => {
    try {
      const res = await api.get('/users/following');
      if (res.data.success) {
        setFollowing(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch following:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.userItem, { borderBottomColor: themeColors.border }]}
      onPress={() => router.push(`/messages/${item.id}?name=${encodeURIComponent(item.username)}` as any)}
    >
      <Image 
        source={{ uri: item.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=' + item.username }} 
        style={[styles.avatar, { borderColor: themeColors.border }]} 
      />
      <View style={styles.textContainer}>
        <Text style={[styles.username, { color: themeColors.text }]}>{item.username}</Text>
        <Text style={[styles.farmType, { color: themeColors.subtext }]}>
          {item.farmType?.name || 'Farmer'}
        </Text>
      </View>
      <Ionicons name="chatbubble-outline" size={20} color={themeColors.tint} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close-outline" size={28} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text }]}>New Message</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Text style={[styles.sectionTitle, { color: themeColors.subtext }]}>FOLLOWING</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={themeColors.tint} />
        </View>
      ) : following.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={64} color={themeColors.border} />
          <Text style={[styles.emptyText, { color: themeColors.subtext }]}>You're not following anyone yet.</Text>
        </View>
      ) : (
        <FlatList
          data={following}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 0.5,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  farmType: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: 'Roboto',
  },
});
