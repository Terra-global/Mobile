import React, { createContext, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  interpolate, 
  Extrapolation,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/themeStore';
import { Colors } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

type DrawerContextType = {
  openDrawer: () => void;
  closeDrawer: () => void;
};

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export function useDrawer() {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must be used within a SideDrawer');
  }
  return context;
}

export default function SideDrawer({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];
  
  const translateX = useSharedValue(DRAWER_WIDTH);
  const contextValue = useSharedValue(0);

  const openDrawer = useCallback(() => {
    'worklet';
    translateX.value = withTiming(0, { duration: 250 });
  }, []);

  const closeDrawer = useCallback(() => {
    'worklet';
    translateX.value = withTiming(DRAWER_WIDTH, { duration: 250 });
  }, []);

  const panGesture = Gesture.Pan()
    .hitSlop({ right: 0, width: 60 })
    .onStart(() => {
      contextValue.value = translateX.value;
    })
    .onUpdate((event) => {
      const newX = contextValue.value + event.translationX;
      if (newX >= 0 && newX <= DRAWER_WIDTH) {
        translateX.value = newX;
      }
    })
    .onEnd((event) => {
      if (event.translationX > 50 || translateX.value > DRAWER_WIDTH / 2) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [DRAWER_WIDTH, 0], [0, 0.4], Extrapolation.CLAMP),
    display: translateX.value === DRAWER_WIDTH ? 'none' : 'flex',
  }));

  const navigateTo = (path: string) => {
    translateX.value = withTiming(DRAWER_WIDTH, { duration: 200 });
    router.push(path as any);
  };

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer }}>
      <View style={styles.container}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={{ flex: 1 }}>
            {children}
          </Animated.View>
        </GestureDetector>

        {/* ── Backdrop ── */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={{ flex: 1 }} onPress={() => closeDrawer()} />
        </Animated.View>

        {/* ── Drawer ── */}
        <Animated.View style={[styles.drawer, drawerStyle, { backgroundColor: themeColors.background, borderLeftColor: themeColors.border, borderLeftWidth: theme === 'light' ? 1 : 0 }]}>
          <View style={[styles.drawerContent, { paddingTop: insets.top + 40 }]}>
            <Text style={[styles.sectionTitle, { color: themeColors.subtext }]}>analytical tools</Text>
            
            <View style={styles.toolGrid}>
              <TouchableOpacity 
                style={[styles.gridItem, styles.borderRight, styles.borderBottom, { borderRightColor: themeColors.border, borderBottomColor: themeColors.border, borderTopColor: themeColors.border }]} 
                onPress={() => navigateTo('/oracle/crop')}
              >
                <Ionicons name="leaf-outline" size={32} color={themeColors.tint} />
                <Text style={[styles.gridLabel, { color: themeColors.text }]}>Crop Data</Text>
              </TouchableOpacity>
 
              <TouchableOpacity 
                style={[styles.gridItem, styles.borderBottom, { borderBottomColor: themeColors.border, borderTopColor: themeColors.border }]} 
                onPress={() => navigateTo('/oracle/animal')}
              >
                <Ionicons name="paw-outline" size={32} color={themeColors.tint} />
                <Text style={[styles.gridLabel, { color: themeColors.text }]}>Animal Data</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.drawerFooter, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={[styles.footerText, { color: themeColors.border }]}>terra v1.0.0</Text>
          </View>
        </Animated.View>
      </View>
    </DrawerContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99,
  },
  drawer: {
    position: 'absolute',
    right: 0, 
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: -10, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 25,
  },
  drawerContent: { flex: 1 },
  sectionTitle: { 
    fontSize: 11, 
    fontWeight: '500', 
    textTransform: 'lowercase', 
    letterSpacing: 1.5, 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  toolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '50%',
    aspectRatio: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'transparent',
    borderTopWidth: 0.5,
  },
  gridLabel: { 
    fontSize: 13, 
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 12,
  },
  borderRight: {
    borderRightWidth: 0.5,
  },
  borderBottom: {
    borderBottomWidth: 0.5,
  },
  
  drawerFooter: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: { fontSize: 11, fontWeight: 'bold', textTransform: 'lowercase' },
});
