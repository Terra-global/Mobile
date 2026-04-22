import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import * as Location from 'expo-location';
import { getWeatherForecast } from '@terra-oracle/terra-oracle';

export default function WeatherPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lat, setLat] = useState('51.5074');
  const [lon, setLon] = useState('-0.1278');

  const fetchWeather = async () => {
    setLoading(true);
    try {
      // Use manual inputs to avoid the GPS/IP failures reported
      const forecastData = await getWeatherForecast({
        latitude: parseFloat(lat),
        longitude: parseFloat(lon)
      });

      if (forecastData?.alerts?.storm?.active) {
        Alert.alert("ORACLE ALERT", forecastData.alerts.storm.items[0].message);
      }

      setData(forecastData);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch weather data. Check your coordinates.');
    }
    setLoading(false);
  };

  const useCurrentLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required.');
        setLoading(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setLat(location.coords.latitude.toString());
      setLon(location.coords.longitude.toString());
      Alert.alert('Success', 'Coordinates updated from GPS');
    } catch (error) {
      Alert.alert('Error', 'Could not get current location');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Weather Oracle</Text>
        <Text style={styles.description}>Stateless 7-day weather forecast and storm alerts.</Text>

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

        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, { flex: 1, marginRight: 10 }]} onPress={fetchWeather} disabled={loading}>
            {loading ? <ActivityIndicator color="#1e2126" /> : <Text style={styles.buttonText}>Fetch Weather</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.iconButton} onPress={useCurrentLocation} disabled={loading}>
            <Text style={{ color: '#c1ff72', fontSize: 12 }}>GPS</Text>
          </TouchableOpacity>
        </View>

        {data && (
          <View style={styles.resultBox}>
            <Text style={styles.subHeader}>7-Day Outlook</Text>
            {data.week?.map((day: any, index: number) => (
              <View key={index} style={styles.dayRow}>
                <Text style={styles.dayLabel}>{day.label}</Text>
                <Text style={styles.dayTemp}>{day.temperature?.max?.value}°C</Text>
              </View>
            ))}
            <TouchableOpacity 
              style={{ marginTop: 20 }} 
              onPress={() => Alert.alert('Raw Data', JSON.stringify(data, null, 2))}
            >
              <Text style={{ color: '#c1ff72', fontSize: 12, textAlign: 'center' }}>View Full JSON Response</Text>
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
  buttonRow: { flexDirection: 'row', marginBottom: 20 },
  button: {
    backgroundColor: '#c1ff72',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 50,
    borderWidth: 1,
    borderColor: '#c1ff72',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#1e2126', fontSize: 16, fontFamily: 'Roboto-Bold' },
  resultBox: {
    backgroundColor: '#38383d',
    padding: 20,
    borderRadius: 12,
  },
  subHeader: { color: '#c1ff72', fontSize: 16, fontFamily: 'Roboto-Bold', marginBottom: 15 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#444' },
  dayLabel: { color: '#fff', fontSize: 14 },
  dayTemp: { color: '#c1ff72', fontSize: 14, fontWeight: 'bold' },
});
