import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type Shortcut = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

const SHORTCUTS: Shortcut[] = [
  { label: 'Crop',    icon: 'leaf-outline',        route: '/oracle/crop' },
  { label: 'Animal',  icon: 'paw-outline',         route: '/oracle/animal' },
];

export default function Shortcuts() {
  const router = useRouter();

  return (
    <View style={styles.sidebar}>
      {SHORTCUTS.map((s) => (
        <TouchableOpacity
          key={s.route}
          style={styles.item}
          activeOpacity={0.75}
          onPress={() => router.push(s.route as any)}
        >
          <View style={styles.iconBox}>
            <Ionicons name={s.icon} size={24} color="#c1ff72" />
          </View>
          <Text style={styles.label}>{s.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 68,
    backgroundColor: 'rgba(56, 56, 61, 0.8)',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 20,
    borderWidth: 1,
    borderColor: 'rgba(193, 255, 114, 0.1)',
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
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Roboto',
    textAlign: 'center',
  },
});
