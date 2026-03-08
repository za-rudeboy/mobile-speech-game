import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DEFAULT_CHILD_NAME, DEFAULT_PARENT_LABEL } from '@/data/constants';
import { resolveCopyTokens } from '@/data/content/mvp-v1';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGameStore } from '@/store/game-store';
import { GameId } from '@/types';

interface CircleSpec {
  size: number;
  color: string;
}

function getWhereIsItScene(sceneKey: string) {
  const cleanSceneKey = sceneKey.replace(/\uFE0F/g, '');
  const sceneParts = Array.from(cleanSceneKey);

  return {
    left: sceneParts[0] ?? cleanSceneKey,
    right: sceneParts[1] ?? '📍',
  };
}

function WhereIsItScene({ sceneKey, correctAnswer }: { sceneKey: string; correctAnswer: string }) {
  const scene = getWhereIsItScene(sceneKey);
  const relation = correctAnswer.toLowerCase();

  if (relation === 'next to') {
    return (
      <View style={styles.whereSceneCanvas}>
        <View style={styles.wherePairRow}>
          <ThemedText style={styles.wherePrimaryEmojiInline}>{scene.left}</ThemedText>
          <ThemedText style={styles.whereAnchorEmoji}>{scene.right}</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.whereSceneCanvas}>
      <ThemedText style={styles.whereAnchorEmoji}>{scene.right}</ThemedText>
      <ThemedText
        style={[
          styles.wherePrimaryEmoji,
          relation === 'in' && styles.wherePrimaryIn,
          relation === 'on' && styles.wherePrimaryOn,
          relation === 'under' && styles.wherePrimaryUnder,
        ]}>
        {scene.left}
      </ThemedText>
    </View>
  );
}

function SizeComparisonScene({ sceneKey }: { sceneKey: string }) {
  let circles: CircleSpec[] = [
    { size: 120, color: '#4A90D9' },
    { size: 60, color: '#4CAF50' },
  ];

  if (sceneKey === 'same_pair') {
    circles = [
      { size: 80, color: '#F7C948' },
      { size: 80, color: '#F7C948' },
    ];
  }

  if (sceneKey === 'different_pair') {
    circles = [
      { size: 80, color: '#F7C948' },
      { size: 60, color: '#7E57C2' },
    ];
  }

  return (
    <View style={styles.sizeSceneRow}>
      {circles.map((circle, index) => (
        <View
          key={`${sceneKey}-circle-${index}`}
          style={[
            styles.sceneCircle,
            {
              width: circle.size,
              height: circle.size,
              backgroundColor: circle.color,
            },
          ]}
        />
      ))}
    </View>
  );
}

function getPersonEmoji(label: string) {
  const normalizedLabel = label.trim().toLowerCase();

  if (normalizedLabel === DEFAULT_CHILD_NAME.toLowerCase()) {
    return '🧒';
  }

  if (normalizedLabel === DEFAULT_PARENT_LABEL.toLowerCase()) {
    return '👨';
  }

  return '🙂';
}

function renderScene(gameId: GameId, sceneKey: string, correctAnswer: string) {
  if (gameId === 'my_turn_your_turn') {
    return (
      <View style={styles.emojiRow}>
        <View style={styles.personWithLabel}>
          <ThemedText style={styles.personEmoji}>🧒</ThemedText>
          <ThemedText style={styles.personLabel}>{DEFAULT_CHILD_NAME}</ThemedText>
        </View>
        <ThemedText style={styles.objectEmoji}>{sceneKey}</ThemedText>
        <View style={styles.personWithLabel}>
          <ThemedText style={styles.personEmoji}>👨</ThemedText>
          <ThemedText style={styles.personLabel}>{DEFAULT_PARENT_LABEL}</ThemedText>
        </View>
      </View>
    );
  }

  if (gameId === 'where_is_it') {
    return <WhereIsItScene sceneKey={sceneKey} correctAnswer={correctAnswer} />;
  }

  return <SizeComparisonScene sceneKey={sceneKey} />;
}

