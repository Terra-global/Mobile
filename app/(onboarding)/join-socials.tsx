import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';

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
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];
  const [joined, setJoined] = React.useState<string[]>([]);

  const toggle = (label: string) => {
    setJoined(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background, paddingTop: Math.max(insets.top, 20) }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={themeColors.tint} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: themeColors.subtext }]}>Join Socials</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {SOCIAL_PLATFORMS.map((platform) => (
          <TouchableOpacity key={platform.label} style={styles.row} onPress={() => toggle(platform.label)}>
            <Ionicons name={platform.icon as any} size={24} color={themeColors.tint} />
            <Text style={[styles.rowLabel, { color: themeColors.text }]}>{platform.label}</Text>
            <View style={[styles.checkbox, { borderColor: themeColors.tint }, joined.includes(platform.label) && { backgroundColor: themeColors.tint }]}>
              {joined.includes(platform.label) && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity style={[styles.updateButton, { backgroundColor: themeColors.tint }]} onPress={() => router.back()}>
          <Text style={styles.updateButtonText}>Update</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 15, fontFamily: 'Roboto', letterSpacing: 0.5 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 18 },
  rowLabel: { flex: 1, fontSize: 16, fontFamily: 'Roboto' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: 24, paddingTop: 12 },
  updateButton: { borderRadius: 12, height: 56, alignItems: 'center', justifyContent: 'center' },
  updateButtonText: { color: '#fff', fontSize: 18, fontFamily: 'Roboto-Bold' },
});
