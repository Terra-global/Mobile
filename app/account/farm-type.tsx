import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../constants/theme';

export default function FarmTypeScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];
  
  const [farmTypes, setFarmTypes] = React.useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFarmTypes();
  }, []);

  const fetchFarmTypes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/farm-types');
      if (res.data.success) {
        setFarmTypes(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch farm types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (id: string) => {
    if (savingId) return;
    
    setSavingId(id);
    try {
      await api.patch('/users/profile', { farmTypeId: id });
      updateUser({ farmTypeId: id });
      router.back();
    } catch (error) {
      console.error('Failed to update farm type:', error);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.tint} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Farm Type</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={themeColors.tint} size="large" />
        </View>
      ) : (
        <FlatList
          data={farmTypes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isSelected = item.id === user?.farmTypeId;
            return (
              <TouchableOpacity 
                style={[styles.item, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}
                onPress={() => handleSelect(item.id)}
                disabled={!!savingId}
              >
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: themeColors.text }, isSelected && { color: themeColors.tint }]}>
                    {item.name}
                  </Text>
                  {item.description && (
                    <Text style={[styles.itemDescription, { color: themeColors.subtext }]} numberOfLines={1}>
                      {item.description}
                    </Text>
                  )}
                </View>
                
                {savingId === item.id ? (
                  <ActivityIndicator color={themeColors.tint} size="small" />
                ) : isSelected ? (
                  <Ionicons name="checkmark-circle" size={24} color={themeColors.tint} />
                ) : (
                  <Ionicons name="ellipse-outline" size={24} color={themeColors.border} />
                )}
              </TouchableOpacity>
            );
          }}
          ListHeaderComponent={() => (
            <Text style={[styles.sectionTitle, { color: themeColors.subtext, backgroundColor: themeColors.card }]}>What kind of farm do you manage?</Text>
          )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingBottom: 40 },
  sectionTitle: {
    fontSize: 14,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  itemInfo: { flex: 1, marginRight: 16 },
  itemName: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  itemDescription: { fontSize: 13 },
});
