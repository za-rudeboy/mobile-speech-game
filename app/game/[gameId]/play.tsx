import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AudioReplayButton } from '@/components/audio-replay-button';
import { DoWhatISayScene } from '@/components/games/do-what-i-say-scene';
import { StoryStepsScene } from '@/components/games/story-steps-scene';
import { WhereIsItScene } from '@/components/games/where-is-it-scene';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PillButton, ProgressBar, SurfaceCard } from '@/components/ui/app-primitives';
import { childTheme } from '@/constants/semantic-theme';
import { resolveDoWhatISayScene } from '@/data/content/do-what-i-say-scenes';
import { resolveCopyTokens } from '@/data/content/mvp-v1';
import {
  ResolvedStoryStepsScene,
  resolveStoryStepsCopy,
  resolveStoryStepsScene,
} from '@/data/content/story-steps-scenes';
import { DEFAULT_CHILD_NAME, DEFAULT_PARENT_LABEL } from '@/data/constants';
import {
  ResolvedWhereIsItScene,
  resolveWhereIsItCopy,
  resolvePromptSceneTokens,
  resolveWhereIsItScene,
} from '@/data/content/where-is-it-scenes';
import { usePromptAudio } from '@/hooks/use-prompt-audio';
import { useGameStore } from '@/store/game-store';
import { PromptTemplate } from '@/types';

type SupportCardMode = 'hint' | 'break' | null;

const DAILY_PHRASE_AUDIO_BY_PROMPT_ID: Partial<Record<string, number>> = {
  prompt_daily_01: require('../../../assets/audio/006_caelum_wants_a_banana_what_does_he_say.mp3'),
  prompt_daily_02: require('../../../assets/audio/005_I_cant_opn_box_what_do_i_say.mp3'),
  prompt_daily_04: require('../../../assets/audio/008_caelum_hurt_hand_on_slide.mp3'),
  prompt_daily_05: require('../../../assets/audio/010_caelum_is_thirsty.mp3'),
  prompt_daily_07: require('../../../assets/audio/007_caelum_is_finished_washing.mp3'),
  prompt_daily_12: require('../../../assets/audio/008_caelum_hurt_hand_on_slide.mp3'),
};

function parseSceneTokens(sceneKey: string) {
  if (sceneKey.includes('|')) {
    return sceneKey.split('|').map((part) => part.trim()).filter(Boolean);
  }

  return Array.from(sceneKey.replace(/\uFE0F/g, ''));
}

