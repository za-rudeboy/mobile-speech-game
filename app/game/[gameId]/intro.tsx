import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AudioReplayButton } from '@/components/audio-replay-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PillButton, SurfaceCard } from '@/components/ui/app-primitives';
import { childTheme } from '@/constants/semantic-theme';
import { DEFAULT_SESSION_PROMPT_COUNT, GAME_META } from '@/data/constants';
import { usePromptAudio } from '@/hooks/use-prompt-audio';
import { useGameStore } from '@/store/game-store';
import { GameId } from '@/types';

const INTRO_AUDIO_BY_GAME: Partial<Record<GameId, number>> = {
  where_is_it: require('../../../assets/audio/002_lets_play_where_is_it.mp3'),
};

function isGameId(value: string): value is GameId {
  return value in GAME_META;
}

const INTRO_SUBTITLES: Record<GameId, string> = {
  my_turn_your_turn: 'We will practice turns later',
  where_is_it: "Let's practice where things are",
  story_steps: "Let's tell picture stories together",
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
  const speechEnabled = useGameStore((state) => state.speechEnabled);
  const [isStarting, setIsStarting] = useState(false);
  const resolvedGameId = Array.isArray(gameId) ? gameId[0] : gameId;
  const activeGameId = resolvedGameId && isGameId(resolvedGameId) ? resolvedGameId : null;
  const gameMeta = activeGameId ? GAME_META[activeGameId] : null;
  const subtitle = activeGameId ? INTRO_SUBTITLES[activeGameId] : "Let's play";
  const introAudio = usePromptAudio({
    audioSource: activeGameId ? INTRO_AUDIO_BY_GAME[activeGameId] : undefined,
    autoPlay: activeGameId === 'where_is_it',
    fallbackText: subtitle,
    enabled: speechEnabled,
  });

  const handleStart = async () => {
    if (!resolvedGameId || !isGameId(resolvedGameId)) {
      return;
    }

    setIsStarting(true);
    await introAudio.stop();
    const started = await startGame(resolvedGameId);
    setIsStarting(false);

    if (!started) {
      return;
    }

    router.push(`/game/${resolvedGameId}/play` as Href);
  };

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.content}>
        <SurfaceCard style={styles.card}>
          <View style={styles.iconBubble}>
            <ThemedText style={styles.emoji}>{gameMeta?.emoji ?? '🎮'}</ThemedText>
          </View>
          <ThemedText role="childTitle" style={styles.title}>
            {gameMeta?.title ?? 'Game'}
          </ThemedText>
          <ThemedText role="childBody" style={styles.subtitle}>
            {subtitle}
          </ThemedText>
          <ThemedText role="childLabel" style={styles.levelInfo}>
            Level {currentLevel} · {DEFAULT_SESSION_PROMPT_COUNT} short prompts
          </ThemedText>
          {activeGameId === 'where_is_it' ? (
            <AudioReplayButton
              accessibilityLabel="Replay where is it intro audio"
              disabled={!introAudio.isAvailable}
              isLoading={introAudio.isLoading}
              isPlaying={introAudio.isPlaying}
              label="Let's play Where Is It?"
              onPress={() => {
                void introAudio.play();
              }}
            />
          ) : null}
          <PillButton
            accessibilityRole="button"
            disabled={!gameMeta || isStarting}
            label={isStarting ? 'Loading...' : 'Start'}
            onPress={handleStart}
            style={styles.startButton}
          />
        </SurfaceCard>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: childTheme.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: childTheme.pagePadding,
  },
  card: {
    width: '100%',
    maxWidth: 620,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 16,
  },
  iconBubble: {
    width: 112,
    height: 112,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: childTheme.surfaceRaised,
  },
  emoji: {
    fontSize: 62,
    lineHeight: 68,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: childTheme.textMuted,
  },
  levelInfo: {
    color: childTheme.textSoft,
    textAlign: 'center',
  },
  startButton: {
    width: '100%',
    maxWidth: 280,
    marginTop: 8,
  },
});
