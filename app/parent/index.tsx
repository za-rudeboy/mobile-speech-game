import { type Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGameStore } from '@/store/game-store';

export default function ParentScreen() {
  const router = useRouter();
  const buttonBackground = useThemeColor({ light: '#F3F4F6', dark: '#1F2328' }, 'background');
  const buttonBorder = useThemeColor({ light: '#D1D5DB', dark: '#2F363D' }, 'text');
  const secondaryText = useThemeColor({ light: '#5F6870', dark: '#BDC4CB' }, 'text');
  const speechEnabled = useGameStore((state) => state.speechEnabled);
  const setSpeechEnabled = useGameStore((state) => state.setSpeechEnabled);

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

      <View style={[styles.settingCard, { backgroundColor: buttonBackground, borderColor: buttonBorder }]}>
        <View style={styles.settingCopy}>
          <ThemedText style={styles.settingTitle}>Speech audio</ThemedText>
          <ThemedText style={[styles.settingDescription, { color: secondaryText }]}>
            Turn spoken prompts and feedback on or off across the app.
          </ThemedText>
        </View>
        <Switch
          value={speechEnabled}
          onValueChange={(nextValue) => {
            void setSpeechEnabled(nextValue);
          }}
          accessibilityLabel="Toggle speech audio"
        />
      </View>

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
  settingCard: {
    minHeight: 84,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  settingCopy: {
    flex: 1,
    gap: 4,
  },
  settingTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
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
