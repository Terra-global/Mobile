import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { checkAlerts } from '@terra-oracle/terra-oracle';

export default function ThermalPage() {
  const [alertsData, setAlertsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lat, setLat] = useState('51.5074');
  const [lon, setLon] = useState('-0.1278');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const alerts = await checkAlerts({}, {
        lat: parseFloat(lat),
        lon: parseFloat(lon)
      });
      setAlertsData(alerts || []);
      
      if (alerts && alerts.length > 0) {
        Alert.alert('Oracle Sentinel Alert', alerts[0].message || JSON.stringify(alerts[0]));
      } else {
        Alert.alert('Oracle Sentinel', 'No severe alerts active at this time.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to check alerts. Check your coordinates.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Thermal Sentinel</Text>
        <Text style={styles.description}>Safety Sentinel enforcing Tiered Protocol Standards.</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={lat}
            onChangeText={setLat}
            placeholder="Latitude"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={lon}
            onChangeText={setLon}
            placeholder="Longitude"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={fetchAlerts} disabled={loading}>
          {loading ? <ActivityIndicator color="#1e2126" /> : <Text style={styles.buttonText}>Check Environment Alerts</Text>}
        </TouchableOpacity>

        {alertsData.length > 0 ? (
          <View style={styles.resultBox}>
            <Text style={styles.subHeader}>Active Alerts:</Text>
            {alertsData.map((alert: any, index: number) => (
              <View key={index} style={styles.alertItem}>
                <Text style={styles.resultText}>• {alert.message || JSON.stringify(alert)}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e2126' },
  scroll: { padding: 20 },
  title: { color: '#c1ff72', fontSize: 24, fontFamily: 'Roboto-Bold', marginBottom: 10 },
  description: { color: '#ccc', fontSize: 14, fontFamily: 'Roboto', marginBottom: 20 },
  inputContainer: { marginBottom: 15 },
  input: {
    backgroundColor: '#38383d',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    fontFamily: 'Roboto',
  },
  button: {
    backgroundColor: '#c1ff72',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: { color: '#1e2126', fontSize: 16, fontFamily: 'Roboto-Bold' },
  resultBox: {
    backgroundColor: '#38383d',
    padding: 20,
    borderRadius: 12,
  },
  subHeader: { color: '#ff5a5a', fontSize: 16, fontFamily: 'Roboto-Bold', marginBottom: 15 },
  alertItem: { paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#444' },
  resultText: { color: '#fff', fontFamily: 'Roboto', fontSize: 14 },
});
