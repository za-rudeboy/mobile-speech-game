import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { getDatabase } from '@/db';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useGameStore } from '@/store/game-store';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const loadAppSettings = useGameStore((state) => state.loadAppSettings);

  useEffect(() => {
    const initDatabase = async () => {
      try {
        await getDatabase();
        await loadAppSettings();
      } catch (error) {
        console.error('Failed to initialize database on app start', error);
      }
    };

    void initDatabase();
  }, [loadAppSettings]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="game/[gameId]" options={{ headerShown: false }} />
        <Stack.Screen name="parent" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
