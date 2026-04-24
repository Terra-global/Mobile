import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  Switch, Animated, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../constants/theme';
import { chatWithOracle } from '../../utils/gemini';
import { analyzeCrop, analyzeAnimal } from '@terra-oracle/terra-oracle';

// ─── Keyword Detection ────────────────────────────────────────────────────────
const CROP_KEYWORDS = ['maize', 'corn', 'rice', 'wheat', 'cocoa', 'cassava', 'yam', 'tomato',
  'pepper', 'soybean', 'sorghum', 'millet', 'groundnut', 'cotton', 'sugarcane', 'plantain',
  'banana', 'coffee', 'tea', 'crop', 'plant', 'farm', 'soil', 'harvest', 'seed', 'fertilizer'];

const ANIMAL_KEYWORDS = ['poultry', 'cattle', 'goat', 'sheep', 'pig', 'chicken', 'cow',
  'fish', 'rabbit', 'turkey', 'livestock', 'animal', 'veterinary', 'vet', 'breed'];

function detectType(message: string): 'CROP' | 'ANIMAL' | null {
  const lower = message.toLowerCase();
  if (ANIMAL_KEYWORDS.some(kw => lower.includes(kw))) return 'ANIMAL';
  if (CROP_KEYWORDS.some(kw => lower.includes(kw))) return 'CROP';
  return null;
}

function extractSubject(message: string, type: 'CROP' | 'ANIMAL'): string {
  const lower = message.toLowerCase();
  const keywords = type === 'CROP' ? CROP_KEYWORDS : ANIMAL_KEYWORDS;
  const found = keywords.find(kw => lower.includes(kw));
  return found ? found.charAt(0).toUpperCase() + found.slice(1) : message.split(' ')[0];
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  loading?: boolean;
}

