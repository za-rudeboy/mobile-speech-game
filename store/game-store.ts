import { create } from 'zustand';

import { getEnabledPromptsByGame, saveAttempts, saveSession } from '@/db';
import { PROMPTS_PER_SESSION } from '@/data/constants';
import { GameId, GamePhase, PracticeSession, PromptAttempt, PromptTemplate } from '@/types';

interface GameState {
  currentGameId: GameId | null;
  prompts: PromptTemplate[];
  currentPromptIndex: number;
  sessionResults: PromptAttempt[];
  gamePhase: GamePhase;
  lastAnswerCorrect: boolean | null;
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
  prompts: [],
  currentPromptIndex: 0,
  sessionResults: [],
  gamePhase: 'idle' as GamePhase,
  lastAnswerCorrect: null,
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
      sessionStartedAt: '',
    });

    try {
      const promptPool = await getEnabledPromptsByGame(gameId);
      const selectedPrompts = shufflePrompts(promptPool).slice(0, PROMPTS_PER_SESSION);

      if (selectedPrompts.length === 0) {
        set({
          ...initialGameState,
        });
        return false;
      }

      set({
        currentGameId: gameId,
        prompts: selectedPrompts,
        currentPromptIndex: 0,
        sessionResults: [],
        gamePhase: 'intro',
        lastAnswerCorrect: null,
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
    const attemptId = Date.now().toString();
    const promptAttempt: PromptAttempt = {
      attempt_id: attemptId,
      session_id: state.currentGameId,
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
    const sessionId = `session_${Date.now()}`;
    const session: PracticeSession = {
      session_id: sessionId,
      child_id: 'child_01',
      game_id: state.currentGameId!,
      started_at: state.sessionStartedAt,
      ended_at: new Date().toISOString(),
      prompt_count: state.sessionResults.length,
    };

    const attempts = state.sessionResults.map((a) => ({
      ...a,
      session_id: sessionId,
    }));

    // Fire and forget — don't await in store action
    saveSession(session).catch(console.error);
    saveAttempts(attempts).catch(console.error);

    set({
      currentGameId: null,
      prompts: [],
      currentPromptIndex: 0,
      sessionResults: [],
      gamePhase: 'idle',
      lastAnswerCorrect: null,
      sessionStartedAt: '',
      todayPromptCount: state.todayPromptCount + state.sessionResults.length,
    });
  },

  resetGame: () => {
    set(initialGameState);
  },
}));
