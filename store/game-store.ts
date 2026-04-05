import { Platform } from 'react-native';
import { create } from 'zustand';

import {
  getEnabledTargetIdsByGame,
  getGameMaxLevel,
  getGameProgress,
  getPromptsForGameLevels,
  saveAttempts,
  saveSession,
  upsertGameProgress,
} from '@/db';
import { DEFAULT_SESSION_PROMPT_COUNT } from '@/data/constants';
import {
  GameId,
  GamePhase,
  PracticeSession,
  PromptAttempt,
  PromptTemplate,
  SupportAction,
} from '@/types';

interface PromptSupportState {
  lastAction: SupportAction | null;
  actionCount: number;
  visualSupportLevel: number;
  modelReplayCount: number;
  breakTaken: boolean;
  demoWasShown: boolean;
}

interface GameState {
  speechEnabled: boolean;
  settingsLoaded: boolean;
  currentGameId: GameId | null;
  activeSessionId: string;
  prompts: PromptTemplate[];
  currentPromptIndex: number;
  sessionResults: PromptAttempt[];
  gamePhase: GamePhase;
  lastAnswerCorrect: boolean | null;
  currentLevel: number;
  todayPromptCount: number;
  sessionStartedAt: string;
  promptSupport: PromptSupportState;
  loadAppSettings: () => Promise<void>;
  setSpeechEnabled: (nextValue: boolean) => Promise<void>;
  startGame: (gameId: GameId) => Promise<boolean>;
  submitAnswer: (
    answer: string,
    selectedTokens?: string[],
    attemptMetrics?: {
      incorrectAttemptCount?: number;
      independentSuccess?: boolean;
    }
  ) => void;
  markSupportAction: (action: SupportAction) => void;
  markPromptReplay: () => void;
  markPromptDemoShown: () => void;
  resetPromptSupport: () => void;
  nextPrompt: () => void;
  endGame: () => void;
  resetGame: () => void;
}

const initialPromptSupportState: PromptSupportState = {
  lastAction: null,
  actionCount: 0,
  visualSupportLevel: 0,
  modelReplayCount: 0,
  breakTaken: false,
  demoWasShown: false,
};

const initialGameState = {
  speechEnabled: true,
  settingsLoaded: false,
  currentGameId: null,
  activeSessionId: '',
  prompts: [],
  currentPromptIndex: 0,
  sessionResults: [],
  gamePhase: 'idle' as GamePhase,
  lastAnswerCorrect: null,
  currentLevel: 1,
  todayPromptCount: 0,
  sessionStartedAt: '',
  promptSupport: initialPromptSupportState,
};

const SPEECH_ENABLED_STORAGE_KEY = 'caelum:speech-enabled';

function readSpeechEnabledPreference(): boolean {
  if (Platform.OS !== 'web' || typeof globalThis.localStorage === 'undefined') {
    return true;
  }

  try {
    const storedValue = globalThis.localStorage.getItem(SPEECH_ENABLED_STORAGE_KEY);
    if (storedValue === null) {
      return true;
    }

    return storedValue === 'true';
  } catch {
    return true;
  }
}

function writeSpeechEnabledPreference(nextValue: boolean) {
  if (Platform.OS !== 'web' || typeof globalThis.localStorage === 'undefined') {
    return;
  }

  try {
    globalThis.localStorage.setItem(SPEECH_ENABLED_STORAGE_KEY, String(nextValue));
  } catch {
    // Ignore storage failures and keep the in-memory toggle state.
  }
}

