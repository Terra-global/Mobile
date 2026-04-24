import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../constants/theme';

export default function CreateSquareScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/squares', { title, description });
      if (res.data.success) {
        router.replace(`/squares/${res.data.data.id}` as any);
      }
    } catch (error) {
      console.error('Failed to create square:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Start a Townhall</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.infoBox}>
            <Ionicons name="megaphone" size={48} color={themeColors.tint} />
            <Text style={[styles.infoTitle, { color: themeColors.text }]}>Market Square</Text>
            <Text style={[styles.infoSub, { color: themeColors.subtext }]}>
              Gather the community to discuss prices, share farming tips, or just hang out.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: themeColors.subtext }]}>What's the topic?</Text>
            <TextInput
              style={[styles.input, { color: themeColors.text, backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              placeholder="e.g. Maize prices in Kumasi"
              placeholderTextColor={themeColors.subtext + '80'}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: themeColors.subtext }]}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: themeColors.text, backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              placeholder="Give people an idea of what we're talking about..."
              placeholderTextColor={themeColors.subtext + '80'}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          <TouchableOpacity 
            style={[styles.createButton, { backgroundColor: themeColors.tint }, (!title.trim() || loading) && { opacity: 0.5 }]}
            onPress={handleCreate}
            disabled={!title.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.createButtonText}>Start Room</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  backButton: { padding: 4 },
  content: { padding: 24, paddingBottom: 40 },
  infoBox: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  infoTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 16 },
  infoSub: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },
  input: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  createButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  createButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
