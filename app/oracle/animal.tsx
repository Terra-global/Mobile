import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOracle } from '../../utils/useOracle';

export default function AnimalPage() {
  const { analyzeWithLocation } = useOracle();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [animalName, setAnimalName] = useState('Poultry');
  const [useManualLoc, setUseManualLoc] = useState(false);
  const [lat, setLat] = useState('4.8156');
  const [lon, setLon] = useState('7.0498');
  const [includeSeasonal, setIncludeSeasonal] = useState(false);
  const [includeHistory, setIncludeHistory] = useState(false);
  const [locationInfo, setLocationInfo] = useState<string>('');

  const handleAnalyze = async () => {
    setLoading(true);
    setData(null);
    try {
      const manualCoords = useManualLoc ? { lat: parseFloat(lat), lon: parseFloat(lon) } : undefined;

      const factSheet = await analyzeWithLocation('ANIMAL', animalName, {
        includeSeasonal,
        includeHistory,
        manualCoords
      });
      
      if (factSheet.environmental_snapshot) {
        setLocationInfo(factSheet.environmental_snapshot.location || 'Detected');
      }

      setData(factSheet);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Analysis Failed', error.message || 'Could not fetch data.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Livestock Oracle</Text>
          <Text style={styles.description}>Animal-specific thermal stress analysis</Text>
        </View>

        <View style={styles.formCard}>
          <TextInput
            style={styles.input}
            value={animalName}
            onChangeText={setAnimalName}
            placeholder="Livestock type? (e.g. Poultry, Cattle)"
            placeholderTextColor="#999"
          />

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleLabel}>Override Location</Text>
              <Text style={styles.toggleSub}>Bypass GPS/IP block</Text>
            </View>
            <Switch
              value={useManualLoc}
              onValueChange={setUseManualLoc}
              trackColor={{ false: '#38383d', true: '#c1ff72' }}
              thumbColor={useManualLoc ? '#fff' : '#999'}
            />
          </View>

          {useManualLoc && (
            <View style={styles.coordsRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={lat}
                onChangeText={setLat}
                placeholder="Lat"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={lon}
                onChangeText={setLon}
                placeholder="Lon"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
          )}

          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={[styles.optionBtn, includeSeasonal && styles.optionBtnActive]}
              onPress={() => setIncludeSeasonal(!includeSeasonal)}
            >
              <Ionicons name={includeSeasonal ? "checkbox" : "square-outline"} size={16} color={includeSeasonal ? "#1e2126" : "#ccc"} />
              <Text style={[styles.optionText, includeSeasonal && styles.optionTextActive]}>Seasonal</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionBtn, includeHistory && styles.optionBtnActive]}
              onPress={() => setIncludeHistory(!includeHistory)}
            >
              <Ionicons name={includeHistory ? "checkbox" : "square-outline"} size={16} color={includeHistory ? "#1e2126" : "#ccc"} />
              <Text style={[styles.optionText, includeHistory && styles.optionTextActive]}>Historical</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleAnalyze} disabled={loading}>
            {loading ? <ActivityIndicator color="#1e2126" /> : <Text style={styles.buttonText}>Analyze {animalName}</Text>}
          </TouchableOpacity>
        </View>

        {data && (
          <View style={styles.resultsContainer}>
            {/* ── AI Advice Card ── */}
            {data.aiAdvice && (
              <View style={styles.adviceCard}>
                <View style={styles.adviceHeader}>
                  <Ionicons name="medical" size={20} color="#c1ff72" />
                  <Text style={styles.adviceTitle}>Veterinary Advisory</Text>
                </View>
                <Text style={styles.adviceText}>{data.aiAdvice}</Text>
              </View>
            )}

            {/* ── Collapsible JSON (Hiding behind the scene as requested) ── */}
            <TouchableOpacity 
              style={styles.debugToggle} 
              onPress={() => Alert.alert("Livestock Fact Sheet", JSON.stringify(data, null, 2))}
            >
              <Text style={styles.debugText}>View Raw Fact Sheet</Text>
              <Ionicons name="code-working-outline" size={14} color="#64748b" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e2126' },
  scroll: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 25 },
  title: { color: '#c1ff72', fontSize: 24, fontFamily: 'Roboto-Bold' },
  description: { color: '#64748b', fontSize: 14, marginTop: 4 },
  
  formCard: {
    backgroundColor: '#2a2d34',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#38383d',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#1e2126',
    color: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 15,
  },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  toggleTextContainer: { flex: 1 },
  toggleLabel: { color: '#fff', fontSize: 15, fontWeight: '600' },
  toggleSub: { color: '#64748b', fontSize: 12 },
  coordsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  
  optionsRow: { flexDirection: 'row', gap: 15, marginBottom: 20, justifyContent: 'center' },
  optionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: '#38383d', 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 8 
  },
  optionBtnActive: { backgroundColor: '#c1ff72' },
  optionText: { color: '#ccc', fontSize: 12, fontWeight: '600' },
  optionTextActive: { color: '#1e2126' },

  button: {
    backgroundColor: '#c1ff72',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#1e2126', fontSize: 16, fontWeight: 'bold' },
  resultsContainer: { gap: 20 },

  adviceCard: {
    backgroundColor: '#2a2d34',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#c1ff7240',
    shadowColor: '#c1ff72',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  adviceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  adviceTitle: { color: '#c1ff72', fontSize: 16, fontFamily: 'Roboto-Bold' },
  adviceText: { color: '#cbd5e1', fontSize: 14, lineHeight: 22, fontFamily: 'Roboto' },

  debugToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    opacity: 0.5,
  },
  debugText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
});
