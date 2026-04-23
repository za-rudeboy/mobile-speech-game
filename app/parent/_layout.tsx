import { Stack } from 'expo-router';

import { parentTheme } from '@/constants/semantic-theme';

const headerOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: parentTheme.surface },
  headerTintColor: parentTheme.text,
  headerTitleStyle: { fontWeight: '600' as const },
};

export default function ParentLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ ...headerOptions, title: 'Parent Mode' }} />
      <Stack.Screen name="targets" options={{ ...headerOptions, title: 'Targets' }} />
      <Stack.Screen name="corrections" options={{ ...headerOptions, title: 'Corrections' }} />
      <Stack.Screen name="progress" options={{ ...headerOptions, title: 'Progress' }} />
    </Stack>
  );
}
