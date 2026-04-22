import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const SOCIAL_PLATFORMS = [
  { label: 'Twitter / X', icon: 'logo-twitter' },
  { label: 'Instagram', icon: 'logo-instagram' },
  { label: 'Facebook', icon: 'logo-facebook' },
  { label: 'LinkedIn', icon: 'logo-linkedin' },
  { label: 'YouTube', icon: 'logo-youtube' },
  { label: 'TikTok', icon: 'logo-tiktok' },
  { label: 'WhatsApp', icon: 'logo-whatsapp' },
];

export default function JoinSocialsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [joined, setJoined] = React.useState<string[]>([]);

  const toggle = (label: string) => {
    setJoined(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#c1ff72" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Join Socials</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {SOCIAL_PLATFORMS.map((platform) => (
          <TouchableOpacity key={platform.label} style={styles.row} onPress={() => toggle(platform.label)}>
            <Ionicons name={platform.icon as any} size={24} color="#c1ff72" />
            <Text style={styles.rowLabel}>{platform.label}</Text>
            <View style={[styles.checkbox, joined.includes(platform.label) && styles.checkboxSelected]}>
              {joined.includes(platform.label) && <Ionicons name="checkmark" size={14} color="#1e2126" />}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity style={styles.updateButton} onPress={() => router.back()}>
          <Text style={styles.updateButtonText}>Update</Text>
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
  scrollContent: { paddingHorizontal: 24, paddingTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 18 },
  rowLabel: { flex: 1, color: '#fff', fontSize: 16, fontFamily: 'Roboto' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#c1ff72', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: '#c1ff72' },
  footer: { paddingHorizontal: 24, paddingTop: 12, backgroundColor: '#1e2126' },
  updateButton: { backgroundColor: '#c1ff72', borderRadius: 12, height: 56, alignItems: 'center', justifyContent: 'center' },
  updateButtonText: { color: '#1e2126', fontSize: 18, fontFamily: 'Roboto-Bold' },
});
