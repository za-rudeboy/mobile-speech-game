export const GAME_IDS = {
  MY_TURN_YOUR_TURN: 'my_turn_your_turn' as const,
  WHERE_IS_IT: 'where_is_it' as const,
  WHICH_IS_BIGGER: 'which_is_bigger' as const,
};

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
  which_is_bigger: {
    title: 'Which Is Bigger?',
    subtitle: 'big, small, same, different',
    emoji: '📏',
  },
} as const;
