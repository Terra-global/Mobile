import { Stack } from 'expo-router';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../constants/theme';

export default function OracleLayout() {
  const { theme } = useThemeStore();
  const themeColors = Colors[theme];

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { 
          backgroundColor: themeColors.background,
        },
        headerShadowVisible: false,
        headerTintColor: themeColors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontFamily: 'Roboto-Bold',
          fontSize: 18,
        },
        contentStyle: { backgroundColor: themeColors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Terra Oracle' }} />
      <Stack.Screen name="crop" options={{ title: 'Crop Analysis' }} />
      <Stack.Screen name="animal" options={{ title: 'Livestock Analysis' }} />
      <Stack.Screen name="thermal" options={{ title: 'Thermal Map' }} />
      <Stack.Screen name="weather" options={{ title: 'Weather Forecast' }} />
    </Stack>
  );
}
