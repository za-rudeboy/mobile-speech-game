import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AudioReplayButton } from '@/components/audio-replay-button';
import { getWeeklyStats } from '@/db';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FIRST_WAVE_GAME_IDS, GAME_META, HOME_GAME_ORDER } from '@/data/constants';
import { usePromptAudio } from '@/hooks/use-prompt-audio';
import { useThemeColor } from '@/hooks/use-theme-color';
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
  const tintColor = useThemeColor({ light: '#4A90D9', dark: '#5FA8F5' }, 'tint');
  const cardBackground = useThemeColor({ light: '#FFFFFF', dark: '#1F2428' }, 'background');
  const bodyTextColor = useThemeColor({ light: '#5F6870', dark: '#BDC4CB' }, 'text');

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: cardBackground },
        !enabled && styles.cardDisabled,
      ]}
      accessibilityLabel={`${title} game card`}
      testID={`game-card-${gameId}`}>
      <ThemedText style={styles.emoji}>{emoji}</ThemedText>
      <ThemedText style={styles.cardTitle}>{title}</ThemedText>
      <ThemedText style={[styles.cardSubtitle, { color: bodyTextColor }]}>{subtitle}</ThemedText>

      {enabled ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Start ${title}`}
          onPress={onStart}
          style={({ pressed }) => [
            styles.startButton,
            { backgroundColor: tintColor },
            pressed && styles.startButtonPressed,
          ]}>
          <ThemedText style={styles.startButtonText}>Start</ThemedText>
        </Pressable>
      ) : (
        <ThemedText style={styles.comingSoonText}>Coming Soon</ThemedText>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const screenBackground = useThemeColor({ light: '#F5F7FA', dark: '#151718' }, 'background');
  const mutedText = useThemeColor({ light: '#9BA1A6', dark: '#9BA1A6' }, 'text');
  const practiceCounterText = useThemeColor({ light: '#5F6870', dark: '#BDC4CB' }, 'text');

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
    <ThemedView style={[styles.screen, { backgroundColor: screenBackground }]}>
      <View style={styles.headerRow}>
        <ThemedText style={styles.appTitle}>Caelum</ThemedText>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enter parent mode"
          delayLongPress={3000}
          onLongPress={() => {
            void greetingAudio.stop();
            router.push('./parent');
          }}
          style={({ pressed }) => [styles.parentButton, pressed && styles.parentButtonPressed]}>
          <ThemedText style={[styles.parentButtonText, { color: mutedText }]}>Parent</ThemedText>
        </Pressable>
      </View>

      <ThemedText style={[styles.practiceCounter, { color: practiceCounterText }]}>
        Practiced today: {displayCount} prompts
      </ThemedText>
      <ThemedText style={[styles.helperText, { color: practiceCounterText }]}>
        Start with short, practical language practice.
      </ThemedText>
      <View style={styles.audioButtonWrap}>
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
      </View>

      <ScrollView
        style={styles.cardList}
        contentContainerStyle={styles.cardListContent}
        showsVerticalScrollIndicator={false}>
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
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appTitle: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700',
  },
  parentButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  parentButtonPressed: {
    opacity: 0.6,
  },
  parentButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  practiceCounter: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 22,
  },
  helperText: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 20,
  },
  audioButtonWrap: {
    marginTop: 16,
  },
  cardList: {
    flex: 1,
    marginTop: 18,
  },
  cardListContent: {
    paddingBottom: 28,
    gap: 18,
  },
  card: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E4E8EE',
  },
  cardDisabled: {
    opacity: 0.58,
  },
  emoji: {
    fontSize: 40,
    lineHeight: 46,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 18,
  },
  startButton: {
    alignSelf: 'center',
    minWidth: 136,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: 'center',
  },
  startButtonPressed: {
    opacity: 0.85,
  },
  startButtonText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  comingSoonText: {
    alignSelf: 'center',
    fontSize: 18,
    lineHeight: 22,
    fontStyle: 'italic',
    color: '#8A9199',
  },
});
