import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLoadingStore } from '../store/loadingStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 56;

export default function LineLoader() {
  const isLoading = useLoadingStore(state => state.isLoading);
  const insets = useSafeAreaInsets();
  const animation = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isLoading) {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(animation, {
            toValue: SCREEN_WIDTH * 1.5,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(animation, {
            toValue: -SCREEN_WIDTH,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      animation.setValue(-SCREEN_WIDTH);
    }

    return () => {
      loopRef.current?.stop();
    };
  }, [isLoading]);

  if (!isLoading) return null;

  // Sits just above the tab bar
  const bottomOffset = TAB_BAR_HEIGHT + insets.bottom;

  return (
    <View style={[styles.container, { bottom: bottomOffset }]}>
      <Animated.View
        style={[
          styles.bar,
          { transform: [{ translateX: animation }] }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(193,255,114,0.12)',
    overflow: 'hidden',
    zIndex: 9999,
  },
  bar: {
    width: '50%',
    height: '100%',
    backgroundColor: '#c1ff72',
    shadowColor: '#c1ff72',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    borderRadius: 1,
  },
});
