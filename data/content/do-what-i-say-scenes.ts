import { PromptTemplate } from '@/types';

export type DoWhatISaySceneKind = 'give' | 'put' | 'take';

export interface DoWhatISaySceneTarget {
  label: string;
  emoji: string;
  kind: 'person' | 'place';
}

export interface ResolvedDoWhatISayScene {
  recipeKey: string;
  kind: DoWhatISaySceneKind;
  item: {
    label: string;
    emoji: string;
  };
  startLabel: string;
  targets: DoWhatISaySceneTarget[];
  correctTargetLabel: string;
}

interface DoWhatISaySceneRecipe {
  kind: DoWhatISaySceneKind;
  item: {
    label: string;
    emoji: string;
  };
  startLabel: string;
  targets: DoWhatISaySceneTarget[];
}

const DO_WHAT_I_SAY_RECIPES: Record<string, DoWhatISaySceneRecipe> = {
  give_ball_family: {
    kind: 'give',
    item: { label: 'ball', emoji: '⚽' },
    startLabel: 'Drag from here',
    targets: [
      { label: 'Caelum', emoji: '🧒', kind: 'person' },
      { label: 'Dad', emoji: '👨', kind: 'person' },
      { label: 'Mom', emoji: '👩', kind: 'person' },
    ],
  },
  give_book_family: {
    kind: 'give',
    item: { label: 'book', emoji: '📘' },
    startLabel: 'Drag from here',
    targets: [
      { label: 'Caelum', emoji: '🧒', kind: 'person' },
      { label: 'Dad', emoji: '👨', kind: 'person' },
      { label: 'Mom', emoji: '👩', kind: 'person' },
    ],
  },
  give_teddy_family: {
    kind: 'give',
    item: { label: 'teddy', emoji: '🧸' },
    startLabel: 'Drag from here',
    targets: [
      { label: 'Caelum', emoji: '🧒', kind: 'person' },
      { label: 'Dad', emoji: '👨', kind: 'person' },
      { label: 'Mom', emoji: '👩', kind: 'person' },
    ],
  },
  put_apple_places: {
    kind: 'put',
    item: { label: 'apple', emoji: '🍎' },
    startLabel: 'Move it',
    targets: [
      { label: 'Box', emoji: '📦', kind: 'place' },
      { label: 'Basket', emoji: '🧺', kind: 'place' },
      { label: 'Chair', emoji: '🪑', kind: 'place' },
    ],
  },
  put_cup_places: {
    kind: 'put',
    item: { label: 'cup', emoji: '🥤' },
    startLabel: 'Move it',
    targets: [
      { label: 'Table', emoji: '🪵', kind: 'place' },
      { label: 'Bed', emoji: '🛏️', kind: 'place' },
      { label: 'Chair', emoji: '🪑', kind: 'place' },
    ],
  },
  take_hat_places: {
    kind: 'take',
    item: { label: 'hat', emoji: '🎩' },
    startLabel: 'Take it',
    targets: [
      { label: 'Bed', emoji: '🛏️', kind: 'place' },
      { label: 'Box', emoji: '📦', kind: 'place' },
      { label: 'Chair', emoji: '🪑', kind: 'place' },
    ],
  },
};

export function resolveDoWhatISayScene(
  prompt: PromptTemplate
): ResolvedDoWhatISayScene | null {
  if (prompt.game_id !== 'do_what_i_say' || prompt.prompt_type !== 'drag_to_place') {
    return null;
  }

  const recipeKey = prompt.interaction_recipe_key;
  if (!recipeKey) {
    return null;
  }

  const recipe = DO_WHAT_I_SAY_RECIPES[recipeKey];
  if (!recipe) {
    return null;
  }

  return {
    recipeKey,
    kind: recipe.kind,
    item: recipe.item,
    startLabel: recipe.startLabel,
    targets: recipe.targets,
    correctTargetLabel: prompt.correct_answer,
  };
}
