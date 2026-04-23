import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AudioReplayButton } from '@/components/audio-replay-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SurfaceCard, PillButton } from '@/components/ui/app-primitives';
import { childTheme } from '@/constants/semantic-theme';
import { getWeeklyStats } from '@/db';
import { FIRST_WAVE_GAME_IDS, GAME_META, HOME_GAME_ORDER } from '@/data/constants';
import { usePromptAudio } from '@/hooks/use-prompt-audio';
import { useGameStore } from '@/store/game-store';
import type { GameId } from '@/types';

const HOME_GREETING_AUDIO = require('../assets/audio/001_hi_caelum.mp3');

interface GameCardProps {
  gameId: GameId;
  title: string;
  subtitle: string;
  emoji: string;
  enabled: boolean;
  onStart: () => void;
}

function GameCard({ gameId, title, subtitle, emoji, enabled, onStart }: GameCardProps) {
  return (
    <SurfaceCard
      style={[styles.gameCard, !enabled && styles.gameCardDisabled]}
      testID={`game-card-${gameId}`}>
      <View style={styles.gameCardTop}>
        <View style={styles.gameEmojiBubble}>
          <ThemedText style={styles.gameEmoji}>{emoji}</ThemedText>
        </View>
        <ThemedText role="childTitle" style={styles.gameTitle}>
          {title}
        </ThemedText>
      </View>

      <ThemedText role="childBody" style={styles.gameSubtitle}>
        {subtitle}
      </ThemedText>

      {enabled ? (
        <PillButton accessibilityLabel={`Start ${title}`} label="Start" onPress={onStart} style={styles.gameButton} />
      ) : (
        <View style={styles.comingSoonPill}>
          <ThemedText role="childLabel" style={styles.comingSoonText}>
            Coming soon
          </ThemedText>
        </View>
      )}
    </SurfaceCard>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const speechEnabled = useGameStore((state) => state.speechEnabled);
  const todayPromptCount = useGameStore((state) => state.todayPromptCount);
  const [dbPromptCount, setDbPromptCount] = useState(0);
  const greetingAudio = usePromptAudio({
    audioSource: HOME_GREETING_AUDIO,
    autoPlay: true,
    fallbackText: 'Hi, Caelum.',
    enabled: speechEnabled,
  });

  useEffect(() => {
    getWeeklyStats()
      .then((stats) => {
        setDbPromptCount(stats.totalPrompts);
      })
      .catch(console.error);
  }, [todayPromptCount]);

  const cards: { gameId: GameId; enabled: boolean }[] = HOME_GAME_ORDER.map((gameId) => ({
    gameId,
    enabled: FIRST_WAVE_GAME_IDS.some((value) => value === gameId),
  }));

  const displayCount = Math.max(todayPromptCount, dbPromptCount);

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <ThemedText role="childDisplay">Caelum</ThemedText>
            <ThemedText role="childBody" style={styles.headerBody}>
              Short, calm language games for one clear practice moment at a time.
            </ThemedText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enter parent mode"
            delayLongPress={3000}
            onLongPress={() => {
              void greetingAudio.stop();
              router.push('./parent');
            }}
            style={({ pressed }) => [styles.parentEntry, pressed && styles.parentEntryPressed]}>
            <ThemedText role="childLabel" style={styles.parentEntryText}>
              Parent
            </ThemedText>
          </Pressable>
        </View>

        <SurfaceCard style={styles.summaryCard}>
          <ThemedText role="childLabel">Today</ThemedText>
          <ThemedText role="childTitle" style={styles.practiceCount}>
            {displayCount} prompts
          </ThemedText>
          <ThemedText role="childBody" style={styles.summaryBody}>
            Start with a quick round, then take a break while it still feels easy.
          </ThemedText>
        </SurfaceCard>

        <AudioReplayButton
          accessibilityLabel="Replay home greeting audio"
          disabled={!greetingAudio.isAvailable}
          isLoading={greetingAudio.isLoading}
          isPlaying={greetingAudio.isPlaying}
          label="Hi, Caelum"
          onPress={() => {
            void greetingAudio.play();
          }}
        />

        <View style={styles.gameList}>
          {cards.map((card) => {
            const meta = GAME_META[card.gameId];

            return (
              <GameCard
                key={card.gameId}
                gameId={card.gameId}
                title={meta.title}
                subtitle={meta.subtitle}
                emoji={meta.emoji}
                enabled={card.enabled}
                onStart={() => {
                  void greetingAudio.stop();
                  router.push(`./game/${card.gameId}/intro`);
                }}
              />
            );
          })}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: childTheme.background,
  },
  content: {
    paddingTop: 56,
    paddingHorizontal: childTheme.pagePadding,
    paddingBottom: 40,
    gap: 18,
  },
  header: {
    gap: 16,
  },
  headerCopy: {
    gap: 10,
  },
  headerBody: {
    maxWidth: 560,
    color: childTheme.textMuted,
  },
  parentEntry: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: childTheme.radiusPill,
    backgroundColor: childTheme.surface,
    borderWidth: 1,
    borderColor: childTheme.outline,
  },
  parentEntryPressed: {
    opacity: 0.7,
  },
  parentEntryText: {
    color: childTheme.textSoft,
  },
  summaryCard: {
    paddingHorizontal: 22,
    paddingVertical: 22,
    gap: 6,
  },
  practiceCount: {
    color: childTheme.primary,
  },
  summaryBody: {
    color: childTheme.textMuted,
  },
  gameList: {
    gap: 18,
  },
  gameCard: {
    paddingHorizontal: 22,
    paddingVertical: 22,
    gap: 18,
  },
  gameCardDisabled: {
    opacity: 0.62,
  },
  gameCardTop: {
    gap: 14,
  },
  gameEmojiBubble: {
    width: 76,
    height: 76,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: childTheme.surfaceRaised,
  },
  gameEmoji: {
    fontSize: 38,
    lineHeight: 44,
  },
  gameTitle: {
    fontSize: 30,
    lineHeight: 36,
  },
  gameSubtitle: {
    color: childTheme.textMuted,
  },
  gameButton: {
    alignSelf: 'flex-start',
    minWidth: 164,
  },
  comingSoonPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: childTheme.radiusPill,
    backgroundColor: childTheme.surfaceRaised,
  },
  comingSoonText: {
    color: childTheme.textSoft,
  },
});
