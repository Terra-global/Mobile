import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../constants/theme';
import api from '../../utils/api';
import { useRouter } from 'expo-router';
import { RefreshControl, ActivityIndicator, Image, TouchableOpacity } from 'react-native';

export default function NotificationsScreen() {
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];
  const router = useRouter();

  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LIKE': return { name: 'heart', color: '#f91880' };
      case 'FOLLOW': return { name: 'person-add', color: themeColors.tint };
      case 'COMMENT': return { name: 'chatbubble', color: '#1d9bf0' };
      default: return { name: 'notifications', color: themeColors.subtext };
    }
  };

  const getNotificationText = (type: string) => {
    switch (type) {
      case 'LIKE': return 'liked your update';
      case 'FOLLOW': return 'started following you';
      case 'COMMENT': return 'commented on your update';
      default: return 'notified you';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>notifications</Text>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.tint} />
        }
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={themeColors.tint} />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={themeColors.border} />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>no notifications yet</Text>
            <Text style={[styles.emptyText, { color: themeColors.subtext }]}>when you get likes, comments or follows, you'll see them here.</Text>
          </View>
        ) : (
          notifications.map(notif => {
            const icon = getNotificationIcon(notif.type);
            return (
              <TouchableOpacity 
                key={notif.id} 
                style={[styles.notificationItem, !notif.read && { backgroundColor: themeColors.card + '40' }]}
                onPress={() => {
                  if (notif.postId) router.push({ pathname: '/post/[id]', params: { id: notif.postId } });
                  else if (notif.actorId) router.push({ pathname: '/profile', params: { id: notif.actorId } });
                }}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name={icon.name as any} size={22} color={icon.color} />
                </View>
                <View style={styles.notifContent}>
                  <Image source={{ uri: notif.actor.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=' + notif.actor.username }} style={styles.actorAvatar} />
                  <Text style={[styles.notifText, { color: themeColors.text }]}>
                    <Text style={styles.bold}>{notif.actor.username}</Text> {getNotificationText(notif.type)}
                  </Text>
                  {notif.post && (
                    <Text style={[styles.postSnippet, { color: themeColors.subtext }]} numberOfLines={1}>
                      {notif.post.content}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'transparent', // Will be set dynamically if needed
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Roboto-Bold',
    textTransform: 'lowercase',
  },
  content: {
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  iconContainer: {
    width: 30,
    alignItems: 'center',
    paddingTop: 4,
  },
  notifContent: {
    flex: 1,
    marginLeft: 12,
  },
  actorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 8,
  },
  notifText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Roboto',
  },
  bold: {
    fontFamily: 'Roboto-Bold',
  },
  postSnippet: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'Roboto',
    opacity: 0.6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Roboto-Bold',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Roboto',
  }
});
