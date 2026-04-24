import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export default function ChatScreen() {
  const { userId, name } = useLocalSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];
  const currentUser = useAuthStore(state => state.user);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchMessages();
    // In a real app, you would set up a websocket or polling here
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/messages/${userId}`);
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const messageText = input;
    setInput('');
    setSending(true);

    try {
      // Optimistic update
      const tempMessage = {
        id: Date.now().toString(),
        content: messageText,
        senderId: currentUser?.id,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, tempMessage]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      const res = await api.post('/messages', {
        receiverId: userId,
        content: messageText,
      });

      if (!res.data.success) {
        // Revert on failure
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      } else {
        // Update with real message
        setMessages(prev => prev.map(m => m.id === tempMessage.id ? res.data.data : m));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isMe = item.senderId === currentUser?.id;

    return (
      <View style={[styles.messageBubble, isMe ? [styles.myMessage, { backgroundColor: themeColors.tint }] : [styles.theirMessage, { backgroundColor: themeColors.card, borderColor: themeColors.border }]]}>
        <Text style={[styles.messageText, isMe ? styles.myMessageText : { color: themeColors.text }]}>
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text }]}>{name || 'Chat'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={themeColors.tint} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        <View style={[styles.inputContainer, { borderTopColor: themeColors.border }]}>
          <TextInput
            style={[styles.input, { color: themeColors.text, backgroundColor: themeColors.card, borderColor: themeColors.border }]}
            placeholder="Type a message..."
            placeholderTextColor={themeColors.subtext}
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, { backgroundColor: themeColors.tint, opacity: !input.trim() ? 0.5 : 1 }]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    borderWidth: 0.5,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'Roboto',
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 0.5,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    borderWidth: 0.5,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    marginRight: 12,
    fontSize: 15,
    fontFamily: 'Roboto',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
