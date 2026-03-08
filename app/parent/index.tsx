import { type Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ParentScreen() {
  const router = useRouter();
  const buttonBackground = useThemeColor({ light: '#F3F4F6', dark: '#1F2328' }, 'background');
  const buttonBorder = useThemeColor({ light: '#D1D5DB', dark: '#2F363D' }, 'text');

  const menuItems: { label: string; route: Href }[] = [
    { label: 'Targets', route: './targets' },
    { label: 'Corrections', route: './corrections' },
    { label: 'Progress', route: './progress' },
  ];

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Parent Mode
      </ThemedText>

      <View style={styles.menuList}>
        {menuItems.map((item) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            onPress={() => {
              router.push(item.route);
            }}
            style={({ pressed }) => [
              styles.menuButton,
              { backgroundColor: buttonBackground, borderColor: buttonBorder },
              pressed && styles.menuButtonPressed,
            ]}>
            <ThemedText style={styles.menuButtonLabel}>{item.label}</ThemedText>
          </Pressable>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    marginBottom: 20,
  },
  menuList: {
    gap: 12,
  },
  menuButton: {
    minHeight: 64,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  menuButtonPressed: {
    opacity: 0.7,
  },
  menuButtonLabel: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
  },
});
