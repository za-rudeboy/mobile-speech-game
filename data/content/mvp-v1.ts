export const MVP_V1_COPY_SCHEMA_VERSION = '1.0.0';

export const MVP_V1_TOKENS = {
  child_name: '{child_name}',
  parent_label: '{parent_label}',
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
  big: {
    value: 'big',
    label: 'Big',
  },
  small: {
    value: 'small',
    label: 'Small',
  },
  bigger: {
    value: 'bigger',
    label: 'Bigger',
  },
  same: {
    value: 'same',
    label: 'Same',
  },
  different: {
    value: 'different',
    label: 'Different',
  },
  more: {
    value: 'more',
    label: 'More',
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
  which_is_bigger: {
    prompts: {
      show_big: 'Show me the big one.',
      show_small: 'Show me the small one.',
      which_bigger: 'Which one is bigger?',
      same_or_different: 'Are they the same or different?',
      which_has_more: 'Which one has more?',
    },
    feedback: {
      is_big: 'Yes, this one is big.',
      is_small: 'Yes, this one is small.',
      is_bigger: 'Yes, this one is bigger.',
      are_same: 'They are the same.',
      are_different: 'They are different.',
      has_more: 'This one has more.',
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
  { childName, parentLabel }: { childName: string; parentLabel: string }
): string {
  return text
    .replaceAll(MVP_V1_TOKENS.child_name, childName)
    .replaceAll(MVP_V1_TOKENS.parent_label, parentLabel);
}
