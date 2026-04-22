import { Stack } from 'expo-router';

export default function OracleLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#1e2126' },
        headerTintColor: '#fff',
        contentStyle: { backgroundColor: '#1e2126' },
      }}
    >
      <Stack.Screen name="crop" options={{ title: 'Crop Data' }} />
      <Stack.Screen name="animal" options={{ title: 'Animal Data' }} />
    </Stack>
  );
}
