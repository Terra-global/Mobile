import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../constants/theme';
import { signOutGoogle } from '../../utils/google-auth';

export default function YourAccountScreen() {
  const router = useRouter();
  const clearAuth = useAuthStore(state => state.clearAuth);
  const { theme, toggleTheme } = useThemeStore();
  const themeColors = Colors[theme];

  const menuItems = [
    {
      icon: theme === 'dark' ? 'moon-outline' : 'sunny-outline',
      title: 'Display theme',
      description: `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode.`,
      onPress: toggleTheme
    },
    {
      icon: 'person-outline',
      title: 'Account information',
      description: 'See your account information like your username and email address.',
      onPress: () => router.push('/account/info')
    },
    {
      icon: 'key-outline',
      title: 'Change your password',
      description: 'Change your password at any time.',
    },
    {
      icon: 'download-outline',
      title: 'Download an archive of your data',
      description: 'Get an insight into the data that we have for your account.',
    },
    {
      icon: 'heart-dislike-outline',
      title: 'Deactivate your account',
      description: 'Find out how you can deactivate your account.',
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.tint} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Your account</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.introText, { color: themeColors.subtext }]}>
          See information about your account, download an archive of your data or learn about your account deactivation options.
        </Text>

        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.item} onPress={item.onPress}>
            <View style={styles.iconBox}>
              <Ionicons name={item.icon as any} size={22} color={themeColors.icon} />
            </View>
            <View style={styles.textBox}>
              <Text style={[styles.itemTitle, { color: themeColors.text }]}>{item.title}</Text>
              <Text style={[styles.itemDescription, { color: themeColors.subtext }]}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.border} />
          </TouchableOpacity>
        ))}

        <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
        
        <TouchableOpacity 
          style={styles.item} 
          onPress={async () => {
            await signOutGoogle();
            clearAuth();
            router.replace('/(auth)/login');
          }}
        >
          <View style={styles.iconBox}>
            <Ionicons name="log-out-outline" size={22} color="#ff4b4b" />
          </View>
          <View style={styles.textBox}>
            <Text style={[styles.itemTitle, { color: '#ff4b4b' }]}>Log out</Text>
            <Text style={[styles.itemDescription, { color: themeColors.subtext }]}>Sign out of your account on this device.</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1 },
  introText: {
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    lineHeight: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  iconBox: { width: 40 },
  textBox: { flex: 1, paddingRight: 10 },
  itemTitle: { fontSize: 16, marginBottom: 4 },
  itemDescription: { fontSize: 13, lineHeight: 18 },
  divider: { height: 1, marginHorizontal: 16 },
});
