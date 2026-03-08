import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GAME_META } from '@/data/constants';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGameStore } from '@/store/game-store';
import { GameId } from '@/types';

function isGameId(value: string): value is GameId {
  return value in GAME_META;
}

const INTRO_SUBTITLES: Record<GameId, string> = {
  my_turn_your_turn: 'We will practice turns',
  where_is_it: "Let's find where things go",
  which_is_bigger: "Let's look for the bigger one",
};

export default function GameIntroScreen() {
  const router = useRouter();
  const { gameId } = useLocalSearchParams<{ gameId?: string | string[] }>();
  const startGame = useGameStore((state) => state.startGame);
  const tintColor = useThemeColor({}, 'tint');
  const onTintText = useThemeColor({}, 'background');
  const secondaryText = useThemeColor({}, 'icon');
  const resolvedGameId = Array.isArray(gameId) ? gameId[0] : gameId;
  const activeGameId = resolvedGameId && isGameId(resolvedGameId) ? resolvedGameId : null;
  const gameMeta = activeGameId ? GAME_META[activeGameId] : null;
  const subtitle = activeGameId ? INTRO_SUBTITLES[activeGameId] : 'Let\'s play';

  const handleStart = () => {
    if (!resolvedGameId || !isGameId(resolvedGameId)) {
      return;
    }

    startGame(resolvedGameId);
    router.push(`/game/${resolvedGameId}/play` as Href);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        {gameMeta?.title ?? 'Game'}
      </ThemedText>
      <ThemedText style={styles.emoji}>{gameMeta?.emoji ?? '🎮'}</ThemedText>
      <ThemedText style={[styles.subtitle, { color: secondaryText }]}>{subtitle}</ThemedText>

      <Pressable
        accessibilityRole="button"
        disabled={!gameMeta}
        onPress={handleStart}
        style={({ pressed }) => [
          styles.startButton,
          { backgroundColor: tintColor, opacity: pressed || !gameMeta ? 0.85 : 1 },
        ]}>
        <ThemedText style={[styles.startButtonText, { color: onTintText }]}>Start Game</ThemedText>
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