export default function GamePlayScreen() {
  const router = useRouter();
  const { gameId } = useLocalSearchParams<{ gameId?: string | string[] }>();
  const currentGameId = useGameStore((state) => state.currentGameId);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const prompts = useGameStore((state) => state.prompts);
  const currentPromptIndex = useGameStore((state) => state.currentPromptIndex);
  const submitAnswer = useGameStore((state) => state.submitAnswer);
  const resolvedGameId = Array.isArray(gameId) ? gameId[0] : gameId;
  const tintColor = useThemeColor({}, 'tint');
  const actionButtonColor = useThemeColor({ light: '#4A90D9', dark: '#5FA8F5' }, 'tint');
  const cardColor = useThemeColor({ light: '#eef6fb', dark: '#1e3138' }, 'background');
  const secondaryText = useThemeColor({}, 'icon');
  const currentPrompt = prompts[currentPromptIndex];

  useEffect(() => {
    if (!resolvedGameId || !currentGameId || currentGameId !== resolvedGameId || prompts.length === 0) {
      router.replace('/');
      return;
    }

    if (gamePhase === 'intro') {
      useGameStore.setState({ gamePhase: 'playing' });
      return;
    }

    if (gamePhase === 'feedback') {
      router.replace(`/game/${resolvedGameId}/feedback` as Href);
      return;
    }

    if (gamePhase === 'complete' || gamePhase === 'idle') {
      router.replace('/');
    }
  }, [currentGameId, gamePhase, prompts.length, resolvedGameId, router]);

  if (!currentPrompt || gamePhase !== 'playing') {
    return <ThemedView style={styles.container} />;
  }

  const answerCount = currentPrompt.answer_options.length;
  const isTapObjectPrompt = currentPrompt.prompt_type === 'tap_object';
  const isTwoOptionLayout = answerCount <= 2;
  const isThreeOptionLayout = answerCount === 3;
  const resolvedSpokenText = resolveCopyTokens(currentPrompt.spoken_text, {
    childName: DEFAULT_CHILD_NAME,
    parentLabel: DEFAULT_PARENT_LABEL,
  });

  const handleAnswerPress = (answer: string) => {
    submitAnswer(answer);
    router.replace(`/game/${resolvedGameId}/feedback` as Href);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topRow}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={[styles.backText, { color: tintColor }]}>Back</ThemedText>
        </Pressable>
        <ThemedText style={[styles.promptCounter, { color: secondaryText }]}>
          Prompt {currentPromptIndex + 1} of {prompts.length}
        </ThemedText>
      </View>

      <View style={[styles.sceneCard, { backgroundColor: cardColor }]}>
        {renderScene(currentPrompt.game_id, currentPrompt.visual_scene_key, currentPrompt.correct_answer)}
        <ThemedText style={styles.spokenText}>{resolvedSpokenText}</ThemedText>
      </View>

      <View
        style={[
          styles.answersWrap,
          isTapObjectPrompt || isTwoOptionLayout
            ? styles.answersWrapRow
            : isThreeOptionLayout
              ? styles.answersWrapStack
              : styles.answersWrapGrid,
        ]}>
        {currentPrompt.answer_options.map((answer) => {
          const resolvedAnswerLabel = resolveCopyTokens(answer, {
            childName: DEFAULT_CHILD_NAME,
            parentLabel: DEFAULT_PARENT_LABEL,
          });

          if (isTapObjectPrompt) {
            return (
              <Pressable
                accessibilityRole="button"
                key={answer}
                onPress={() => handleAnswerPress(answer)}
                style={({ pressed }) => [
                  styles.personCard,
                  { backgroundColor: actionButtonColor, opacity: pressed ? 0.85 : 1 },
                ]}>
                <ThemedText style={styles.personCardEmoji}>{getPersonEmoji(resolvedAnswerLabel)}</ThemedText>
                <ThemedText style={styles.personCardLabel}>{resolvedAnswerLabel}</ThemedText>
              </Pressable>
            );
          }

          return (
            <Pressable
              accessibilityRole="button"
              key={answer}
              onPress={() => handleAnswerPress(answer)}
              style={({ pressed }) => [
                styles.answerButton,
                isTwoOptionLayout
                  ? styles.answerButtonRow
                  : isThreeOptionLayout
                    ? styles.answerButtonStack
                    : styles.answerButtonGrid,
                { backgroundColor: actionButtonColor, opacity: pressed ? 0.85 : 1 },
              ]}>
              <ThemedText style={styles.answerText}>{resolvedAnswerLabel}</ThemedText>
            </Pressable>
          );
        })}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  backText: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
  },
  promptCounter: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  sceneCard: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 24,
    marginBottom: 20,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  personEmoji: {
    fontSize: 54,
    lineHeight: 60,
  },
  personWithLabel: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  personLabel: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  objectEmoji: {
    fontSize: 64,
    lineHeight: 72,
  },
  questionEmoji: {
    fontSize: 56,
    lineHeight: 62,
  },
  whereSceneCanvas: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  wherePairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  whereAnchorEmoji: {
    fontSize: 104,
    lineHeight: 110,
  },
  wherePrimaryEmoji: {
    fontSize: 68,
    lineHeight: 74,
    position: 'absolute',
  },
  wherePrimaryEmojiInline: {
    fontSize: 68,
    lineHeight: 74,
  },
  wherePrimaryIn: {
    top: 52,
  },
  wherePrimaryOn: {
    top: 8,
  },
  wherePrimaryUnder: {
    top: 124,
  },
  sizeSceneRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    minHeight: 132,
    gap: 24,
  },
  sceneCircle: {
    borderRadius: 999,
  },
  spokenText: {
    marginTop: 18,
    textAlign: 'center',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
  },
  answersWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  answersWrapRow: {
    flexDirection: 'row',
    gap: 16,
  },
  answersWrapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  answersWrapStack: {
    flexDirection: 'column',
    gap: 12,
  },
  answerButton: {
    minHeight: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  answerButtonRow: {
    flex: 1,
  },
  answerButtonGrid: {
    width: '48%',
  },
  answerButtonStack: {
    width: '100%',
    minHeight: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerText: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: '#ffffff',
  },
  personCard: {
    flex: 1,
    minHeight: 140,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  personCardEmoji: {
    fontSize: 58,
    lineHeight: 66,
  },
  personCardLabel: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
});
