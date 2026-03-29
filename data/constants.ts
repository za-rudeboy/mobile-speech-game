export const GAME_IDS = {
  MY_TURN_YOUR_TURN: 'my_turn_your_turn' as const,
  WHERE_IS_IT: 'where_is_it' as const,
  DAILY_PHRASE_PRACTICE: 'daily_phrase_practice' as const,
  DO_WHAT_I_SAY: 'do_what_i_say' as const,
  BUILD_THE_SENTENCE: 'build_the_sentence' as const,
  PICTURE_QUESTIONS: 'picture_questions' as const,
  MOVEMENT_SEARCH: 'movement_search' as const,
};

export const HOME_GAME_ORDER = [
  GAME_IDS.WHERE_IS_IT,
  GAME_IDS.DAILY_PHRASE_PRACTICE,
  GAME_IDS.DO_WHAT_I_SAY,
  GAME_IDS.MY_TURN_YOUR_TURN,
  GAME_IDS.BUILD_THE_SENTENCE,
  GAME_IDS.PICTURE_QUESTIONS,
  GAME_IDS.MOVEMENT_SEARCH,
] as const;

export const PROMPTS_PER_SESSION = 4;

export const DEFAULT_CHILD_NAME = 'Caelum';
export const DEFAULT_PARENT_LABEL = 'Dad';
export const DEFAULT_SESSION_PROMPT_COUNT = 6;
export const MIN_SESSION_PROMPT_COUNT = 6;
export const MAX_SESSION_PROMPT_COUNT = 10;

export const GAME_META = {
  my_turn_your_turn: {
    title: 'My Turn / Your Turn',
    subtitle: 'Share toys, turns, and ownership',
    emoji: '🤝',
  },
  where_is_it: {
    title: 'Where Is It?',
    subtitle: 'in, on, under, next to',
    emoji: '🔍',
  },
  daily_phrase_practice: {
    title: 'Daily Phrase Practice',
    subtitle: 'help me, all done, I want',
    emoji: '🗣️',
  },
  do_what_i_say: {
    title: 'Do What I Say',
    subtitle: 'simple directions with visual support',
    emoji: '➡️',
  },
  build_the_sentence: {
    title: 'Build The Sentence',
    subtitle: 'simple sentence frames',
    emoji: '🧩',
  },
  picture_questions: {
    title: 'Picture Questions',
    subtitle: 'what, where, who',
    emoji: '❓',
  },
  movement_search: {
    title: 'Movement Search',
    subtitle: 'find, tap, move, and learn',
    emoji: '🏃',
  },
} as const;
