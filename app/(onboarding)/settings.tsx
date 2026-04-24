import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { Colors } from '@/constants/theme';

interface SettingsItemProps {
  icon: string;
  title: string;
  description: string;
  onPress?: () => void;
}

function SettingsItem({ icon, title, description, onPress }: SettingsItemProps) {
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];
  return (
    <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon as any} size={22} color={themeColors.tint} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.itemTitle, { color: themeColors.text }]}>{title}</Text>
        <Text style={[styles.itemDescription, { color: themeColors.subtext }]}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={themeColors.border} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const clearAuth = useAuthStore(state => state.clearAuth);
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background, paddingTop: insets.top }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.tint} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Settings</Text>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Ionicons name="search" size={18} color={themeColors.subtext} style={styles.searchIcon} />
          <TextInput 
            style={[styles.searchInput, { color: themeColors.text }]} 
            placeholder="Search settings" 
            placeholderTextColor={themeColors.subtext}
          />
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        
        <SettingsItem 
          icon="person-outline"
          title="Your account"
          description="See information about your account, manage your profile, and download your data."
          onPress={() => router.push('/account')}
        />

        <SettingsItem 
          icon="lock-closed-outline"
          title="Security and account access"
          description="Manage your account's security and keep track of your account's usage, including apps that you have connected to your account."
        />

        <SettingsItem 
          icon="star-outline"
          title="Terra Premium"
          description="See what's included in Premium and manage your crop analysis settings."
        />

        <SettingsItem 
          icon="shield-outline"
          title="Privacy and safety"
          description="Manage what information you see and share on Terra."
        />

        <SettingsItem 
          icon="notifications-outline"
          title="Notifications"
          description="Select the kinds of notification you get about your activities, interests and recommendations."
        />

        <SettingsItem 
          icon="accessibility-outline"
          title="Accessibility, display and languages"
          description="Manage how Terra content is displayed to you."
        />

        <SettingsItem 
          icon="ellipsis-horizontal-circle-outline"
          title="Additional resources"
          description="Check out other places for helpful information to learn more about Terra products and services."
        />

        <TouchableOpacity 
          style={[styles.itemContainer, { marginTop: 20 }]} 
          onPress={() => {
            Alert.alert('Log Out', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Log Out', style: 'destructive', onPress: () => {
                clearAuth();
                router.replace('/(auth)/login');
              }}
            ]);
          }}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="log-out-outline" size={22} color="#ff5a5a" />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.itemTitle, { color: '#ff5a5a' }]}>Log out</Text>
            <Text style={[styles.itemDescription, { color: themeColors.subtext }]}>Sign out of your account.</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { marginRight: 24 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 40,
    borderWidth: 1,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },

  scroll: { flex: 1 },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  iconContainer: {
    width: 40,
    paddingTop: 2,
  },
  textContainer: {
    flex: 1,
    paddingRight: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});
