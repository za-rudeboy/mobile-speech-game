import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DEFAULT_CHILD_NAME, DEFAULT_PARENT_LABEL } from '@/data/constants';
import { MVP_V1_GAME_COPY, MVP_V1_UI_GLOBAL, resolveCopyTokens } from '@/data/content/mvp-v1';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGameStore } from '@/store/game-store';

export default function GameFeedbackScreen() {
  const router = useRouter();
  const { gameId } = useLocalSearchParams<{ gameId?: string | string[] }>();
  const currentGameId = useGameStore((state) => state.currentGameId);
  const prompts = useGameStore((state) => state.prompts);
  const currentPromptIndex = useGameStore((state) => state.currentPromptIndex);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const lastAnswerCorrect = useGameStore((state) => state.lastAnswerCorrect);
  const nextPrompt = useGameStore((state) => state.nextPrompt);
  const endGame = useGameStore((state) => state.endGame);
  const speechEnabled = useGameStore((state) => state.speechEnabled);
  const resolvedGameId = Array.isArray(gameId) ? gameId[0] : gameId;
  const actionButtonColor = useThemeColor({ light: '#4A90D9', dark: '#5FA8F5' }, 'tint');
  const defaultBackground = useThemeColor({}, 'background');
  const feedbackBackground =
    lastAnswerCorrect === null
      ? defaultBackground
      : lastAnswerCorrect
        ? 'rgba(76, 175, 80, 0.15)'
        : 'rgba(244, 67, 54, 0.15)';
  const currentPrompt = prompts[currentPromptIndex];

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
    const spokenFeedback = resolveCopyTokens(rawFeedbackSentence, {
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
  }, [currentPrompt, gamePhase, lastAnswerCorrect, speechEnabled]);

  if (!currentPrompt || gamePhase !== 'feedback' || lastAnswerCorrect === null) {
    return <ThemedView style={styles.container} />;
  }

  const gameFeedback = MVP_V1_GAME_COPY[currentPrompt.game_id]?.feedback as
    | Record<string, string>
    | undefined;
  const rawFeedbackSentence =
    currentPrompt.model_phrase ??
    gameFeedback?.[currentPrompt.feedback_key] ??
    currentPrompt.correct_answer;
  const feedbackSentence = resolveCopyTokens(rawFeedbackSentence, {
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
    <ThemedView style={[styles.container, { backgroundColor: feedbackBackground }]}>
      <ThemedText style={styles.statusEmoji}>{lastAnswerCorrect ? '✅' : '❌'}</ThemedText>
      <ThemedText style={styles.headingText}>{headingText}</ThemedText>
      <ThemedText style={styles.feedbackSentence}>{feedbackSentence}</ThemedText>
      <Pressable
        accessibilityRole="button"
        onPress={handleNext}
        style={({ pressed }) => [
          styles.nextButton,
          { backgroundColor: actionButtonColor, opacity: pressed ? 0.85 : 1 },
        ]}>
        <ThemedText style={styles.nextText}>{MVP_V1_UI_GLOBAL.do_another}</ThemedText>
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
  statusEmoji: {
    fontSize: 84,
    lineHeight: 90,
  },
  headingText: {
    fontSize: 34,
    lineHeight: 40,
    textAlign: 'center',
    fontWeight: '700',
  },
  feedbackSentence: {
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
    fontWeight: '500',
  },
  nextButton: {
    marginTop: 8,
    minHeight: 72,
    minWidth: 180,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  nextText: {
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
  },
});
