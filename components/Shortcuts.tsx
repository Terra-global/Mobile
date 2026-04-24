import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../store/themeStore';
import { Colors } from '../constants/theme';

type Shortcut = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

const SHORTCUTS: Shortcut[] = [
  { label: 'Crop',    icon: 'leaf-outline',        route: '/oracle/crop' },
  { label: 'Animal',  icon: 'paw-outline',         route: '/oracle/animal' },
  { label: 'Messages',icon: 'chatbubbles-outline', route: '/messages' },
];

export default function Shortcuts() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];

  return (
    <View style={[styles.sidebar, { backgroundColor: theme === 'dark' ? 'rgba(30, 33, 38, 0.85)' : 'rgba(255, 255, 255, 0.85)', borderColor: themeColors.border }]}>
      {SHORTCUTS.map((s) => (
        <TouchableOpacity
          key={s.route}
          style={styles.item}
          activeOpacity={0.75}
          onPress={() => router.push(s.route as any)}
        >
          <View style={[styles.iconBox, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)' }]}>
            <Ionicons name={s.icon} size={24} color={themeColors.tint} />
          </View>
          <Text style={[styles.label, { color: themeColors.text }]}>{s.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 68,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 20,
    borderWidth: 1,
    // Floating effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  item: {
    alignItems: 'center',
    width: '100%',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Roboto',
    textAlign: 'center',
  },
});
