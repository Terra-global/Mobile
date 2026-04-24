import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts, Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/hooks/use-color-scheme';
import GlobalAlert from '../components/GlobalAlert';
import LineLoader from '../components/LineLoader';
import { useLoadingStore } from '../store/loadingStore';
import { useThemeStore } from '../store/themeStore';
import { Colors } from '../constants/theme';
import { configureGoogleSignin } from '../utils/google-auth';

// Initialize Google Sign-In
configureGoogleSignin();

// Set native background color immediately to prevent white flashes
SystemUI.setBackgroundColorAsync('#0a0a0a');
NavigationBar.setButtonStyleAsync('light');

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

export default function RootLayout() {
  const setIsLoading = useLoadingStore(state => state.setIsLoading);
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];

  const [loaded] = useFonts({
    Roboto: Roboto_400Regular,
    'Roboto-Bold': Roboto_700Bold,
  });

  const DynamicTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: themeColors.background,
      card: themeColors.background,
      text: themeColors.text,
      border: themeColors.border,
    },
  };

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      SystemUI.setBackgroundColorAsync(themeColors.background);
      
      // Update Android Navigation Bar
      NavigationBar.setBackgroundColorAsync(themeColors.background);
      NavigationBar.setButtonStyleAsync(theme === 'dark' ? 'light' : 'dark');
    }
  }, [loaded, themeColors.background, theme]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DynamicTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: themeColors.background },
              animation: 'none',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="account/index" options={{ title: 'Account' }} />
            <Stack.Screen name="account/info" options={{ title: 'Account Info' }} />
            <Stack.Screen name="account/farm-type" options={{ title: 'Farm Type' }} />
            <Stack.Screen name="new-post" options={{ presentation: 'modal', title: 'New Post' }} />
          </Stack>
        <LineLoader />
        <GlobalAlert />
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
