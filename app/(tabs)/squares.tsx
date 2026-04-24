import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import api from '../../utils/api';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../constants/theme';
import { useLoadingStore } from '../../store/loadingStore';

export default function MarketSquareListScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];
  const setIsLoading = useLoadingStore(state => state.setIsLoading);

  const [squares, setSquares] = useState<any[]>([]);
  const [activeParticipation, setActiveParticipation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSquares = async () => {
    try {
      const res = await api.get('/squares/active');
      if (res.data.success) {
        setSquares(res.data.data);
      }
      
      const activeRes = await api.get('/squares/my-active');
      if (activeRes.data.success) {
        setActiveParticipation(activeRes.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch squares:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSquares();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSquares();
  }, []);

  const renderSquareItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.squareCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
      onPress={() => {
        if (activeParticipation && activeParticipation.squareId !== item.id) {
          alert('You must leave your current Townhall before joining a new one.');
          return;
        }
        router.push(`/squares/${item.id}` as any);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.liveBadge}>
          <View style={styles.dot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <View style={styles.participantsBadge}>
          <Ionicons name="people" size={14} color={themeColors.subtext} />
          <Text style={[styles.participantsText, { color: themeColors.subtext }]}>{item._count?.participants || 0}</Text>
        </View>
      </View>

      <Text style={[styles.squareTitle, { color: themeColors.text }]} numberOfLines={2}>
        {item.title}
      </Text>

      <View style={styles.creatorRow}>
        <Image 
          source={{ uri: item.creator?.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=' + item.creator?.username }} 
          style={styles.creatorAvatar} 
        />
        <Text style={[styles.creatorName, { color: themeColors.subtext }]}>
          by {item.creator?.username}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Market Square</Text>
        <TouchableOpacity 
          style={[styles.createButton, { backgroundColor: themeColors.tint }]}
          onPress={() => {
            if (activeParticipation) {
              router.push(`/squares/${activeParticipation.squareId}` as any);
            } else {
              router.push('/squares/create');
            }
          }}
        >
          <Ionicons name={activeParticipation ? "enter" : "add"} size={24} color="#fff" />
          <Text style={styles.createButtonText}>
            {activeParticipation ? "Rejoin Townhall" : "Start Townhall"}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={themeColors.tint} />
        </View>
      ) : (
        <FlatList
          data={squares}
          renderItem={renderSquareItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.tint} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="megaphone-outline" size={64} color={themeColors.border} />
              <Text style={[styles.emptyText, { color: themeColors.subtext }]}>No active townhalls right now.</Text>
              <Text style={[styles.emptySubtext, { color: themeColors.subtext }]}>Start one to gather the community!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { 
    fontSize: 13, 
    fontFamily: 'Roboto', 
    textTransform: 'lowercase',
    opacity: 0.6,
    letterSpacing: 1,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  createButtonText: { color: '#fff', fontFamily: 'Roboto', fontSize: 14 },
  listContent: { padding: 10, paddingBottom: 100 },
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 10 },
  squareCard: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveBadge: {
    backgroundColor: '#ff4b4b',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  participantsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantsText: { fontSize: 12, fontWeight: 'bold' },
  squareTitle: { fontSize: 16, fontFamily: 'Roboto', lineHeight: 22, height: 44, marginBottom: 12 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  creatorAvatar: { width: 24, height: 24, borderRadius: 12 },
  creatorName: { fontSize: 12 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptySubtext: { fontSize: 14, marginTop: 8, textAlign: 'center' },
});
