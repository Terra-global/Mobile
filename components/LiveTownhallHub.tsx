import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { useThemeStore } from '../store/themeStore';
import { Colors } from '../constants/theme';

export default function LiveTownhallHub() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];
  const [activeSquares, setActiveSquares] = useState<any[]>([]);

  useEffect(() => {
    const fetchActive = async () => {
      try {
        const res = await api.get('/squares/active');
        if (res.data.success) {
          setActiveSquares(res.data.data);
        }
      } catch (error) {
        console.error('Hub failed to fetch squares:', error);
      }
    };

    fetchActive();
    const interval = setInterval(fetchActive, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (activeSquares.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.liveIndicator}>
          <View style={styles.dot} />
          <Text style={[styles.liveText, { color: '#ff4b4b' }]}>live townhalls</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/squares' as any)}>
          <Text style={[styles.viewAll, { color: themeColors.tint }]}>view all</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity 
          style={[styles.startCard, { backgroundColor: themeColors.tint }]}
          onPress={() => router.push('/squares/create')}
        >
          <View style={styles.addIcon}>
            <Ionicons name="add" size={24} color="#fff" />
          </View>
          <Text style={styles.startText}>Start</Text>
        </TouchableOpacity>

        {activeSquares.map((square) => (
          <TouchableOpacity 
            key={square.id} 
            style={[styles.squareCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            onPress={() => router.push(`/squares/${square.id}` as any)}
          >
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: square.creator.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=' + square.creator.username }} 
                style={styles.avatar} 
              />
              <View style={styles.pulseContainer}>
                <View style={styles.pulseRing} />
              </View>
            </View>
            <Text style={[styles.squareTitle, { color: themeColors.text }]} numberOfLines={1}>
              {square.title}
            </Text>
            <View style={styles.participantsBadge}>
                <Ionicons name="people" size={10} color={themeColors.subtext} />
                <Text style={[styles.count, { color: themeColors.subtext }]}>{square._count?.participants || 0}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    marginBottom: 12 
  },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ff4b4b' },
  liveText: { fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5 },
  viewAll: { fontSize: 12, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 20, gap: 12 },
  startCard: {
    width: 80,
    height: 110,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  startText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  squareCard: {
    width: 100,
    height: 110,
    borderRadius: 20,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: { position: 'relative', marginBottom: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  pulseContainer: { 
    position: 'absolute', 
    top: -4, 
    left: -4, 
    right: -4, 
    bottom: -4, 
    borderRadius: 26, 
    borderWidth: 1.5, 
    borderColor: '#ff4b4b',
    opacity: 0.8
  },
  pulseRing: { }, // Placeholder for animation
  squareTitle: { fontSize: 11, fontWeight: 'bold', textAlign: 'center', width: '100%' },
  participantsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  count: { fontSize: 9, fontWeight: 'bold' },
});
