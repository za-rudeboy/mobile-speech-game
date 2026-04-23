import { type Href, useRouter } from 'expo-router';
import { StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PillButton, SurfaceCard } from '@/components/ui/app-primitives';
import { parentTheme } from '@/constants/semantic-theme';
import { useGameStore } from '@/store/game-store';

export default function ParentScreen() {
  const router = useRouter();
  const speechEnabled = useGameStore((state) => state.speechEnabled);
  const setSpeechEnabled = useGameStore((state) => state.setSpeechEnabled);

  const menuItems: { label: string; route: Href }[] = [
    { label: 'Targets', route: './targets' },
    { label: 'Corrections', route: './corrections' },
    { label: 'Progress', route: './progress' },
  ];

  return (
    <ThemedView style={styles.container}>
      <ThemedText role="parentTitle" style={styles.title}>
        Parent Mode
      </ThemedText>
      <ThemedText role="parentBody" style={styles.subtitle}>
        Review settings, concepts, and recent notes with a cleaner admin-style layout.
      </ThemedText>

      <SurfaceCard variant="parent" style={styles.settingCard}>
        <View style={styles.settingCopy}>
          <ThemedText role="parentBody" style={styles.settingTitle}>
            Speech audio
          </ThemedText>
          <ThemedText role="parentLabel" style={styles.settingDescription}>
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
      </SurfaceCard>

      <View style={styles.menuList}>
        {menuItems.map((item) => (
          <PillButton
            key={item.label}
            label={item.label}
            onPress={() => {
              router.push(item.route);
            }}
            tone="secondary"
            variant="parent"
            style={styles.menuButton}
          />
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: parentTheme.pagePadding,
    paddingTop: 20,
    backgroundColor: parentTheme.background,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 20,
    color: parentTheme.textMuted,
  },
  settingCard: {
    minHeight: 96,
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
    color: parentTheme.text,
  },
  settingDescription: {
    color: parentTheme.textMuted,
  },
  menuList: {
    gap: 12,
  },
  menuButton: {
    alignItems: 'flex-start',
  },
});
