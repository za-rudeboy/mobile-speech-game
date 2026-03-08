import { Stack } from 'expo-router';

export default function ParentLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Parent Mode',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="targets"
        options={{
          title: 'Targets',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="corrections"
        options={{
          title: 'Corrections',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="progress"
        options={{
          title: 'Progress',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
