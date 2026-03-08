import { create } from 'zustand';

import {
  getGameProgress,
  getPromptsForGameLevels,
  saveAttempts,
  saveSession,
  upsertGameProgress,
} from '@/db';
import { DEFAULT_SESSION_PROMPT_COUNT } from '@/data/constants';
import { GameId, GamePhase, PracticeSession, PromptAttempt, PromptTemplate } from '@/types';

interface GameState {
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
  startGame: (gameId: GameId) => Promise<boolean>;
  submitAnswer: (answer: string) => void;
  nextPrompt: () => void;
  endGame: () => void;
  resetGame: () => void;
}

const initialGameState = {
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
};

function shufflePrompts(prompts: PromptTemplate[]) {
  const shuffled = [...prompts];

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

export const useGameStore = create<GameState>((set, get) => ({
  ...initialGameState,

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
      const gameProgress = await getGameProgress('child_01', gameId);
      const currentLevel = gameProgress?.current_level ?? 1;
      const sessionCount = DEFAULT_SESSION_PROMPT_COUNT;
      let selectedPrompts: PromptTemplate[] = [];

      if (currentLevel === 1) {
        const levelOnePool = await getPromptsForGameLevels(gameId, [1], []);
        selectedPrompts = shufflePrompts(levelOnePool).slice(0, sessionCount);
      } else {
        const masteredLevels = Array.from({ length: currentLevel - 1 }, (_, index) => index + 1);
        const [masteredPool, newPool] = await Promise.all([
          getPromptsForGameLevels(gameId, masteredLevels, []),
          getPromptsForGameLevels(gameId, [currentLevel], []),
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

  submitAnswer: (answer) => {
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
      created_at: new Date().toISOString(),
    };

    set({
      sessionResults: [...state.sessionResults, promptAttempt],
      lastAnswerCorrect: wasCorrect,
      gamePhase: 'feedback',
    });
  },

  nextPrompt: () => {
    const state = get();
    const nextPromptIndex = state.currentPromptIndex + 1;

    if (nextPromptIndex < state.prompts.length) {
      set({
        currentPromptIndex: nextPromptIndex,
        gamePhase: 'playing',
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
    const correctCount = state.sessionResults.filter((attempt) => attempt.was_correct_for_prompt).length;
    const accuracy = totalCount > 0 ? correctCount / totalCount : 0;

    const lastFiveAttempts = state.sessionResults.slice(-5);
    const lastFiveCorrectCount = lastFiveAttempts.filter(
      (attempt) => attempt.was_correct_for_prompt
    ).length;
    const lastFiveAccuracy =
      lastFiveAttempts.length > 0 ? lastFiveCorrectCount / lastFiveAttempts.length : 0;

    let currentStreak = 0;
    let maxConsecutiveCorrect = 0;
    for (const attempt of state.sessionResults) {
      if (attempt.was_correct_for_prompt) {
        currentStreak += 1;
        maxConsecutiveCorrect = Math.max(maxConsecutiveCorrect, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    let levelEnded = state.currentLevel;
    if (maxConsecutiveCorrect >= 3 && accuracy >= 0.8) {
      levelEnded = Math.min(state.currentLevel + 1, 4);
    } else if (lastFiveAccuracy < 0.6) {
      levelEnded = Math.max(state.currentLevel - 1, 1);
    }

    const session: PracticeSession = {
      session_id: sessionId,
      child_id: 'child_01',
      game_id: state.currentGameId,
      level_started: state.currentLevel,
      level_ended: levelEnded,
      accuracy,
      started_at: state.sessionStartedAt,
      ended_at: new Date().toISOString(),
      prompt_count: totalCount,
    };

    const attempts = state.sessionResults.map((a) => ({
      ...a,
      session_id: sessionId,
    }));

    // Fire and forget — don't await in store action
    saveSession(session).catch(console.error);
    saveAttempts(attempts).catch(console.error);
    getGameProgress('child_01', state.currentGameId)
      .then((existingProgress) =>
        upsertGameProgress({
          child_id: 'child_01',
          game_id: state.currentGameId!,
          current_level: levelEnded,
          highest_level_unlocked: Math.max(levelEnded, existingProgress?.highest_level_unlocked ?? 1),
          last_session_accuracy: accuracy,
          updated_at: new Date().toISOString(),
        })
      )
      .catch(console.error);

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
      todayPromptCount: state.todayPromptCount + state.sessionResults.length,
    });
  },

  resetGame: () => {
    set(initialGameState);
  },
}));
