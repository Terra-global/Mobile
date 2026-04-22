import React from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function InventoryScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <Image 
          source={{ uri: 'https://api.dicebear.com/7.x/identicon/png?seed=DemoUser' }} 
          style={styles.avatar} 
        />
        <View style={styles.searchBox}>
          <TextInput 
            style={styles.searchInput} 
            placeholder="Discover Friends" 
            placeholderTextColor="#999"
          />
        </View>
        <View style={styles.weatherBox}>
          <Text style={styles.weatherText}>32°C</Text>
          <Ionicons name="sunny-outline" size={28} color="#ffeb3b" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Add Inventory</Text>

        {/* ── Inventory Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardText}>
            Manage Your Real{"\n"}World Farm{"\n"}Produce as{"\n"}Inventory to track{"\n"}your Item
          </Text>
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e2126' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#38383d' },
  searchBox: { flex: 1, marginHorizontal: 12 },
  searchInput: { backgroundColor: '#38383d', borderRadius: 20, height: 40, paddingHorizontal: 16, color: '#c1ff72', fontSize: 13, fontFamily: 'Roboto' },
  weatherBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weatherText: { color: '#fff', fontSize: 16, fontFamily: 'Roboto-Bold' },
  
  scrollContent: { paddingHorizontal: 20, paddingTop: 32 },
  sectionTitle: { color: '#fff', fontSize: 16, fontFamily: 'Roboto-Bold', marginBottom: 24 },
  
  card: { 
    backgroundColor: 'transparent', 
    padding: 32, 
    minHeight: 450,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { 
    color: '#fff', 
    fontSize: 24, 
    fontFamily: 'Roboto-Bold', 
    textAlign: 'center',
    lineHeight: 36,
  },
});
