import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DEFAULT_CHILD_NAME, DEFAULT_PARENT_LABEL } from '@/data/constants';
import { resolveCopyTokens } from '@/data/content/mvp-v1';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGameStore } from '@/store/game-store';
import { PromptTemplate } from '@/types';

type SupportCardMode = 'hint' | 'break' | null;

function parseSceneTokens(sceneKey: string) {
  if (sceneKey.includes('|')) {
    return sceneKey.split('|').map((part) => part.trim()).filter(Boolean);
  }

  return Array.from(sceneKey.replace(/\uFE0F/g, ''));
}

function getWhereIsItScene(sceneKey: string) {
  const sceneParts = parseSceneTokens(sceneKey);

  return {
    left: sceneParts[0] ?? sceneKey,
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

function GenericEmojiScene({ sceneKey }: { sceneKey: string }) {
  const tokens = parseSceneTokens(sceneKey);

  return (
    <View style={styles.genericSceneRow}>
      {tokens.map((token, index) => (
        <View key={`${sceneKey}-${token}-${index}`} style={styles.genericSceneToken}>
          <ThemedText style={styles.genericSceneEmoji}>{token}</ThemedText>
        </View>
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

function renderScene(prompt: PromptTemplate) {
  if (prompt.game_id === 'my_turn_your_turn') {
    return (
      <View style={styles.emojiRow}>
        <View style={styles.personWithLabel}>
          <ThemedText style={styles.personEmoji}>🧒</ThemedText>
          <ThemedText style={styles.personLabel}>{DEFAULT_CHILD_NAME}</ThemedText>
        </View>
        <ThemedText style={styles.objectEmoji}>{parseSceneTokens(prompt.visual_scene_key)[0] ?? '🎯'}</ThemedText>
        <View style={styles.personWithLabel}>
          <ThemedText style={styles.personEmoji}>👨</ThemedText>
          <ThemedText style={styles.personLabel}>{DEFAULT_PARENT_LABEL}</ThemedText>
        </View>
      </View>
    );
  }

  if (prompt.game_id === 'where_is_it') {
    return <WhereIsItScene sceneKey={prompt.visual_scene_key} correctAnswer={prompt.correct_answer} />;
  }

  return <GenericEmojiScene sceneKey={prompt.visual_scene_key} />;
}

function buildSupportText(prompt: PromptTemplate) {
  if (prompt.model_phrase) {
    return prompt.model_phrase;
  }

  if (prompt.spoken_text.includes('___')) {
    return prompt.spoken_text.replace('___', prompt.correct_answer);
  }

  return `Try: ${prompt.correct_answer}`;
}

function buildPromptLabel(prompt: PromptTemplate) {
  if (prompt.prompt_type === 'build_sentence') {
    return 'Build the sentence';
  }

  if (prompt.prompt_type === 'follow_direction') {
    return 'Follow the direction';
  }

  if (prompt.prompt_type === 'repeat_and_use') {
    return 'Pick the helpful phrase';
  }

  if (prompt.prompt_type === 'picture_question') {
    return 'Answer the question';
  }

  if (prompt.prompt_type === 'movement_search') {
    return 'Move and find it';
  }

  return 'Choose the answer';
}

export default function GamePlayScreen() {
  const router = useRouter();
  const { gameId } = useLocalSearchParams<{ gameId?: string | string[] }>();
  const currentGameId = useGameStore((state) => state.currentGameId);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const prompts = useGameStore((state) => state.prompts);
  const currentPromptIndex = useGameStore((state) => state.currentPromptIndex);
  const submitAnswer = useGameStore((state) => state.submitAnswer);
  const markSupportAction = useGameStore((state) => state.markSupportAction);
  const markPromptReplay = useGameStore((state) => state.markPromptReplay);
  const resetPromptSupport = useGameStore((state) => state.resetPromptSupport);
  const resolvedGameId = Array.isArray(gameId) ? gameId[0] : gameId;
  const currentPrompt = prompts[currentPromptIndex];
  const [supportCardMode, setSupportCardMode] = useState<SupportCardMode>(null);
  const tintColor = useThemeColor({}, 'tint');
  const actionButtonColor = useThemeColor({ light: '#4A90D9', dark: '#5FA8F5' }, 'tint');
  const cardColor = useThemeColor({ light: '#eef6fb', dark: '#1e3138' }, 'background');
  const secondaryText = useThemeColor({}, 'icon');
  const mutedText = useThemeColor({ light: '#60707F', dark: '#B7C1C8' }, 'text');

  const resolvedSpokenText = useMemo(() => {
    if (!currentPrompt) {
      return '';
    }

    return resolveCopyTokens(currentPrompt.spoken_text, {
      childName: DEFAULT_CHILD_NAME,
      parentLabel: DEFAULT_PARENT_LABEL,
    });
  }, [currentPrompt]);

  const supportText = useMemo(() => {
    if (!currentPrompt) {
      return '';
    }

    return resolveCopyTokens(buildSupportText(currentPrompt), {
      childName: DEFAULT_CHILD_NAME,
      parentLabel: DEFAULT_PARENT_LABEL,
    });
  }, [currentPrompt]);

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

  useEffect(() => {
    if (!currentPrompt || gamePhase !== 'playing') {
      return;
    }

    setSupportCardMode(null);
    resetPromptSupport();
    Speech.stop();
    Speech.speak(resolvedSpokenText, {
      rate: 0.85,
      pitch: 1,
    });
  }, [currentPrompt?.prompt_id, gamePhase, resetPromptSupport, resolvedSpokenText, currentPrompt]);

  if (!currentPrompt || gamePhase !== 'playing') {
    return <ThemedView style={styles.container} />;
  }

  const answerCount = currentPrompt.answer_options.length;
  const isTapObjectPrompt = currentPrompt.prompt_type === 'tap_object';
  const isTwoOptionLayout = answerCount <= 2;
  const isThreeOptionLayout = answerCount === 3;
  const promptLabel = buildPromptLabel(currentPrompt);

  const replayPrompt = () => {
    markPromptReplay();
    Speech.stop();
    Speech.speak(resolvedSpokenText, {
      rate: 0.85,
      pitch: 1,
    });
  };

  const handleAnswerPress = (answer: string) => {
    const selectedTokens = currentPrompt.prompt_type === 'build_sentence' ? [answer] : undefined;
    submitAnswer(answer, selectedTokens);
    router.replace(`/game/${resolvedGameId}/feedback` as Href);
  };

  const dismissSupportCard = () => {
    markSupportAction('try_again');
    setSupportCardMode(null);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topRow}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={[styles.backText, { color: tintColor }]}>Back</ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Replay prompt"
          onPress={replayPrompt}
          style={({ pressed }) => [styles.replayButton, pressed && styles.replayButtonPressed]}>
          <ThemedText style={[styles.replayText, { color: tintColor }]}>Say it again</ThemedText>
        </Pressable>
      </View>

      <ThemedText style={[styles.promptCounter, { color: secondaryText }]}>
        Prompt {currentPromptIndex + 1} of {prompts.length}
      </ThemedText>

      <View style={[styles.sceneCard, { backgroundColor: cardColor }]}>
        <ThemedText style={[styles.promptLabel, { color: mutedText }]}>{promptLabel}</ThemedText>
        {renderScene(currentPrompt)}
        <ThemedText style={styles.spokenText}>{resolvedSpokenText}</ThemedText>
        {currentPrompt.prompt_type === 'build_sentence' ? (
          <View style={styles.frameBadge}>
            <ThemedText style={styles.frameBadgeText}>{resolvedSpokenText}</ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.supportRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            markSupportAction('help');
            setSupportCardMode('hint');
          }}
          style={({ pressed }) => [styles.supportButton, pressed && styles.supportButtonPressed]}>
          <ThemedText style={styles.supportButtonText}>Help</ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            markSupportAction('show_me_again');
            setSupportCardMode('hint');
            Speech.stop();
            Speech.speak(resolvedSpokenText, {
              rate: 0.85,
              pitch: 1,
            });
          }}
          style={({ pressed }) => [styles.supportButton, pressed && styles.supportButtonPressed]}>
          <ThemedText style={styles.supportButtonText}>Show me again</ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            markSupportAction('break');
            setSupportCardMode('break');
          }}
          style={({ pressed }) => [styles.supportButton, pressed && styles.supportButtonPressed]}>
          <ThemedText style={styles.supportButtonText}>Break</ThemedText>
        </Pressable>
      </View>

      {supportCardMode === 'hint' ? (
        <View style={styles.supportCard}>
          <ThemedText style={styles.supportCardTitle}>Try this</ThemedText>
          <ThemedText style={styles.supportCardText}>{supportText}</ThemedText>
          <Pressable
            accessibilityRole="button"
            onPress={dismissSupportCard}
            style={({ pressed }) => [styles.supportCardCta, pressed && styles.replayButtonPressed]}>
            <ThemedText style={styles.supportCardCtaText}>Try again</ThemedText>
          </Pressable>
        </View>
      ) : null}

      {supportCardMode === 'break' ? (
        <View style={styles.supportCard}>
          <ThemedText style={styles.supportCardTitle}>Movement break</ThemedText>
          <ThemedText style={styles.supportCardText}>
            Stretch, wiggle, or jump a few times. Tap when you are ready to come back.
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            onPress={() => setSupportCardMode(null)}
            style={({ pressed }) => [styles.supportCardCta, pressed && styles.replayButtonPressed]}>
            <ThemedText style={styles.supportCardCtaText}>I&apos;m ready</ThemedText>
          </Pressable>
        </View>
      ) : null}

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
    marginBottom: 8,
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
  replayButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  replayButtonPressed: {
    opacity: 0.7,
  },
  replayText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
  },
  promptCounter: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: 14,
  },
  sceneCard: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 14,
  },
  promptLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
    textAlign: 'center',
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
  },
  personEmoji: {
    fontSize: 52,
    lineHeight: 58,
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
    fontSize: 62,
    lineHeight: 70,
  },
  genericSceneRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    minHeight: 104,
  },
  genericSceneToken: {
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genericSceneEmoji: {
    fontSize: 52,
    lineHeight: 58,
  },
  spokenText: {
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 8,
  },
  frameBadge: {
    marginTop: 12,
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.65)',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  frameBadgeText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600',
  },
  supportRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  supportButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C9D3DD',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
  },
  supportButtonPressed: {
    opacity: 0.75,
  },
  supportButtonText: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
    textAlign: 'center',
  },
  supportCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E1EA',
    backgroundColor: '#F7FBFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 14,
    gap: 10,
  },
  supportCardTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
  supportCardText: {
    fontSize: 17,
    lineHeight: 23,
  },
  supportCardCta: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#4A90D9',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  supportCardCtaText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  answersWrap: {
    flex: 1,
    gap: 12,
  },
  answersWrapRow: {
    flexDirection: 'row',
  },
  answersWrapStack: {
    flexDirection: 'column',
  },
  answersWrapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  answerButton: {
    minHeight: 86,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  answerButtonRow: {
    flex: 1,
  },
  answerButtonStack: {
    width: '100%',
  },
  answerButtonGrid: {
    width: '48%',
  },
  answerText: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  personCard: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 132,
  },
  personCardEmoji: {
    fontSize: 54,
    lineHeight: 60,
  },
  personCardLabel: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  whereSceneCanvas: {
    minHeight: 136,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  whereAnchorEmoji: {
    fontSize: 84,
    lineHeight: 92,
  },
  wherePrimaryEmoji: {
    fontSize: 60,
    lineHeight: 66,
    position: 'absolute',
  },
  wherePrimaryIn: {
    top: 38,
  },
  wherePrimaryOn: {
    top: -2,
  },
  wherePrimaryUnder: {
    top: 88,
  },
  wherePairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  wherePrimaryEmojiInline: {
    fontSize: 68,
    lineHeight: 74,
  },
});
