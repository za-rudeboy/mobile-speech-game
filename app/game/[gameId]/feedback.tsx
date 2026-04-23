import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PillButton, SurfaceCard } from '@/components/ui/app-primitives';
import { childTheme } from '@/constants/semantic-theme';
import {
  resolvePromptSceneTokens,
  resolveWhereIsItScene,
} from '@/data/content/where-is-it-scenes';
import { DEFAULT_CHILD_NAME, DEFAULT_PARENT_LABEL } from '@/data/constants';
import { MVP_V1_GAME_COPY, MVP_V1_UI_GLOBAL } from '@/data/content/mvp-v1';
import { useGameStore } from '@/store/game-store';

export default function GameFeedbackScreen() {
  const router = useRouter();
  const { gameId } = useLocalSearchParams<{ gameId?: string | string[] }>();
  const currentGameId = useGameStore((state) => state.currentGameId);
  const activeSessionId = useGameStore((state) => state.activeSessionId);
  const prompts = useGameStore((state) => state.prompts);
  const currentPromptIndex = useGameStore((state) => state.currentPromptIndex);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const lastAnswerCorrect = useGameStore((state) => state.lastAnswerCorrect);
  const nextPrompt = useGameStore((state) => state.nextPrompt);
  const endGame = useGameStore((state) => state.endGame);
  const speechEnabled = useGameStore((state) => state.speechEnabled);
  const resolvedGameId = Array.isArray(gameId) ? gameId[0] : gameId;
  const currentPrompt = prompts[currentPromptIndex];
  const resolvedWhereScene = useMemo(() => {
    if (!currentPrompt) {
      return null;
    }

    return resolveWhereIsItScene(currentPrompt, activeSessionId, currentPromptIndex);
  }, [activeSessionId, currentPrompt, currentPromptIndex]);

  useEffect(() => {
    if (!resolvedGameId || !currentGameId || currentGameId !== resolvedGameId || prompts.length === 0) {
      router.replace('/');
      return;
    }

    if (gamePhase === 'playing' || gamePhase === 'intro') {
      router.replace(`/game/${resolvedGameId}/play` as Href);
      return;
    }

    if (gamePhase === 'complete' || gamePhase === 'idle') {
      router.replace('/');
    }
  }, [currentGameId, gamePhase, prompts.length, resolvedGameId, router]);

  useEffect(() => {
    if (!speechEnabled) {
      Speech.stop();
    }
  }, [speechEnabled]);

  useEffect(() => {
    if (!currentPrompt || gamePhase !== 'feedback' || lastAnswerCorrect === null) {
      return;
    }

    const gameFeedback = MVP_V1_GAME_COPY[currentPrompt.game_id]?.feedback as
      | Record<string, string>
      | undefined;
    const rawFeedbackSentence =
      currentPrompt.model_phrase ??
      gameFeedback?.[currentPrompt.feedback_key] ??
      currentPrompt.correct_answer;
    const spokenFeedback = resolvePromptSceneTokens(rawFeedbackSentence, resolvedWhereScene, {
      childName: DEFAULT_CHILD_NAME,
      parentLabel: DEFAULT_PARENT_LABEL,
    });

    if (!speechEnabled) {
      Speech.stop();
      return;
    }

    Speech.stop();
    Speech.speak(spokenFeedback, {
      rate: 0.85,
      pitch: 1,
    });
  }, [currentPrompt, gamePhase, lastAnswerCorrect, resolvedWhereScene, speechEnabled]);

  if (!currentPrompt || gamePhase !== 'feedback' || lastAnswerCorrect === null) {
    return <ThemedView style={styles.screen} />;
  }

  const gameFeedback = MVP_V1_GAME_COPY[currentPrompt.game_id]?.feedback as
    | Record<string, string>
    | undefined;
  const rawFeedbackSentence =
    currentPrompt.model_phrase ??
    gameFeedback?.[currentPrompt.feedback_key] ??
    currentPrompt.correct_answer;
  const feedbackSentence = resolvePromptSceneTokens(rawFeedbackSentence, resolvedWhereScene, {
    childName: DEFAULT_CHILD_NAME,
    parentLabel: DEFAULT_PARENT_LABEL,
  });
  const headingText = lastAnswerCorrect ? MVP_V1_UI_GLOBAL.nice_work : MVP_V1_UI_GLOBAL.try_again;

  const handleNext = () => {
    nextPrompt();

    const updatedState = useGameStore.getState();
    if (updatedState.gamePhase === 'playing') {
      router.replace(`/game/${resolvedGameId}/play` as Href);
      return;
    }

    if (updatedState.gamePhase === 'complete') {
      endGame();
      router.replace('/');
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.content}>
        <SurfaceCard
          style={[
            styles.card,
            lastAnswerCorrect ? styles.successCard : styles.retryCard,
          ]}>
          <View style={[styles.badge, lastAnswerCorrect ? styles.successBadge : styles.retryBadge]}>
            <ThemedText style={styles.badgeEmoji}>{lastAnswerCorrect ? '✓' : '↺'}</ThemedText>
          </View>
          <ThemedText role="childTitle" style={styles.heading}>
            {headingText}
          </ThemedText>
          <ThemedText role="childBody" style={styles.feedbackSentence}>
            {feedbackSentence}
          </ThemedText>
          <PillButton
            accessibilityRole="button"
            label={MVP_V1_UI_GLOBAL.do_another}
            onPress={handleNext}
            style={styles.nextButton}
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    gap: 18,
  },
  successCard: {
    backgroundColor: childTheme.successSurface,
    borderColor: '#2f6145',
  },
  retryCard: {
    backgroundColor: childTheme.surface,
    borderColor: '#5d353a',
  },
  badge: {
    width: 92,
    height: 92,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBadge: {
    backgroundColor: childTheme.success,
  },
  retryBadge: {
    backgroundColor: '#7d4148',
  },
  badgeEmoji: {
    fontSize: 42,
    lineHeight: 42,
    color: '#09130d',
  },
  heading: {
    textAlign: 'center',
  },
  feedbackSentence: {
    textAlign: 'center',
    color: childTheme.text,
  },
  nextButton: {
    width: '100%',
    maxWidth: 280,
  },
});
