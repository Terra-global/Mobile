import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import api from '@/utils/api';
import { useAuthStore } from '@/store/authStore';
import { useAlertStore } from '@/store/alertStore';
import { ActivityIndicator } from 'react-native';

interface FarmType {
  id: string;
  name: string;
  description: string;
}

export default function FarmTypeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuthStore();
  const showAlert = useAlertStore(state => state.showAlert);
  
  const [farmTypes, setFarmTypes] = React.useState<FarmType[]>([]);
  const [selectedId, setSelectedId] = React.useState<string>(user?.farmTypeId || '');
  const [loading, setLoading] = React.useState(false);
  const [fetching, setFetching] = React.useState(true);

  React.useEffect(() => {
    fetchFarmTypes();
  }, []);

  const fetchFarmTypes = async () => {
    try {
      const response = await api.get('/users/farm-types');
      setFarmTypes(response.data.data);
    } catch (error) {
      console.error('Failed to fetch farm types:', error);
    } finally {
      setFetching(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedId) {
      showAlert('Please select a farm type', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.patch('/users/profile', { farmTypeId: selectedId });
      updateUser({ farmTypeId: selectedId });
      showAlert('Farm type updated successfully!', 'success');
      router.back();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to update farm type';
      showAlert(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#c1ff72" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Farm type</Text>
        <View style={styles.backButton} />
      </View>

      {/* List */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {fetching ? (
          <ActivityIndicator color="#c1ff72" style={{ marginTop: 20 }} />
        ) : (
          farmTypes.map((item) => (
            <TouchableOpacity key={item.id} style={styles.row} onPress={() => setSelectedId(item.id)}>
              <View style={[styles.checkbox, selectedId === item.id && styles.checkboxSelected]}>
                {selectedId === item.id && <Ionicons name="checkmark" size={14} color="#1e2126" />}
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{item.name}</Text>
                <Text style={styles.rowDesc}>{item.description}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Footer Update Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity 
          style={[styles.updateButton, (loading || !selectedId) && { opacity: 0.7 }]} 
          onPress={handleUpdate}
          disabled={loading || !selectedId}
        >
          {loading ? (
            <ActivityIndicator color="#1e2126" />
          ) : (
            <Text style={styles.updateButtonText}>Update</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e2126' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { color: '#fff', fontSize: 15, fontFamily: 'Roboto', opacity: 0.7, letterSpacing: 0.5 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 16 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#c1ff72', marginTop: 2, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: '#c1ff72' },
  rowText: { flex: 1 },
  rowLabel: { color: '#fff', fontSize: 15, fontFamily: 'Roboto-Bold', marginBottom: 4 },
  rowDesc: { color: '#fff', fontSize: 12, fontFamily: 'Roboto', opacity: 0.6, lineHeight: 18 },
  footer: { paddingHorizontal: 24, paddingTop: 12, backgroundColor: '#1e2126' },
  updateButton: { backgroundColor: '#c1ff72', borderRadius: 12, height: 56, alignItems: 'center', justifyContent: 'center' },
  updateButtonText: { color: '#1e2126', fontSize: 18, fontFamily: 'Roboto-Bold' },
});
