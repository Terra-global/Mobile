import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOracle } from '../../utils/useOracle';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CropPage() {
  const { analyzeWithLocation } = useOracle();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];
  
  // Form States
  const [cropName, setCropName] = useState('Maize');
  const [useManualLoc, setUseManualLoc] = useState(false);
  const [lat, setLat] = useState('4.8156'); // Default Port Harcourt
  const [lon, setLon] = useState('7.0498');
  const [includeSeasonal, setIncludeSeasonal] = useState(false);
  const [includeHistory, setIncludeHistory] = useState(false);
  const [locationInfo, setLocationInfo] = useState<string>('');

  const handleAnalyze = async () => {
    setLoading(true);
    setData(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const manualCoords = useManualLoc ? { lat: parseFloat(lat), lon: parseFloat(lon) } : undefined;

      const factSheet = await analyzeWithLocation('CROP', cropName, {
        includeSeasonal,
        includeHistory,
        manualCoords
      });

      if (factSheet.environmental_snapshot) {
        setLocationInfo(factSheet.environmental_snapshot.location || 'Detected');
      }

      setData(factSheet);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    } catch (error: any) {
      console.error(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Analysis Failed', error.message || 'Could not fetch oracle data.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.formCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.inputLabel, { color: themeColors.subtext }]}>CROP TYPE</Text>
          <TextInput
            style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
            value={cropName}
            onChangeText={setCropName}
            placeholder="e.g. Maize, Cocoa, Rice"
            placeholderTextColor={themeColors.subtext}
          />

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextContainer}>
              <Text style={[styles.toggleLabel, { color: themeColors.text }]}>Override Location</Text>
              <Text style={[styles.toggleSub, { color: themeColors.subtext }]}>Bypass GPS for manual coordinates</Text>
            </View>
            <Switch
              value={useManualLoc}
              onValueChange={setUseManualLoc}
              trackColor={{ false: themeColors.border, true: themeColors.tint + '80' }}
              thumbColor={useManualLoc ? themeColors.tint : '#999'}
            />
          </View>

          {useManualLoc && (
            <View style={styles.coordsRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0, backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                value={lat}
                onChangeText={setLat}
                placeholder="Lat"
                keyboardType="numeric"
                placeholderTextColor={themeColors.subtext}
              />
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0, backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                value={lon}
                onChangeText={setLon}
                placeholder="Lon"
                keyboardType="numeric"
                placeholderTextColor={themeColors.subtext}
              />
            </View>
          )}

          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={[styles.optionBtn, { backgroundColor: themeColors.background, borderColor: themeColors.border }, includeSeasonal && { backgroundColor: themeColors.tint + '20', borderColor: themeColors.tint }]}
              onPress={() => setIncludeSeasonal(!includeSeasonal)}
            >
              <Ionicons name={includeSeasonal ? "checkbox" : "square-outline"} size={18} color={includeSeasonal ? themeColors.tint : themeColors.subtext} />
              <Text style={[styles.optionText, { color: themeColors.text }, includeSeasonal && { color: themeColors.tint }]}>Seasonal</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionBtn, { backgroundColor: themeColors.background, borderColor: themeColors.border }, includeHistory && { backgroundColor: themeColors.tint + '20', borderColor: themeColors.tint }]}
              onPress={() => setIncludeHistory(!includeHistory)}
            >
              <Ionicons name={includeHistory ? "checkbox" : "square-outline"} size={18} color={includeHistory ? themeColors.tint : themeColors.subtext} />
              <Text style={[styles.optionText, { color: themeColors.text }, includeHistory && { color: themeColors.tint }]}>Historical</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: themeColors.tint }]} 
            onPress={handleAnalyze} 
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Start Analysis</Text>}
          </TouchableOpacity>
        </View>

        {data && (
          <View style={styles.resultsContainer}>
            {data.aiAdvice && (
              <View style={[styles.adviceCard, { backgroundColor: themeColors.card, borderColor: themeColors.tint + '40' }]}>
                <View style={styles.adviceHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: themeColors.tint + '20' }]}>
                    <Ionicons name="sparkles" size={20} color={themeColors.tint} />
                  </View>
                  <View>
                    <Text style={[styles.adviceTitle, { color: themeColors.text }]}>Agri-Oracle Insight</Text>
                    <Text style={[styles.adviceSub, { color: themeColors.subtext }]}>{locationInfo}</Text>
                  </View>
                </View>
                <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
                <Text style={[styles.adviceText, { color: themeColors.text }]}>{data.aiAdvice}</Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.debugToggle} 
              onPress={() => Alert.alert("Technical Data", JSON.stringify(data, null, 2))}
            >
              <Text style={[styles.debugText, { color: themeColors.subtext }]}>View Full Fact Sheet</Text>
              <Ionicons name="chevron-forward" size={14} color={themeColors.subtext} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'flex-start', marginBottom: 25 },
  title: { fontSize: 28, fontWeight: 'bold', fontFamily: 'Roboto-Bold' },
  description: { fontSize: 16, marginTop: 4, fontFamily: 'Roboto' },
  
  formCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 1,
  },
  input: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
  },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  toggleTextContainer: { flex: 1 },
  toggleLabel: { fontSize: 16, fontWeight: '600' },
  toggleSub: { fontSize: 13, marginTop: 2 },
  coordsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  
  optionsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  optionBtn: { 
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 8, 
    paddingVertical: 12, 
    borderRadius: 12,
    borderWidth: 1,
  },
  optionText: { fontSize: 14, fontWeight: '600' },

  button: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  resultsContainer: { gap: 20 },
  adviceCard: {
    padding: 24,
    borderRadius: 28,
    borderWidth: 1.5,
  },
  adviceHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adviceTitle: { fontSize: 18, fontWeight: 'bold' },
  adviceSub: { fontSize: 12, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  divider: { height: 1, width: '100%', marginBottom: 16, opacity: 0.5 },
  adviceText: { fontSize: 15, lineHeight: 24, fontFamily: 'Roboto' },

  debugToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    opacity: 0.7,
  },
  debugText: { fontSize: 13, fontWeight: '600' },
});
