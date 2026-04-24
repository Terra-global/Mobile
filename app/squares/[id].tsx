import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useAudioRecorder, RecordingPresets, useAudioPlayer, requestRecordingPermissionsAsync } from 'expo-audio';
import { File } from 'expo-file-system';
import { io, Socket } from 'socket.io-client';
import api, { BASE_URL } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useAlertStore } from '../../store/alertStore';
import { Colors } from '../../constants/theme';

export default function MarketSquareRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];
  const insets = useSafeAreaInsets();
  const showAlert = useAlertStore(state => state.showAlert);

  const [square, setSquare] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true); // Default to muted for safety
  
  const socketRef = useRef<Socket | null>(null);
  const chatListRef = useRef<FlatList>(null);
  const streamIntervalRef = useRef<any>(null);
  const isRecordingRef = useRef(false);

  // Dual Recorders for "Handover" logic to prevent mic flickering in Expo Go
  const recorderA = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderB = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const activeRecorderRef = useRef<'A' | 'B'>('A');
  
  // Playback Player (For listening to others)
  const remotePlayer = useAudioPlayer();

  useEffect(() => {
    fetchSquareData();
    setupSocket();

    return () => {
      stopStreaming();
      if (socketRef.current) {
        socketRef.current.emit('leave-square', id as string);
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  // Audio Streaming Logic
  useEffect(() => {
    const me = participants.find(p => p.userId === currentUser?.id);
    if (me?.isOnStage && !isMuted) {
      startStreaming();
    } else {
      stopStreaming();
    }
  }, [isMuted, participants]);

  const startStreaming = async () => {
    if (isRecordingRef.current) return;
    isRecordingRef.current = true;
    activeRecorderRef.current = 'A';

    try {
      // Start the first recorder
      await recorderA.prepareToRecordAsync();
      recorderA.record();

      streamIntervalRef.current = setInterval(async () => {
        if (!isRecordingRef.current) return;

        try {
          const current = activeRecorderRef.current === 'A' ? recorderA : recorderB;
          const next = activeRecorderRef.current === 'A' ? recorderB : recorderA;

          // 1. Prepare and START the NEXT recorder BEFORE stopping the current one
          // This keeps the mic session active so the icon doesn't flicker
          await next.prepareToRecordAsync();
          next.record();

          // 2. Short delay to ensure overlap
          await new Promise(resolve => setTimeout(resolve, 100));

          // 3. Stop the PREVIOUS recorder and get its data
          await current.stop();
          const uri = current.uri;

          if (uri) {
            const file = new File(uri);
            const base64 = await file.base64();
            socketRef.current?.emit('audio-stream', {
              squareId: id as string,
              audioData: base64,
              userId: currentUser?.id
            });
          }

          // 4. Switch the active pointer
          activeRecorderRef.current = activeRecorderRef.current === 'A' ? 'B' : 'A';
          
        } catch (err) {
          console.error('Streaming chunk error:', err);
        }
      }, 3000); // 3s chunks for better stability with handover
    } catch (err) {
      console.error('Failed to start streaming:', err);
      isRecordingRef.current = false;
    }
  };

  const stopStreaming = async () => {
    isRecordingRef.current = false;
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    try {
      if (recorderA.isRecording) await recorderA.stop();
      if (recorderB.isRecording) await recorderB.stop();
    } catch (err) {
      // Ignore
    }
  };

  const fetchSquareData = async () => {
    try {
      const res = await api.get(`/squares/${id as string}`);
      if (res.data.success) {
        setSquare(res.data.data);
        setParticipants(res.data.data.participants || []);
        setMessages(res.data.data.messages?.reverse() || []);
      }
    } catch (error) {
      console.error('Failed to fetch square data:', error);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    const socketUrl = BASE_URL.replace('/api', '');

    socketRef.current = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      socketRef.current?.emit('join-square', id as string);
    });

    socketRef.current.on('new-square-message', (message: any) => {
      setMessages(prev => [...prev, message]);
      setTimeout(() => chatListRef.current?.scrollToEnd(), 100);
    });

    socketRef.current.on('stage-updated', (updatedParticipant: any) => {
      setParticipants(prev => {
        const index = prev.findIndex(p => p.userId === updatedParticipant.userId);
        if (index !== -1) {
          const newParticipants = [...prev];
          newParticipants[index] = { ...newParticipants[index], ...updatedParticipant };
          return newParticipants;
        }
        return [...prev, updatedParticipant];
      });
    });

    socketRef.current.on('square-ended', () => {
      showAlert('The Townhall has ended.', 'info');
      router.replace('/(tabs)/squares' as any);
    });

    socketRef.current.on('audio-stream', async (data: { audioData: string, userId: string }) => {
      if (data.userId === currentUser?.id) return; // Don't play own voice

      try {
        // Play the received chunk
        // Note: For simple implementation, we use a data URI
        const dataUri = `data:audio/m4a;base64,${data.audioData}`;
        remotePlayer.replace(dataUri);
        remotePlayer.play();
      } catch (err) {
        console.error('Failed to play audio chunk:', err);
      }
    });
  };

  const sendMessage = async () => {
    if (!messageText.trim()) return;
    try {
      const res = await api.post(`/squares/${id as string}/messages`, { content: messageText });
      if (res.data.success) {
        socketRef.current?.emit('send-square-message', { squareId: id as string, message: res.data.data });
        setMessageText('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const toggleMic = async () => {
    try {
      if (isMuted) {
        // Request permission before unmuting
        const permission = await requestRecordingPermissionsAsync();
        if (!permission.granted) {
          alert('Microphone permission is required to speak in the Townhall.');
          return;
        }
      }
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('Failed to toggle mic:', error);
    }
  };

  const handleEndSquare = async () => {
    try {
      await api.post(`/squares/${id as string}/end`);
      router.replace('/(tabs)/squares' as any);
    } catch (error) {
      console.error('Failed to end square:', error);
    }
  };

  const speakers = participants.filter(p => p.isOnStage);
  const audience = participants.filter(p => !p.isOnStage);
  const isCreator = square?.creatorId === currentUser?.id;

  if (loading) return <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'bottom']} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={28} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={1}>{square?.title?.toLowerCase()}</Text>
          <Text style={[styles.subtitle, { color: themeColors.subtext }]}>{participants.length} listening</Text>
        </View>

        {isCreator ? (
          <TouchableOpacity onPress={handleEndSquare} style={styles.endButton}>
            <Text style={styles.endButtonText}>End</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.leaveButton} onPress={() => router.back()}>
            <Text style={[styles.leaveButtonText, { color: themeColors.text }]}>Leave</Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Control Card for Speakers */}
        {participants.find(p => p.userId === currentUser?.id)?.isOnStage && (
          <View style={[styles.controlCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.controlInfo}>
              <Ionicons name="radio" size={20} color={isMuted ? themeColors.subtext : themeColors.tint} />
              <Text style={[styles.controlText, { color: themeColors.text }]}>
                {isMuted ? "Your mic is off" : "You are speaking live"}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={toggleMic} 
              style={[styles.micButton, { backgroundColor: isMuted ? '#ff4b4b' : themeColors.tint }]}
            >
              <Ionicons name={isMuted ? "mic-off" : "mic"} size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Stage Section (Speakers) */}
        <View style={styles.stageSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.subtext }]}>Townhall Stage</Text>
          <View style={styles.speakersGrid}>
            {speakers.map(speaker => (
              <View key={speaker.id} style={styles.speakerCard}>
                <View style={[styles.speakerAvatarContainer, speaker.user.id === square.creatorId && { borderColor: themeColors.tint, borderWidth: 2 }]}>
                  <Image 
                    source={{ uri: speaker.user.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=' + speaker.user.username }} 
                    style={styles.speakerAvatar} 
                  />
                  <View style={[styles.micBadge, { backgroundColor: (speaker.userId === currentUser?.id && isMuted) ? '#ff4b4b' : themeColors.card }]}>
                    <Ionicons name={(speaker.userId === currentUser?.id && isMuted) ? "mic-off" : "mic"} size={12} color={(speaker.userId === currentUser?.id && isMuted) ? "#fff" : themeColors.tint} />
                  </View>
                </View>
                <Text style={[styles.speakerName, { color: themeColors.text }]} numberOfLines={1}>
                  {speaker.user.username}
                </Text>
                {speaker.user.id === square.creatorId && (
                   <Text style={[styles.hostLabel, { color: themeColors.tint }]}>Host</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Audience Mini-list */}
        <View style={[styles.audienceSection, { borderTopColor: themeColors.border }]}>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.audienceScroll}>
                {audience.slice(0, 10).map(p => (
                    <Image 
                        key={p.id}
                        source={{ uri: p.user.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=' + p.user.username }} 
                        style={styles.audienceMiniAvatar} 
                    />
                ))}
                {audience.length > 10 && (
                    <View style={[styles.audienceMiniAvatar, styles.moreAvatar, { backgroundColor: themeColors.card }]}>
                        <Text style={[styles.moreText, { color: themeColors.subtext }]}>+{audience.length - 10}</Text>
                    </View>
                )}
             </ScrollView>
        </View>

        {/* Chat Section */}
        <View style={[styles.chatSection, { backgroundColor: themeColors.card + '50' }]}>
          <FlatList
            ref={chatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.messageItem}>
                <Image 
                  source={{ uri: item.user.avatarUrl || 'https://api.dicebear.com/7.x/identicon/png?seed=' + item.user.username }} 
                  style={styles.chatAvatar} 
                />
                <View style={styles.messageContent}>
                  <Text style={[styles.chatUsername, { color: themeColors.subtext }]}>{item.user.username}</Text>
                  <Text style={[styles.chatText, { color: themeColors.text }]}>{item.content}</Text>
                </View>
              </View>
            )}
            contentContainerStyle={styles.chatListContent}
            onContentSizeChange={() => chatListRef.current?.scrollToEnd()}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={Platform.OS === 'android'}
          />

          <View style={[
            styles.inputContainer, 
            { 
              borderTopColor: themeColors.border,
              paddingBottom: Platform.OS === 'ios' ? insets.bottom : insets.bottom + 12 
            }
          ]}>
            <TextInput
              style={[styles.input, { color: themeColors.text, backgroundColor: themeColors.background }]}
              placeholder="Join the conversation..."
              placeholderTextColor={themeColors.subtext}
              value={messageText}
              onChangeText={setMessageText}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, { backgroundColor: themeColors.tint }]} 
              onPress={sendMessage}
              disabled={!messageText.trim()}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    borderBottomWidth: 0.5,
  },
  headerInfo: { flex: 1, marginLeft: 12 },
  title: { fontSize: 13, fontFamily: 'Roboto', textTransform: 'lowercase', letterSpacing: 1, opacity: 0.6 },
  subtitle: { fontSize: 12, fontFamily: 'Roboto', opacity: 0.8 },
  leaveButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  leaveButtonText: { fontWeight: 'bold', fontSize: 14 },
  endButton: { backgroundColor: '#ff4b4b', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  endButtonText: { color: '#fff', fontWeight: 'bold' },
  stageSection: { padding: 16, minHeight: 180 },
  sectionTitle: { fontSize: 11, fontFamily: 'Roboto', letterSpacing: 1, textTransform: 'lowercase', opacity: 0.5, marginBottom: 16 },
  speakersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  speakerCard: { alignItems: 'center', width: 80 },
  speakerAvatarContainer: { position: 'relative', width: 64, height: 64, borderRadius: 32, padding: 2 },
  speakerAvatar: { width: '100%', height: '100%', borderRadius: 30 },
  micBadge: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  speakerName: { marginTop: 8, fontSize: 12, fontWeight: '500' },
  hostLabel: { fontSize: 10, fontFamily: 'Roboto', marginTop: 2 },
  audienceSection: { paddingVertical: 12, borderTopWidth: 0.5 },
  audienceScroll: { paddingHorizontal: 16, gap: 8 },
  audienceMiniAvatar: { width: 32, height: 32, borderRadius: 16 },
  moreAvatar: { alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1 },
  moreText: { fontSize: 10, fontWeight: 'bold' },
  controlCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  controlInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  controlText: { fontSize: 15, fontWeight: 'bold' },
  micButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  chatSection: { flex: 1, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
  chatListContent: { padding: 16, gap: 16 },
  messageItem: { flexDirection: 'row', gap: 12 },
  chatAvatar: { width: 28, height: 28, borderRadius: 14 },
  messageContent: { flex: 1 },
  chatUsername: { fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  chatText: { fontSize: 14, lineHeight: 20 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    gap: 12,
    borderTopWidth: 0.5,
  },
  input: { 
    flex: 1, 
    borderRadius: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