export default function OracleChatScreen() {
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      text: 'Hello! I am Terra Oracle. Ask me anything about crops, livestock, soil, or weather. Type a crop or animal name and I\'ll fetch real-time data for your location.',
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [useManualLoc, setUseManualLoc] = useState(false);
  const [lat, setLat] = useState('4.8156');
  const [lon, setLon] = useState('7.0498');
  const optionsHeight = useRef(new Animated.Value(0)).current;
  const listRef = useRef<FlatList>(null);

  const toggleOptions = () => {
    const toValue = showOptions ? 0 : 1;
    Haptics.selectionAsync();
    Animated.spring(optionsHeight, { toValue, useNativeDriver: false, tension: 80, friction: 10 }).start();
    setShowOptions(!showOptions);
  };

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const addMessage = (msg: Omit<Message, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    setMessages(prev => [...prev, { ...msg, id }]);
    return id;
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const userText = input.trim();
    setInput('');
    Keyboard.dismiss();
    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    addMessage({ role: 'user', text: userText });
    const thinkingId = addMessage({ role: 'ai', text: '', loading: true });
    scrollToBottom();

    try {
      const detectedType = detectType(userText);
      let factSheet: any = null;

      // If a crop/animal keyword is detected, fetch real fact sheet data
      if (detectedType) {
        const subject = extractSubject(userText, detectedType);

        let finalLat: number;
        let finalLon: number;
        let cityName = 'Your Location';
        let countryName = '';

        if (useManualLoc) {
          finalLat = parseFloat(lat);
          finalLon = parseFloat(lon);
        } else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            finalLat = coords.latitude;
            finalLon = coords.longitude;
            const [address] = await Location.reverseGeocodeAsync({ latitude: finalLat, longitude: finalLon });
            cityName = address?.city || address?.region || 'Your Location';
            countryName = address?.country || '';
          } else {
            finalLat = parseFloat(lat);
            finalLon = parseFloat(lon);
          }
        }

        try {
          factSheet = detectedType === 'CROP'
            ? await analyzeCrop(subject, { lat: finalLat, lon: finalLon }, { includeForecast: true })
            : await analyzeAnimal(subject, { lat: finalLat, lon: finalLon }, { includeForecast: true });

          if (factSheet?.environmental_snapshot) {
            factSheet.environmental_snapshot.location = `${cityName}${countryName ? ', ' + countryName : ''}`;
          }
        } catch {
          // If oracle SDK fails, fall back to general AI
          factSheet = null;
        }
      }

      const reply = await chatWithOracle(userText, factSheet || undefined, detectedType || undefined);

      // Replace the thinking bubble with the actual reply
      setMessages(prev => prev.map(m => m.id === thinkingId ? { ...m, text: reply, loading: false } : m));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    } catch (error) {
      setMessages(prev => prev.map(m => m.id === thinkingId
        ? { ...m, text: 'Something went wrong. Please try again.', loading: false }
        : m
      ));
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: themeColors.tint + '20' }]}>
            <Ionicons name="leaf" size={16} color={themeColors.tint} />
          </View>
        )}
        <View style={[
          styles.bubble,
          isUser
            ? [styles.bubbleUser, { backgroundColor: themeColors.tint }]
            : [styles.bubbleAI, { backgroundColor: themeColors.card, borderColor: themeColors.border }]
        ]}>
          {item.loading ? (
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color={themeColors.tint} />
              <Text style={[styles.typingText, { color: themeColors.subtext }]}>Oracle is thinking...</Text>
            </View>
          ) : (
            <Text style={[styles.bubbleText, { color: isUser ? '#fff' : themeColors.text }]}>
              {item.text}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const optionsMaxHeight = optionsHeight.interpolate({ inputRange: [0, 1], outputRange: [0, useManualLoc ? 180 : 80] });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['bottom']}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatList}
        onContentSizeChange={scrollToBottom}
        showsVerticalScrollIndicator={false}
      />

      {/* ── Options Panel ── */}
      <Animated.View style={[styles.optionsPanel, { maxHeight: optionsMaxHeight, backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.optionRow}>
          <View>
            <Text style={[styles.optionLabel, { color: themeColors.text }]}>Override Location</Text>
            <Text style={[styles.optionSub, { color: themeColors.subtext }]}>Use custom GPS coordinates</Text>
          </View>
          <Switch
            value={useManualLoc}
            onValueChange={(v) => { setUseManualLoc(v); Haptics.selectionAsync(); }}
            trackColor={{ false: themeColors.border, true: themeColors.tint + '80' }}
            thumbColor={useManualLoc ? themeColors.tint : '#999'}
          />
        </View>
        {useManualLoc && (
          <View style={styles.coordsRow}>
            <TextInput
              style={[styles.coordInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
              value={lat} onChangeText={setLat} placeholder="Latitude" keyboardType="numeric" placeholderTextColor={themeColors.subtext}
            />
            <TextInput
              style={[styles.coordInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
              value={lon} onChangeText={setLon} placeholder="Longitude" keyboardType="numeric" placeholderTextColor={themeColors.subtext}
            />
          </View>
        )}
      </Animated.View>

      {/* ── Input Bar ── */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.inputBar, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <TouchableOpacity
            style={[styles.iconBtn, showOptions && { backgroundColor: themeColors.tint + '20' }]}
            onPress={toggleOptions}
          >
            <Ionicons name={showOptions ? "close" : "add"} size={24} color={showOptions ? themeColors.tint : themeColors.subtext} />
          </TouchableOpacity>

          <TextInput
            style={[styles.textInput, { color: themeColors.text }]}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Oracle anything..."
            placeholderTextColor={themeColors.subtext}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />

          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: input.trim() ? themeColors.tint : themeColors.border }]}
            onPress={sendMessage}
            disabled={!input.trim() || sending}
          >
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chatList: { padding: 16, paddingBottom: 8, gap: 12 },

  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 },
  messageRowUser: { flexDirection: 'row-reverse' },

  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  bubble: { maxWidth: '78%', padding: 14, borderRadius: 20 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAI: { borderBottomLeftRadius: 4, borderWidth: 1 },
  bubbleText: { fontSize: 15, lineHeight: 22 },

  typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText: { fontSize: 13 },

  // ── Options Panel
  optionsPanel: {
    overflow: 'hidden',
    borderTopWidth: 1,
    paddingHorizontal: 16,
  },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  optionLabel: { fontSize: 15, fontWeight: '600' },
  optionSub: { fontSize: 12, marginTop: 2 },
  coordsRow: { flexDirection: 'row', gap: 10, paddingBottom: 12 },
  coordInput: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, fontSize: 14 },

  // ── Input Bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    gap: 8,
    borderTopWidth: 1,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  textInput: { flex: 1, fontSize: 15, maxHeight: 100, paddingVertical: 10, paddingHorizontal: 4 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
