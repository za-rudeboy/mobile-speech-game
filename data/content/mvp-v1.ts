export const MVP_V1_COPY_SCHEMA_VERSION = '1.0.0';

export const MVP_V1_TOKENS = {
  child_name: '{child_name}',
  parent_label: '{parent_label}',
  subject_label: '{subject_label}',
  anchor_label: '{anchor_label}',
} as const;

export const MVP_V1_UI_GLOBAL = {
  start: 'Start',
  try_again: 'Try again',
  nice_work: 'Nice work',
  do_another: "Let's do another one",
} as const;

export const MVP_V1_UI_CONFIRM = {
  title: "I'm not sure. Did you mean...",
  option_a: '{candidate_1}',
  option_b: '{candidate_2}',
  cta: 'Try again',
} as const;

export const MVP_V1_ANSWER_LABELS = {
  my_turn: {
    value: 'my turn',
    label: 'My turn',
  },
  dads_turn: {
    value: 'your turn',
    label: "Dad's turn",
  },
  mine: {
    value: 'mine',
    label: 'Mine',
  },
  dads: {
    value: 'yours',
    label: "Dad's",
  },
  in: {
    value: 'in',
    label: 'In',
  },
  on: {
    value: 'on',
    label: 'On',
  },
  under: {
    value: 'under',
    label: 'Under',
  },
  next_to: {
    value: 'next to',
    label: 'Next to',
  },
} as const;

export const MVP_V1_GAME_COPY = {
  my_turn_your_turn: {
    prompts: {
      turn_whose: 'Whose turn is it?',
      turn_choice: "My turn or {parent_label}'s turn?",
      ownership_whose: 'Whose ball is this?',
      ownership_choice: "Mine or {parent_label}'s?",
      action_give_parent: 'Give the ball to {parent_label}.',
      action_give_child: 'Give the ball to {child_name}.',
    },
    feedback: {
      turn_my_turn: 'Yes, it is your turn.',
      turn_parent_turn: "Yes, it is {parent_label}'s turn.",
      ownership_mine: 'Yes, it is yours.',
      ownership_parent: "Yes, it is {parent_label}'s.",
    },
  },
  where_is_it: {
    prompts: {
      put_ball_in_box: 'Put the ball in the box.',
      put_cup_on_table: 'Put the cup on the table.',
      put_teddy_under_blanket: 'Put the teddy under the blanket.',
      put_car_next_to_block: 'Put the car next to the block.',
      where_is_car: 'Where is the car?',
      which_is_under_table: 'Which one is under the table?',
    },
    feedback: {
      car_in_box: 'The car is in the box.',
      cup_on_table: 'The cup is on the table.',
      teddy_under_blanket: 'The teddy is under the blanket.',
      car_next_to_block: 'The car is next to the block.',
    },
  },
  daily_phrase_practice: {
    prompts: {
      default: 'Say the helpful phrase.',
    },
    feedback: {
      want_banana: 'I want banana.',
      help_box: 'Help me.',
      all_done_puzzle: 'All done.',
      hand_hurts: 'My hand hurts.',
      want_water: 'I want water.',
      want_apple: 'I want apple.',
    },
  },
  do_what_i_say: {
    prompts: {
      default: 'Follow the direction.',
    },
    feedback: {
      put_in_box: 'Put the apple in the box.',
      give_dad: 'Give the ball to Dad.',
      take_hat: 'Take the hat to the bed.',
      show_car: 'Show me the car.',
      put_on_table: 'Put the cup on the table.',
      give_child: 'Give the book to Caelum.',
    },
  },
  build_the_sentence: {
    prompts: {
      default: 'Build the sentence.',
    },
    feedback: {
      sentence_want_banana: 'I want banana.',
      sentence_need_help: 'I need help.',
      sentence_hand_hurts: 'My hand hurts.',
      sentence_next_to_box: 'It is next to the box.',
      sentence_want_water: 'I want water.',
      sentence_knee_hurts: 'My knee hurts.',
    },
  },
  picture_questions: {
    prompts: {
      default: 'Answer the question.',
    },
    feedback: {
      what_banana: 'He is eating banana.',
      where_car: 'The car is in the box.',
      who_ball: 'Dad has the ball.',
      what_book: 'She is holding a book.',
      where_teddy: 'The teddy is under the blanket.',
      who_reads: 'Caelum is reading.',
    },
  },
  movement_search: {
    prompts: {
      default: 'Move and find it.',
    },
    feedback: {
      find_teddy: 'You found the teddy under the chair.',
      tap_apple: 'You tapped the apple next to the box.',
      stand_dad: 'You found Dad.',
      find_ball: 'You found the ball in the box.',
      tap_cup: 'You tapped the cup on the table.',
      find_car: 'You found the car under the chair.',
    },
  },
} as const;

export const MVP_V1_COPY = {
  schema_version: MVP_V1_COPY_SCHEMA_VERSION,
  tokens: MVP_V1_TOKENS,
  ui: {
    global: MVP_V1_UI_GLOBAL,
    confirm: MVP_V1_UI_CONFIRM,
  },
  answer_labels: MVP_V1_ANSWER_LABELS,
  games: MVP_V1_GAME_COPY,
} as const;

export function resolveCopyTokens(
  text: string,
  {
    childName,
    parentLabel,
    subjectLabel,
    anchorLabel,
  }: {
    childName: string;
    parentLabel: string;
    subjectLabel?: string;
    anchorLabel?: string;
  }
): string {
  return text
    .replaceAll(MVP_V1_TOKENS.child_name, childName)
    .replaceAll(MVP_V1_TOKENS.parent_label, parentLabel)
    .replaceAll(MVP_V1_TOKENS.subject_label, subjectLabel ?? MVP_V1_TOKENS.subject_label)
    .replaceAll(MVP_V1_TOKENS.anchor_label, anchorLabel ?? MVP_V1_TOKENS.anchor_label);
}
