import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DEFAULT_SESSION_PROMPT_COUNT, GAME_META } from '@/data/constants';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGameStore } from '@/store/game-store';
import { GameId } from '@/types';

function isGameId(value: string): value is GameId {
  return value in GAME_META;
}

const INTRO_SUBTITLES: Record<GameId, string> = {
  my_turn_your_turn: 'We will practice turns later',
  where_is_it: "Let's practice where things are",
  daily_phrase_practice: "Let's practice words for real moments",
  do_what_i_say: "Let's follow short directions together",
  build_the_sentence: "Let's use a helpful sentence strip",
  picture_questions: "Let's answer with picture support",
  movement_search: "Let's use movement inside practice",
};

export default function GameIntroScreen() {
  const router = useRouter();
  const { gameId } = useLocalSearchParams<{ gameId?: string | string[] }>();
  const startGame = useGameStore((state) => state.startGame);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const [isStarting, setIsStarting] = useState(false);
  const tintColor = useThemeColor({}, 'tint');
  const onTintText = useThemeColor({}, 'background');
  const secondaryText = useThemeColor({}, 'icon');
  const resolvedGameId = Array.isArray(gameId) ? gameId[0] : gameId;
  const activeGameId = resolvedGameId && isGameId(resolvedGameId) ? resolvedGameId : null;
  const gameMeta = activeGameId ? GAME_META[activeGameId] : null;
  const subtitle = activeGameId ? INTRO_SUBTITLES[activeGameId] : 'Let\'s play';

  const handleStart = async () => {
    if (!resolvedGameId || !isGameId(resolvedGameId)) {
      return;
    }

    setIsStarting(true);
    const started = await startGame(resolvedGameId);
    setIsStarting(false);

    if (!started) {
      return;
    }

    router.push(`/game/${resolvedGameId}/play` as Href);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        {gameMeta?.title ?? 'Game'}
      </ThemedText>
      <ThemedText style={styles.emoji}>{gameMeta?.emoji ?? '🎮'}</ThemedText>
      <ThemedText style={[styles.subtitle, { color: secondaryText }]}>{subtitle}</ThemedText>
      <ThemedText style={[styles.levelInfo, { color: secondaryText }]}>
        Level {currentLevel} · {DEFAULT_SESSION_PROMPT_COUNT} short prompts
      </ThemedText>

      <Pressable
        accessibilityRole="button"
        disabled={!gameMeta || isStarting}
        onPress={handleStart}
        style={({ pressed }) => [
          styles.startButton,
          { backgroundColor: tintColor, opacity: pressed || !gameMeta || isStarting ? 0.85 : 1 },
        ]}>
        <ThemedText style={[styles.startButtonText, { color: onTintText }]}>
          {isStarting ? 'Loading...' : 'Start'}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  title: {
    textAlign: 'center',
    fontSize: 36,
    lineHeight: 42,
  },
  emoji: {
    fontSize: 80,
    lineHeight: 88,
  },
  subtitle: {
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
  },
  levelInfo: {
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
  },
  startButton: {
    marginTop: 12,
    minHeight: 72,
    minWidth: 220,
    paddingHorizontal: 28,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
  },
});