function tokenizeSupportPhrase(text: string) {
  return text
    .replace(/[.!?]/g, '')
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
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

function PhraseStrip({ text }: { text: string }) {
  const tokens = tokenizeSupportPhrase(text);

  if (tokens.length < 2) {
    return null;
  }

  return (
    <View style={styles.phraseStrip}>
      {tokens.map((token, index) => (
        <View key={`${token}-${index}`} style={styles.phraseChip}>
          <ThemedText role="childLabel" style={styles.phraseChipText}>
            {token}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

function renderScene(
  prompt: PromptTemplate,
  whereScene: ResolvedWhereIsItScene | null,
  storyScene: ResolvedStoryStepsScene | null,
  storyHighlightCardId: string | null,
  onStorySelect: (cardId: string) => void,
  compact: boolean
) {
  if (prompt.game_id === 'my_turn_your_turn') {
    return (
      <View style={styles.emojiRow}>
        <View style={styles.personWithLabel}>
          <ThemedText style={styles.personEmoji}>🧒</ThemedText>
          <ThemedText role="childLabel" style={styles.personLabel}>
            {DEFAULT_CHILD_NAME}
          </ThemedText>
        </View>
        <ThemedText style={styles.objectEmoji}>{parseSceneTokens(prompt.visual_scene_key)[0] ?? '🎯'}</ThemedText>
        <View style={styles.personWithLabel}>
          <ThemedText style={styles.personEmoji}>👨</ThemedText>
          <ThemedText role="childLabel" style={styles.personLabel}>
            {DEFAULT_PARENT_LABEL}
          </ThemedText>
        </View>
      </View>
    );
  }

  if (prompt.game_id === 'where_is_it') {
    return <WhereIsItScene compact={compact} scene={whereScene} />;
  }

  if (prompt.game_id === 'story_steps') {
    return (
      <StoryStepsScene
        compact={compact}
        highlightedCardId={storyHighlightCardId}
        onSelect={onStorySelect}
        scene={storyScene}
      />
    );
  }

  return <GenericEmojiScene sceneKey={prompt.visual_scene_key} />;
}

function buildSupportText(prompt: PromptTemplate) {
  if (prompt.support_text) {
    return prompt.support_text;
  }

  if (prompt.model_phrase) {
    return prompt.model_phrase;
  }

  if (prompt.spoken_text.includes('___')) {
    return prompt.spoken_text.replace('___', prompt.correct_answer);
  }

  return `Try: ${prompt.correct_answer}`;
}

function buildPromptLabel(prompt: PromptTemplate) {
  if (prompt.game_id === 'do_what_i_say' && prompt.prompt_type === 'drag_to_place') {
    return 'Do what I say';
  }

  if (prompt.game_id === 'where_is_it') {
    return 'Where is it?';
  }

  if (prompt.game_id === 'story_steps') {
    return 'Story Steps';
  }

  if (prompt.prompt_type === 'build_sentence') {
    return 'Use the sentence strip';
  }

  if (prompt.prompt_type === 'follow_direction') {
    return 'Follow the direction';
  }

  if (prompt.prompt_type === 'repeat_and_use') {
    return 'What can Caelum say?';
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
  const activeSessionId = useGameStore((state) => state.activeSessionId);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const prompts = useGameStore((state) => state.prompts);
  const currentPromptIndex = useGameStore((state) => state.currentPromptIndex);
  const submitAnswer = useGameStore((state) => state.submitAnswer);
  const markSupportAction = useGameStore((state) => state.markSupportAction);
  const markPromptReplay = useGameStore((state) => state.markPromptReplay);
  const markPromptDemoShown = useGameStore((state) => state.markPromptDemoShown);
  const resetPromptSupport = useGameStore((state) => state.resetPromptSupport);
  const promptSupport = useGameStore((state) => state.promptSupport);
  const speechEnabled = useGameStore((state) => state.speechEnabled);
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const feedbackDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdFeedbackNavigationRef = useRef(false);
  const resolvedGameId = Array.isArray(gameId) ? gameId[0] : gameId;
  const currentPrompt = prompts[currentPromptIndex];
  const [supportCardMode, setSupportCardMode] = useState<SupportCardMode>(null);
  const [dragDemoNonce, setDragDemoNonce] = useState(0);
  const [dragIncorrectAttemptCount, setDragIncorrectAttemptCount] = useState(0);
  const [dragHighlightTargetLabel, setDragHighlightTargetLabel] = useState<string | null>(null);
  const [storyHighlightCardId, setStoryHighlightCardId] = useState<string | null>(null);
  const resolvedWhereScene = useMemo(() => {
    if (!currentPrompt) {
      return null;
    }

    return resolveWhereIsItScene(currentPrompt, activeSessionId, currentPromptIndex);
  }, [activeSessionId, currentPrompt, currentPromptIndex]);
  const resolvedWhereCopy = useMemo(() => {
    if (currentPrompt?.game_id !== 'where_is_it') {
      return null;
    }

    return resolveWhereIsItCopy(resolvedWhereScene);
  }, [currentPrompt?.game_id, resolvedWhereScene]);
  const resolvedStoryScene = useMemo(() => {
    if (!currentPrompt) {
      return null;
    }

    return resolveStoryStepsScene(currentPrompt);
  }, [currentPrompt]);
  const resolvedStoryCopy = useMemo(() => {
    if (!currentPrompt || currentPrompt.game_id !== 'story_steps') {
      return null;
    }

    return resolveStoryStepsCopy(currentPrompt, resolvedStoryScene);
  }, [currentPrompt, resolvedStoryScene]);
  const resolvedSpokenText = useMemo(() => {
    if (!currentPrompt) {
      return '';
    }

    if (resolvedStoryCopy) {
      return resolvedStoryCopy.spokenText;
    }

    if (resolvedWhereCopy) {
      return resolvedWhereCopy.spokenText;
    }

    return resolvePromptSceneTokens(currentPrompt.spoken_text, resolvedWhereScene, {
      childName: DEFAULT_CHILD_NAME,
      parentLabel: DEFAULT_PARENT_LABEL,
    });
  }, [currentPrompt, resolvedStoryCopy, resolvedWhereCopy, resolvedWhereScene]);
  const resolvedVisibleSupportText = useMemo(() => {
    if (!currentPrompt) {
      return '';
    }

    if (resolvedStoryCopy) {
      return resolvedStoryCopy.frameText;
    }

    if (resolvedWhereCopy) {
      return resolvedWhereCopy.supportText;
    }

    return resolvePromptSceneTokens(buildSupportText(currentPrompt), resolvedWhereScene, {
      childName: DEFAULT_CHILD_NAME,
      parentLabel: DEFAULT_PARENT_LABEL,
    });
  }, [currentPrompt, resolvedStoryCopy, resolvedWhereCopy, resolvedWhereScene]);
  const resolvedSupportSpeechText = useMemo(() => {
    if (!currentPrompt) {
      return '';
    }

    if (resolvedStoryCopy) {
      return resolvedStoryCopy.helpText;
    }

    if (resolvedWhereCopy) {
      return resolvedWhereCopy.supportText;
    }

    return resolvePromptSceneTokens(buildSupportText(currentPrompt), resolvedWhereScene, {
      childName: DEFAULT_CHILD_NAME,
      parentLabel: DEFAULT_PARENT_LABEL,
    });
  }, [currentPrompt, resolvedStoryCopy, resolvedWhereCopy, resolvedWhereScene]);
  const resolvedDoWhatISayScene = useMemo(() => {
    if (!currentPrompt) {
      return null;
    }

    return resolveDoWhatISayScene(currentPrompt);
  }, [currentPrompt]);
  const promptAudioSource = useMemo(() => {
    if (!currentPrompt || currentPrompt.game_id !== 'daily_phrase_practice') {
      return undefined;
    }

    return DAILY_PHRASE_AUDIO_BY_PROMPT_ID[currentPrompt.prompt_id];
  }, [currentPrompt]);
  const promptAudio = usePromptAudio({
    audioSource: promptAudioSource,
    autoPlay: true,
    fallbackText: resolvedSpokenText,
    enabled: speechEnabled,
  });
  const stopPromptAudioRef = useRef(promptAudio.stop);

  useEffect(() => {
    stopPromptAudioRef.current = promptAudio.stop;
  }, [promptAudio.stop]);

  const availableHeight = windowHeight - insets.top - insets.bottom;
  const isCompactLayout = availableHeight <= 780 || windowWidth <= 390;
  const isVeryCompactLayout = availableHeight <= 700;

  async function stopPromptPlayback() {
    await stopPromptAudioRef.current();
  }

  async function speakSupportText(text: string) {
    if (!speechEnabled) {
      await stopPromptPlayback();
      Speech.stop();
      return;
    }

    await stopPromptPlayback();
    Speech.stop();
    Speech.speak(text, {
      rate: 0.85,
      pitch: 1,
    });
  }

  useEffect(() => {
    if (!resolvedGameId || !currentGameId || currentGameId !== resolvedGameId || prompts.length === 0) {
      void stopPromptPlayback();
      router.replace('/');
      return;
    }

    if (gamePhase === 'intro') {
      useGameStore.setState({ gamePhase: 'playing' });
      return;
    }

    if (gamePhase === 'feedback') {
      if (holdFeedbackNavigationRef.current) {
        return;
      }

      void stopPromptPlayback();
      router.replace(`/game/${resolvedGameId}/feedback` as Href);
      return;
    }

    if (gamePhase === 'complete' || gamePhase === 'idle') {
      void stopPromptPlayback();
      router.replace('/');
    }
  }, [currentGameId, gamePhase, prompts.length, resolvedGameId, router]);

  useEffect(() => {
    return () => {
      if (feedbackDelayRef.current) {
        clearTimeout(feedbackDelayRef.current);
      }

      void stopPromptPlayback();
    };
  }, []);

  useEffect(() => {
    if (!currentPrompt || gamePhase !== 'playing') {
      return;
    }

    setSupportCardMode(null);
    setDragIncorrectAttemptCount(0);
    setDragHighlightTargetLabel(null);
    setStoryHighlightCardId(null);
    holdFeedbackNavigationRef.current = false;
    if (feedbackDelayRef.current) {
      clearTimeout(feedbackDelayRef.current);
      feedbackDelayRef.current = null;
    }
    resetPromptSupport();
  }, [currentPrompt?.prompt_id, gamePhase, resetPromptSupport, currentPrompt]);

  if (!currentPrompt || gamePhase !== 'playing') {
    return <ThemedView style={styles.screen} />;
  }

  const answerCount = currentPrompt.answer_options.length;
  const isTapObjectPrompt = currentPrompt.prompt_type === 'tap_object';
  const isDragToPlacePrompt = currentPrompt.prompt_type === 'drag_to_place';
  const isStoryPrompt = currentPrompt.game_id === 'story_steps';
  const isTwoOptionLayout = answerCount <= 2;
  const isThreeOptionLayout = answerCount === 3;
  const promptLabel = buildPromptLabel(currentPrompt);
  const showSupportFrame =
    currentPrompt.game_id === 'story_steps' ||
    currentPrompt.game_id === 'where_is_it' ||
    currentPrompt.game_id === 'daily_phrase_practice' ||
    currentPrompt.prompt_type === 'build_sentence';
  const showPhraseStrip =
    currentPrompt.game_id === 'daily_phrase_practice' ||
    currentPrompt.prompt_type === 'build_sentence';
  const showMeAgainDisabled = isDragToPlacePrompt && promptSupport.demoWasShown;

  const replayPrompt = () => {
    markPromptReplay();
    void promptAudio.play();
  };

  const navigateToFeedbackAfterDelay = () => {
    holdFeedbackNavigationRef.current = true;
    feedbackDelayRef.current = setTimeout(() => {
      holdFeedbackNavigationRef.current = false;
      feedbackDelayRef.current = null;
      void stopPromptPlayback();
      router.replace(`/game/${resolvedGameId}/feedback` as Href);
    }, 650);
  };

  const handleDragFailure = () => {
    setDragIncorrectAttemptCount((count) => count + 1);
    setDragHighlightTargetLabel(currentPrompt.correct_answer);
    setSupportCardMode('hint');
  };

  const handleStoryFailure = () => {
    setDragIncorrectAttemptCount((count) => count + 1);
    setStoryHighlightCardId(currentPrompt.correct_answer);
    setSupportCardMode('hint');
  };

  const handleAnswerPress = (answer: string) => {
    if (isStoryPrompt) {
      if (answer !== currentPrompt.correct_answer) {
        handleStoryFailure();
        return;
      }

      submitAnswer(answer, undefined, {
        incorrectAttemptCount: dragIncorrectAttemptCount,
        independentSuccess: dragIncorrectAttemptCount === 0,
      });
      void stopPromptPlayback();
      router.replace(`/game/${resolvedGameId}/feedback` as Href);
      return;
    }

    if (isDragToPlacePrompt) {
      if (answer !== currentPrompt.correct_answer) {
        handleDragFailure();
        return;
      }

      submitAnswer(answer, undefined, {
        incorrectAttemptCount: dragIncorrectAttemptCount,
        independentSuccess: dragIncorrectAttemptCount === 0,
      });
      navigateToFeedbackAfterDelay();
      return;
    }

    const selectedTokens = currentPrompt.prompt_type === 'build_sentence' ? [answer] : undefined;
    submitAnswer(answer, selectedTokens);
    void stopPromptPlayback();
    router.replace(`/game/${resolvedGameId}/feedback` as Href);
  };

  const handleDragResolved = ({
    targetLabel,
    wasCorrect,
  }: {
    targetLabel: string;
    wasCorrect: boolean;
  }) => {
    if (!wasCorrect) {
      handleDragFailure();
      return;
    }

    submitAnswer(targetLabel, undefined, {
      incorrectAttemptCount: dragIncorrectAttemptCount,
      independentSuccess: dragIncorrectAttemptCount === 0,
    });
    navigateToFeedbackAfterDelay();
  };

  const dismissSupportCard = () => {
    markSupportAction('try_again');
    setSupportCardMode(null);
    setDragHighlightTargetLabel(null);
    setStoryHighlightCardId(null);
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View
          style={[
            styles.container,
            isCompactLayout && styles.containerCompact,
            isVeryCompactLayout && styles.containerVeryCompact,
          ]}>
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void stopPromptPlayback();
              router.back();
            }}
            style={({ pressed }) => [
              styles.backButton,
              isCompactLayout && styles.backButtonCompact,
              pressed && styles.backButtonPressed,
            ]}>
            <ThemedText
              role="childLabel"
              style={[styles.backText, isCompactLayout && styles.backTextCompact]}>
              Back
            </ThemedText>
          </Pressable>
          <ThemedText
            role="childLabel"
            style={[styles.promptCounter, isCompactLayout && styles.promptCounterCompact]}>
            Prompt {currentPromptIndex + 1} of {prompts.length}
          </ThemedText>
        </View>

        <ProgressBar compact={isCompactLayout} current={currentPromptIndex + 1} total={prompts.length} />

        <AudioReplayButton
          accessibilityLabel="Replay prompt audio"
          compact={isCompactLayout}
          disabled={!promptAudio.isAvailable}
          isLoading={promptAudio.isLoading}
          isPlaying={promptAudio.isPlaying}
          label="Hear it again"
          onPress={replayPrompt}
        />

        <SurfaceCard
          style={[
            styles.sceneCard,
            isCompactLayout && styles.sceneCardCompact,
            isVeryCompactLayout && styles.sceneCardVeryCompact,
          ]}>
          <ThemedText role="childLabel" style={[styles.promptLabel, isCompactLayout && styles.promptLabelCompact]}>
            {promptLabel}
          </ThemedText>
          {isDragToPlacePrompt ? (
            <DoWhatISayScene
              compact={isCompactLayout}
              scene={resolvedDoWhatISayScene}
              demoNonce={dragDemoNonce}
              highlightTargetLabel={dragHighlightTargetLabel}
              onResolved={handleDragResolved}
            />
          ) : (
            renderScene(
              currentPrompt,
              resolvedWhereScene,
              resolvedStoryScene,
              storyHighlightCardId,
              handleAnswerPress,
              isCompactLayout
            )
          )}
          <ThemedText
            role="childTitle"
            style={[
              styles.spokenText,
              isCompactLayout && styles.spokenTextCompact,
              isVeryCompactLayout && styles.spokenTextVeryCompact,
            ]}>
            {resolvedSpokenText}
          </ThemedText>
          {showSupportFrame ? (
            <View
              style={[
                styles.frameBadge,
                isCompactLayout && styles.frameBadgeCompact,
                currentPrompt.game_id === 'where_is_it' && styles.whereSupportFrame,
              ]}>
              <ThemedText
                role="childBody"
                style={[styles.frameBadgeText, isCompactLayout && styles.frameBadgeTextCompact]}>
                {resolvedVisibleSupportText}
              </ThemedText>
            </View>
          ) : null}
          {showPhraseStrip ? <PhraseStrip text={resolvedSupportSpeechText} /> : null}
        </SurfaceCard>

        <View style={[styles.supportRow, isCompactLayout && styles.supportRowCompact]}>
          <PillButton
            accessibilityRole="button"
            compact={isCompactLayout}
            label="Help"
            labelStyle={isCompactLayout ? styles.supportButtonLabelCompact : undefined}
            onPress={() => {
              markSupportAction('help');
              setSupportCardMode('hint');
              if (isDragToPlacePrompt) {
                setDragHighlightTargetLabel(currentPrompt.correct_answer);
              }
              if (isStoryPrompt) {
                setStoryHighlightCardId(currentPrompt.correct_answer);
              }
              if (
                currentPrompt.game_id === 'story_steps' ||
                currentPrompt.game_id === 'where_is_it' ||
                currentPrompt.game_id === 'daily_phrase_practice' ||
                currentPrompt.prompt_type === 'build_sentence'
              ) {
                void speakSupportText(resolvedSupportSpeechText);
              }
            }}
            style={styles.supportButton}
            tone="secondary"
          />
          <PillButton
            accessibilityRole="button"
            compact={isCompactLayout}
            disabled={showMeAgainDisabled}
            label="Show me again"
            labelStyle={isCompactLayout ? styles.supportButtonLabelCompact : undefined}
            onPress={() => {
              if (showMeAgainDisabled) {
                return;
              }
              markSupportAction('show_me_again');
              setSupportCardMode(null);
              if (isDragToPlacePrompt) {
                setDragHighlightTargetLabel(currentPrompt.correct_answer);
                setDragDemoNonce((value) => value + 1);
                markPromptDemoShown();
              }
              void promptAudio.play();
            }}
            style={styles.supportButton}
            tone="secondary"
          />
          <PillButton
            accessibilityRole="button"
            compact={isCompactLayout}
            label="Break"
            labelStyle={isCompactLayout ? styles.supportButtonLabelCompact : undefined}
            onPress={() => {
              markSupportAction('break');
              setSupportCardMode('break');
            }}
            style={styles.supportButton}
            tone="secondary"
          />
        </View>

        {supportCardMode === 'hint' ? (
          <SurfaceCard style={[styles.supportCard, isCompactLayout && styles.supportCardCompact]}>
            <ThemedText role="childLabel">Let&apos;s do it together</ThemedText>
            <ThemedText role="childBody" style={[styles.supportCardText, isCompactLayout && styles.supportCardTextCompact]}>
              {resolvedSupportSpeechText}
            </ThemedText>
            <PillButton
              compact={isCompactLayout}
              label="Try again"
              onPress={dismissSupportCard}
              style={styles.supportCardButton}
            />
          </SurfaceCard>
        ) : null}

        {supportCardMode === 'break' ? (
          <SurfaceCard style={[styles.supportCard, isCompactLayout && styles.supportCardCompact]}>
            <ThemedText role="childLabel">Movement break</ThemedText>
            <ThemedText role="childBody" style={[styles.supportCardText, isCompactLayout && styles.supportCardTextCompact]}>
              Stretch, wiggle, or jump a few times. Tap when you are ready to come back.
            </ThemedText>
            <PillButton
              compact={isCompactLayout}
              label="I'm ready"
              onPress={() => setSupportCardMode(null)}
              style={styles.supportCardButton}
            />
          </SurfaceCard>
        ) : null}

        {isStoryPrompt ? null : (
          <View
            style={[
              styles.answersWrap,
              isCompactLayout && styles.answersWrapCompact,
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
                      isCompactLayout && styles.personCardCompact,
                      pressed && styles.answerPressed,
                    ]}>
                    <ThemedText style={[styles.personCardEmoji, isCompactLayout && styles.personCardEmojiCompact]}>
                      {getPersonEmoji(resolvedAnswerLabel)}
                    </ThemedText>
                    <ThemedText role="childButton" style={[styles.personCardLabel, isCompactLayout && styles.personCardLabelCompact]}>
                      {resolvedAnswerLabel}
                    </ThemedText>
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
                    isCompactLayout && styles.answerButtonCompact,
                    isTwoOptionLayout
                      ? styles.answerButtonRow
                      : isThreeOptionLayout
                        ? styles.answerButtonStack
                        : styles.answerButtonGrid,
                    pressed && styles.answerPressed,
                  ]}>
                  <ThemedText role="childButton" style={[styles.answerText, isCompactLayout && styles.answerTextCompact]}>
                    {resolvedAnswerLabel}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: childTheme.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: childTheme.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: childTheme.pagePadding,
    paddingTop: 20,
    paddingBottom: 28,
    gap: 14,
  },
  containerCompact: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 10,
  },
  containerVeryCompact: {
    paddingTop: 6,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  backButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: childTheme.radiusPill,
    backgroundColor: childTheme.surface,
    borderWidth: 1,
    borderColor: childTheme.outline,
  },
  backButtonCompact: {
    minHeight: 38,
    paddingHorizontal: 12,
  },
  backButtonPressed: {
    opacity: 0.75,
  },
  backText: {
    color: childTheme.textMuted,
  },
  backTextCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  promptCounter: {
    color: childTheme.textSoft,
  },
  promptCounterCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  sceneCard: {
    paddingHorizontal: 18,
    paddingVertical: 20,
    gap: 10,
    flexShrink: 1,
  },
  sceneCardCompact: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
  },
  sceneCardVeryCompact: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  promptLabel: {
    textAlign: 'center',
    textTransform: 'uppercase',
    color: childTheme.textSoft,
  },
  promptLabelCompact: {
    fontSize: 14,
    lineHeight: 18,
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
    textAlign: 'center',
    color: childTheme.textMuted,
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
    minHeight: 116,
  },
  genericSceneToken: {
    minWidth: 76,
    minHeight: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: childTheme.surfaceRaised,
  },
  genericSceneEmoji: {
    fontSize: 48,
    lineHeight: 54,
  },
  spokenText: {
    textAlign: 'center',
  },
  spokenTextCompact: {
    fontSize: 24,
    lineHeight: 30,
  },
  spokenTextVeryCompact: {
    fontSize: 22,
    lineHeight: 28,
  },
  frameBadge: {
    marginTop: 6,
    alignSelf: 'center',
    borderRadius: childTheme.radiusMd,
    backgroundColor: childTheme.surfaceRaised,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  frameBadgeCompact: {
    marginTop: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  frameBadgeText: {
    textAlign: 'center',
    color: childTheme.textMuted,
  },
  frameBadgeTextCompact: {
    fontSize: 16,
    lineHeight: 22,
  },
  phraseStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  phraseChip: {
    borderRadius: childTheme.radiusPill,
    backgroundColor: childTheme.surfaceMuted,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  phraseChipText: {
    color: childTheme.text,
  },
  whereSupportFrame: {
    alignSelf: 'stretch',
  },
  supportRow: {
    flexDirection: 'row',
    gap: 10,
  },
  supportRowCompact: {
    gap: 8,
  },
  supportButton: {
    flex: 1,
    minHeight: 56,
    paddingHorizontal: 10,
  },
  supportButtonLabelCompact: {
    fontSize: 15,
    lineHeight: 18,
  },
  supportCard: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 10,
  },
  supportCardCompact: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
  },
  supportCardText: {
    color: childTheme.textMuted,
  },
  supportCardTextCompact: {
    fontSize: 16,
    lineHeight: 22,
  },
  supportCardButton: {
    alignSelf: 'flex-start',
    minWidth: 152,
  },
  answersWrap: {
    gap: 12,
  },
  answersWrapCompact: {
    gap: 8,
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
    minHeight: 78,
    borderRadius: childTheme.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: childTheme.primary,
  },
  answerButtonCompact: {
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  answerPressed: {
    opacity: 0.84,
    transform: [{ translateY: 1.5 }, { scale: 0.985 }],
  },
  answerText: {
    color: childTheme.onPrimary,
    textAlign: 'center',
  },
  answerTextCompact: {
    fontSize: 17,
    lineHeight: 20,
  },
  personCard: {
    flex: 1,
    borderRadius: childTheme.radiusMd,
    paddingHorizontal: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 116,
    backgroundColor: childTheme.primary,
  },
  personCardCompact: {
    minHeight: 96,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 6,
  },
  personCardEmoji: {
    fontSize: 44,
    lineHeight: 50,
  },
  personCardEmojiCompact: {
    fontSize: 36,
    lineHeight: 40,
  },
  personCardLabel: {
    color: childTheme.onPrimary,
    textAlign: 'center',
  },
  personCardLabelCompact: {
    fontSize: 18,
    lineHeight: 22,
  },
});
