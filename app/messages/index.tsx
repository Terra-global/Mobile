import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../constants/theme';

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      if (res.data.success) {
        setConversations(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.conversationItem, { borderBottomColor: themeColors.border }]}
      onPress={() => router.push(`/messages/${item.otherUser.id}?name=${encodeURIComponent(item.otherUser.username)}` as any)}
    >
      <Image 
        source={{ uri: item.otherUser.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=' + item.otherUser.username }} 
        style={[styles.avatar, { borderColor: themeColors.border }]} 
      />
      <View style={styles.textContainer}>
        <Text style={[styles.username, { color: themeColors.text }]}>{item.otherUser.username}</Text>
        <Text style={[styles.lastMessage, { color: themeColors.subtext }]} numberOfLines={1}>
          {item.lastMessage ? item.lastMessage.content : 'No messages yet'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={themeColors.subtext} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text }]}>Messages</Text>
        <TouchableOpacity onPress={() => router.push('/messages/new' as any)} style={styles.backButton}>
          <Ionicons name="create-outline" size={24} color={themeColors.tint} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={themeColors.tint} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={64} color={themeColors.border} />
          <Text style={[styles.emptyText, { color: themeColors.subtext }]}>No conversations yet.</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
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
    padding: 8,
    marginLeft: -8,
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
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  lastMessage: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'Roboto',
  },
});
