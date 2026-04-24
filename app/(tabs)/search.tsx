import React from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../constants/theme';
import api from '../../utils/api';
import PostCard from '../../components/PostCard';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image } from 'react-native';
import { useAuthStore } from '../../store/authStore';

export default function SearchScreen() {
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];
  const router = useRouter();
  const user = useAuthStore(state => state.user);

  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<{ users: any[], posts: any[] }>({ users: [], posts: [] });
  const [loading, setLoading] = React.useState(false);

  const handleDeletePost = async (postId: string) => {
    try {
      const res = await api.delete(`/posts/${postId}`);
      if (res.data.success) {
        setResults(prev => ({
          ...prev,
          posts: prev.posts.filter(p => p.id !== postId)
        }));
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length < 1) {
      setResults({ users: [], posts: [] });
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(`/search?query=${text}&type=global`);
      if (res.data.success) {
        setResults(res.data.data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View style={[styles.searchBox, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Ionicons name="search-outline" size={20} color={themeColors.subtext} />
          <TextInput 
            style={[styles.input, { color: themeColors.text }]}
            placeholder="search terra..."
            placeholderTextColor={themeColors.subtext}
            value={query}
            onChangeText={handleSearch}
            autoFocus
          />
          {loading && <ActivityIndicator size="small" color={themeColors.tint} />}
        </View>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {query.length > 0 ? (
          <>
            {results.users.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: themeColors.subtext }]}>people</Text>
                {results.users.map(user => (
                  <TouchableOpacity 
                    key={user.id} 
                    style={styles.userItem}
                    onPress={() => router.push({ pathname: '/profile', params: { id: user.id } })}
                  >
                    <Image source={{ uri: user.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=' + user.username }} style={styles.userAvatar} />
                    <View>
                      <Text style={[styles.userName, { color: themeColors.text }]}>{user.username}</Text>
                      <Text style={[styles.userBio, { color: themeColors.subtext }]} numberOfLines={1}>{user.bio || 'no bio yet'}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {results.posts.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: themeColors.subtext }]}>posts</Text>
                {results.posts.map(post => (
                  <PostCard 
                    key={post.id}
                    id={post.id}
                    author={{ id: post.user.id, name: post.user.username, avatar: post.user.avatarUrl, farmType: post.user.farmType?.name }}
                    onMessagePress={
                      user?.id !== post.user.id 
                        ? () => router.push(`/messages/${post.user.id}?name=${encodeURIComponent(post.user.username)}` as any)
                        : undefined
                    }
                    content={post.content}
                    tags={post.tags}
                    postType={post.postType}
                    price={post.price}
                    priceUnit={post.priceUnit}
                    quantity={post.quantity}
                    quantityUnit={post.quantityUnit}
                    location={post.location}
                    images={post.imageUrls}
                    time={new Date(post.createdAt).toLocaleDateString()}
                    likes={post._count?.likes}
                    comments={post._count?.comments}
                    views={post.views || 0}
                    onDeletePress={post.userId === user?.id ? () => handleDeletePost(post.id) : undefined}
                    onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
                  />
                ))}
              </View>
            )}

            {results.users.length === 0 && results.posts.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={themeColors.border} />
                <Text style={[styles.emptyText, { color: themeColors.subtext }]}>no results found for "{query}"</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={themeColors.border} />
            <Text style={[styles.emptyText, { color: themeColors.subtext }]}>search for people or posts...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    borderWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Roboto',
  },
  content: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Roboto-Bold',
    marginBottom: 12,
    textTransform: 'lowercase',
    opacity: 0.7,
    paddingHorizontal: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
  },
  userBio: {
    fontSize: 13,
    fontFamily: 'Roboto',
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Roboto',
  }
});