function shufflePrompts(prompts: PromptTemplate[]) {
  const shuffled = [...prompts];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function shuffleArray<T>(items: T[]) {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function mergeWithoutAdjacentDuplicates(prompts: PromptTemplate[]) {
  if (prompts.length <= 1) {
    return prompts;
  }

  const reordered: PromptTemplate[] = [];

  for (const prompt of prompts) {
    const lastPrompt = reordered[reordered.length - 1];
    if (!lastPrompt || lastPrompt.prompt_id !== prompt.prompt_id) {
      reordered.push(prompt);
      continue;
    }

    const swapIndex = reordered.findIndex((candidate, index) => {
      const nextPrompt = reordered[index + 1];
      const isDifferentFromCurrent = candidate.prompt_id !== prompt.prompt_id;
      const isSafeWithNext = !nextPrompt || nextPrompt.prompt_id !== prompt.prompt_id;
      return isDifferentFromCurrent && isSafeWithNext;
    });

    if (swapIndex >= 0) {
      reordered.splice(swapIndex + 1, 0, prompt);
    } else {
      reordered.push(prompt);
    }
  }

  return reordered;
}

function selectSessionPrompts(
  masteredPool: PromptTemplate[],
  newPool: PromptTemplate[],
  sessionCount: number
) {
  const masteredTarget = 4;
  const newTarget = 2;

  const masteredSelected = masteredPool.slice(0, masteredTarget);
  const newSelected = newPool.slice(0, newTarget);

  let merged = [...masteredSelected, ...newSelected];

  if (masteredSelected.length < masteredTarget) {
    const deficit = masteredTarget - masteredSelected.length;
    const extraNew = newPool.slice(newSelected.length, newSelected.length + deficit);
    merged = [...merged, ...extraNew];
  }

  if (newSelected.length < newTarget) {
    const deficit = newTarget - newSelected.length;
    const extraMastered = masteredPool.slice(
      masteredSelected.length,
      masteredSelected.length + deficit
    );
    merged = [...merged, ...extraMastered];
  }

  const shuffledMerged = shufflePrompts(merged).slice(0, sessionCount);
  return mergeWithoutAdjacentDuplicates(shuffledMerged);
}

const WHERE_IS_IT_RELATIONS = ['in', 'on', 'under', 'next to'] as const;

function isWhereRelation(
  value: string
): value is (typeof WHERE_IS_IT_RELATIONS)[number] {
  return WHERE_IS_IT_RELATIONS.includes(
    value as (typeof WHERE_IS_IT_RELATIONS)[number]
  );
}

function mergeWithoutAdjacentRelationDuplicates(prompts: PromptTemplate[]) {
  if (prompts.length <= 1) {
    return prompts;
  }

  const remaining = [...prompts];
  const ordered: PromptTemplate[] = [];

  while (remaining.length > 0) {
    const lastRelation = ordered[ordered.length - 1]?.correct_answer;
    const nextIndex = remaining.findIndex((prompt) => prompt.correct_answer !== lastRelation);
    const resolvedIndex = nextIndex >= 0 ? nextIndex : 0;
    ordered.push(...remaining.splice(resolvedIndex, 1));
  }

  return ordered;
}

function selectBalancedWhereIsItPrompts(prompts: PromptTemplate[], sessionCount: number) {
  const relationPools = new Map<
    (typeof WHERE_IS_IT_RELATIONS)[number],
    PromptTemplate[]
  >();

  for (const relation of WHERE_IS_IT_RELATIONS) {
    relationPools.set(
      relation,
      shufflePrompts(prompts.filter((prompt) => prompt.correct_answer === relation))
    );
  }

  const availableRelations = WHERE_IS_IT_RELATIONS.filter((relation) => {
    const pool = relationPools.get(relation);
    return pool && pool.length > 0;
  });

  if (availableRelations.length === 0) {
    return [];
  }

  const selected: PromptTemplate[] = [];
  const counts = new Map<(typeof WHERE_IS_IT_RELATIONS)[number], number>();
  for (const relation of availableRelations) {
    counts.set(relation, 0);
  }

  while (selected.length < sessionCount) {
    const remainingRelations = availableRelations.filter((relation) => {
      const pool = relationPools.get(relation);
      return pool && pool.length > 0;
    });

    if (remainingRelations.length === 0) {
      break;
    }

    const lowestCount = Math.min(
      ...remainingRelations.map((relation) => counts.get(relation) ?? 0)
    );
    const candidateRelations = shuffleArray(
      remainingRelations.filter((relation) => (counts.get(relation) ?? 0) === lowestCount)
    );

    const preferredRelation = candidateRelations.find(
      (relation) => relation !== selected[selected.length - 1]?.correct_answer
    );
    const nextRelation = preferredRelation ?? candidateRelations[0];

    const pool = relationPools.get(nextRelation);
    const nextPrompt = pool?.shift();
    if (!nextPrompt) {
      continue;
    }

    selected.push(nextPrompt);
    counts.set(nextRelation, (counts.get(nextRelation) ?? 0) + 1);
  }

  if (selected.length < sessionCount) {
    const leftovers = shufflePrompts(
      prompts.filter((prompt) => !selected.some((item) => item.prompt_id === prompt.prompt_id))
    );
    selected.push(...leftovers.slice(0, sessionCount - selected.length));
  }

  return mergeWithoutAdjacentRelationDuplicates(selected.slice(0, sessionCount));
}

export const useGameStore = create<GameState>((set, get) => ({
  ...initialGameState,

  loadAppSettings: async () => {
    set({
      speechEnabled: readSpeechEnabledPreference(),
      settingsLoaded: true,
    });
  },

  setSpeechEnabled: async (nextValue) => {
    set({ speechEnabled: nextValue });
    writeSpeechEnabledPreference(nextValue);
  },

  startGame: async (gameId) => {
    set({
      currentGameId: gameId,
      prompts: [],
      currentPromptIndex: 0,
      sessionResults: [],
      gamePhase: 'idle',
      lastAnswerCorrect: null,
      currentLevel: 1,
      sessionStartedAt: '',
    });

    try {
      const [gameProgress, enabledTargetIds, maxLevel] = await Promise.all([
        getGameProgress('child_01', gameId),
        getEnabledTargetIdsByGame(gameId),
        getGameMaxLevel(gameId),
      ]);

      if (enabledTargetIds.length === 0) {
        set({
          ...initialGameState,
        });
        return false;
      }

      const currentLevel = Math.min(gameProgress?.current_level ?? 1, maxLevel);
      const sessionCount = DEFAULT_SESSION_PROMPT_COUNT;
      let selectedPrompts: PromptTemplate[] = [];

      if (gameId === 'where_is_it') {
        const allLevels = Array.from({ length: maxLevel }, (_, index) => index + 1);
        const wherePool = (await getPromptsForGameLevels(gameId, allLevels, enabledTargetIds)).filter(
          (prompt) => isWhereRelation(prompt.correct_answer)
        );
        selectedPrompts = selectBalancedWhereIsItPrompts(wherePool, sessionCount);
      } else if (currentLevel === 1) {
        const levelOnePool = await getPromptsForGameLevels(gameId, [1], enabledTargetIds);
        selectedPrompts = shufflePrompts(levelOnePool).slice(0, sessionCount);
      } else {
        const masteredLevels = Array.from({ length: currentLevel - 1 }, (_, index) => index + 1);
        const [masteredPool, newPool] = await Promise.all([
          getPromptsForGameLevels(gameId, masteredLevels, enabledTargetIds),
          getPromptsForGameLevels(gameId, [currentLevel], enabledTargetIds),
        ]);
        const shuffledMasteredPool = shufflePrompts(masteredPool);
        const shuffledNewPool = shufflePrompts(newPool);
        selectedPrompts = selectSessionPrompts(shuffledMasteredPool, shuffledNewPool, sessionCount);
      }

      if (selectedPrompts.length === 0) {
        set({
          ...initialGameState,
        });
        return false;
      }

      const newSessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
      set({
        currentGameId: gameId,
        activeSessionId: newSessionId,
        prompts: selectedPrompts,
        currentPromptIndex: 0,
        sessionResults: [],
        gamePhase: 'intro',
        lastAnswerCorrect: null,
        currentLevel,
        sessionStartedAt: new Date().toISOString(),
        promptSupport: initialPromptSupportState,
      });
      return true;
    } catch (error) {
      console.error('Failed to load enabled prompts for game start', error);
      set({
        ...initialGameState,
      });
      return false;
    }
  },

  submitAnswer: (answer, selectedTokens, attemptMetrics) => {
    const state = get();
    const currentPrompt = state.prompts[state.currentPromptIndex];

    if (!currentPrompt || !state.currentGameId) {
      return;
    }

    const wasCorrect = answer === currentPrompt.correct_answer;
    const attemptId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const promptAttempt: PromptAttempt = {
      attempt_id: attemptId,
      session_id: state.activeSessionId,
      prompt_id: currentPrompt.prompt_id,
      target_ids: currentPrompt.target_ids,
      input_mode: 'touch',
      final_interpreted_answer: answer,
      was_parent_corrected: false,
      was_correct_for_prompt: wasCorrect,
      support_action_used: state.promptSupport.lastAction ?? undefined,
      support_action_count: state.promptSupport.actionCount,
      visual_support_level: state.promptSupport.visualSupportLevel,
      model_replay_count: state.promptSupport.modelReplayCount,
      break_taken: state.promptSupport.breakTaken,
      demo_was_shown: state.promptSupport.demoWasShown,
      incorrect_attempt_count: attemptMetrics?.incorrectAttemptCount ?? 0,
      independent_success: attemptMetrics?.independentSuccess,
      selected_tokens_json: selectedTokens,
      created_at: new Date().toISOString(),
    };

    set({
      sessionResults: [...state.sessionResults, promptAttempt],
      lastAnswerCorrect: wasCorrect,
      gamePhase: 'feedback',
    });
  },

  markSupportAction: (action) => {
    const state = get();
    set({
      promptSupport: {
        lastAction: action,
        actionCount: state.promptSupport.actionCount + 1,
        visualSupportLevel:
          action === 'help' || action === 'show_me_again'
            ? state.promptSupport.visualSupportLevel + 1
            : state.promptSupport.visualSupportLevel,
        modelReplayCount:
          action === 'show_me_again'
            ? state.promptSupport.modelReplayCount + 1
            : state.promptSupport.modelReplayCount,
        breakTaken: action === 'break' ? true : state.promptSupport.breakTaken,
        demoWasShown: state.promptSupport.demoWasShown,
      },
    });
  },

  markPromptReplay: () => {
    const state = get();
    set({
      promptSupport: {
        ...state.promptSupport,
        modelReplayCount: state.promptSupport.modelReplayCount + 1,
      },
    });
  },

  markPromptDemoShown: () => {
    const state = get();
    set({
      promptSupport: {
        ...state.promptSupport,
        demoWasShown: true,
      },
    });
  },

  resetPromptSupport: () => {
    set({
      promptSupport: initialPromptSupportState,
    });
  },

  nextPrompt: () => {
    const state = get();
    const nextPromptIndex = state.currentPromptIndex + 1;

    if (nextPromptIndex < state.prompts.length) {
      set({
        currentPromptIndex: nextPromptIndex,
        gamePhase: 'playing',
        promptSupport: initialPromptSupportState,
      });
      return;
    }

    set({
      gamePhase: 'complete',
    });
  },

  endGame: () => {
    const state = get();

    if (!state.currentGameId) {
      set(initialGameState);
      return;
    }

    const sessionId = state.activeSessionId;
    const totalCount = state.sessionResults.length;
    const correctCount = state.sessionResults.filter((attempt) =>
      attempt.independent_success === undefined
        ? attempt.was_correct_for_prompt
        : attempt.independent_success
    ).length;
    const accuracy = totalCount > 0 ? correctCount / totalCount : 0;

    const lastFiveAttempts = state.sessionResults.slice(-5);
    const lastFiveCorrectCount = lastFiveAttempts.filter((attempt) =>
      attempt.independent_success === undefined
        ? attempt.was_correct_for_prompt
        : attempt.independent_success
    ).length;
    const lastFiveAccuracy =
      lastFiveAttempts.length > 0 ? lastFiveCorrectCount / lastFiveAttempts.length : 0;

    let currentStreak = 0;
    let maxConsecutiveCorrect = 0;
    for (const attempt of state.sessionResults) {
      const countedAsCorrect =
        attempt.independent_success === undefined
          ? attempt.was_correct_for_prompt
          : attempt.independent_success;

      if (countedAsCorrect) {
        currentStreak += 1;
        maxConsecutiveCorrect = Math.max(maxConsecutiveCorrect, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    let levelEnded = state.currentLevel;
    const maxLevelPromise = getGameMaxLevel(state.currentGameId);
    void maxLevelPromise.then((maxLevel) => {
      let resolvedLevelEnded = state.currentLevel;
      if (maxConsecutiveCorrect >= 3 && accuracy >= 0.8) {
        resolvedLevelEnded = Math.min(state.currentLevel + 1, maxLevel);
      } else if (lastFiveAccuracy < 0.6) {
        resolvedLevelEnded = Math.max(state.currentLevel - 1, 1);
      }

      const session: PracticeSession = {
        session_id: sessionId,
        child_id: 'child_01',
        game_id: state.currentGameId!,
        level_started: state.currentLevel,
        level_ended: resolvedLevelEnded,
        accuracy,
        started_at: state.sessionStartedAt,
        ended_at: new Date().toISOString(),
        prompt_count: totalCount,
      };

      const attempts = state.sessionResults.map((a) => ({
        ...a,
        session_id: sessionId,
      }));

      saveSession(session).catch(console.error);
      saveAttempts(attempts).catch(console.error);
      getGameProgress('child_01', state.currentGameId!)
        .then((existingProgress) =>
          upsertGameProgress({
            child_id: 'child_01',
            game_id: state.currentGameId!,
            current_level: resolvedLevelEnded,
            highest_level_unlocked: Math.max(
              resolvedLevelEnded,
              existingProgress?.highest_level_unlocked ?? 1
            ),
            last_session_accuracy: accuracy,
            updated_at: new Date().toISOString(),
          })
        )
        .catch(console.error);
    });

    set({
      currentGameId: null,
      activeSessionId: '',
      prompts: [],
      currentPromptIndex: 0,
      sessionResults: [],
      gamePhase: 'idle',
      lastAnswerCorrect: null,
      currentLevel: 1,
      sessionStartedAt: '',
      promptSupport: initialPromptSupportState,
      todayPromptCount: state.todayPromptCount + state.sessionResults.length,
    });
  },

  resetGame: () => {
    set(initialGameState);
  },
}));
