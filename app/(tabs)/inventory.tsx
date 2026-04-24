import React from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../constants/theme';

export default function InventoryScreen() {
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <Image 
          source={{ uri: 'https://api.dicebear.com/7.x/identicon/png?seed=DemoUser' }} 
          style={[styles.avatar, { backgroundColor: themeColors.card }]} 
        />
        <View style={styles.searchBox}>
          <TextInput 
            style={[styles.searchInput, { backgroundColor: themeColors.card, color: themeColors.tint }]} 
            placeholder="Discover Friends" 
            placeholderTextColor={themeColors.subtext}
          />
        </View>
        <View style={styles.weatherBox}>
          <Text style={[styles.weatherText, { color: themeColors.text }]}>32°C</Text>
          <Ionicons name="sunny-outline" size={28} color="#ffeb3b" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Add Inventory</Text>

        {/* ── Inventory Card ── */}
        <View style={styles.card}>
          <Text style={[styles.cardText, { color: themeColors.text }]}>
            Manage Your Real{"\n"}World Farm{"\n"}Produce as{"\n"}Inventory to track{"\n"}your Item
          </Text>
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  searchBox: { flex: 1, marginHorizontal: 12 },
  searchInput: { borderRadius: 20, height: 40, paddingHorizontal: 16, fontSize: 13, fontFamily: 'Roboto' },
  weatherBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weatherText: { fontSize: 16, fontFamily: 'Roboto-Bold' },
  
  scrollContent: { paddingHorizontal: 20, paddingTop: 32 },
  sectionTitle: { fontSize: 16, fontFamily: 'Roboto-Bold', marginBottom: 24 },
  
  card: { 
    backgroundColor: 'transparent', 
    padding: 32, 
    minHeight: 450,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { 
    fontSize: 24, 
    fontFamily: 'Roboto-Bold', 
    textAlign: 'center',
    lineHeight: 36,
  },
});
