import { Stack } from 'expo-router';

export default function GameLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="intro"
        options={{
          title: 'Game',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="play"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="feedback"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
