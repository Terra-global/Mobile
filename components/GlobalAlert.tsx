import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, Animated, Dimensions, View } from 'react-native';
import { useAlertStore } from '@/store/alertStore';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export default function GlobalAlert() {
  const { visible, message, type, hideAlert } = useAlertStore();
  const translateY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: -40, // Floating above the bottom
        useNativeDriver: true,
        damping: 15,
        stiffness: 100,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 150,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const getIcon = () => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'alert-circle';
      default: return 'information-circle';
    }
  };

  const getAccentColor = () => {
    switch (type) {
      case 'success': return '#c1ff72';
      case 'error': return '#ff5a5a';
      default: return '#7b5af5';
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { transform: [{ translateY }] }
      ]}
    >
      <View style={[styles.content, { borderLeftColor: getAccentColor() }]}>
        <Ionicons name={getIcon() as any} size={22} color={getAccentColor()} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2d34',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    gap: 12,
    borderLeftWidth: 4,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Roboto',
    flex: 1,
  },
});
