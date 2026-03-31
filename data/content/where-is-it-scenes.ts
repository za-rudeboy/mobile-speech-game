import { resolveCopyTokens } from '@/data/content/mvp-v1';
import { PromptTemplate } from '@/types';

type WhereRelation = 'in' | 'on' | 'under' | 'next to';

interface SceneToken {
  emoji: string;
  label: string;
}

interface SceneRecipe {
  subjects: SceneToken[];
  anchors: SceneToken[];
  distractors: SceneToken[];
}

export interface ResolvedWhereIsItScene {
  relation: WhereRelation;
  subject: SceneToken;
  anchor: SceneToken;
  distractors: SceneToken[];
  recipeKey: string;
}

const SHARED_DISTRACTORS: SceneToken[] = [
  { emoji: '⭐', label: 'star' },
  { emoji: '🌼', label: 'flower' },
  { emoji: '☁️', label: 'cloud' },
  { emoji: '🪴', label: 'plant' },
];

const WHERE_IS_IT_SCENE_RECIPES: Record<string, SceneRecipe> = {
  container: {
    subjects: [
      { emoji: '⚽', label: 'ball' },
      { emoji: '🚗', label: 'car' },
      { emoji: '🧸', label: 'teddy' },
      { emoji: '🍎', label: 'apple' },
      { emoji: '📘', label: 'book' },
    ],
    anchors: [
      { emoji: '📦', label: 'box' },
      { emoji: '🧺', label: 'basket' },
      { emoji: '🪣', label: 'bucket' },
    ],
    distractors: [
      { emoji: '🧱', label: 'block' },
      { emoji: '🥤', label: 'cup' },
      { emoji: '🪑', label: 'chair' },
    ],
  },
  surface: {
    subjects: [
      { emoji: '🥤', label: 'cup' },
      { emoji: '📘', label: 'book' },
      { emoji: '🍎', label: 'apple' },
      { emoji: '🥄', label: 'spoon' },
      { emoji: '⚽', label: 'ball' },
    ],
    anchors: [
      { emoji: '🪑', label: 'chair' },
      { emoji: '🛋️', label: 'couch' },
      { emoji: '🛏️', label: 'bed' },
      { emoji: '🧱', label: 'block' },
    ],
    distractors: [
      { emoji: '📦', label: 'box' },
      { emoji: '🧸', label: 'teddy' },
      { emoji: '🚗', label: 'car' },
    ],
  },
  under: {
    subjects: [
      { emoji: '🧸', label: 'teddy' },
      { emoji: '🚗', label: 'car' },
      { emoji: '⚽', label: 'ball' },
      { emoji: '🥤', label: 'cup' },
      { emoji: '📘', label: 'book' },
    ],
    anchors: [
      { emoji: '🪑', label: 'chair' },
      { emoji: '🛏️', label: 'bed' },
      { emoji: '🛋️', label: 'couch' },
      { emoji: '🪵', label: 'table' },
    ],
    distractors: [
      { emoji: '🧱', label: 'block' },
      { emoji: '📦', label: 'box' },
      { emoji: '🍎', label: 'apple' },
    ],
  },
  adjacent: {
    subjects: [
      { emoji: '🚗', label: 'car' },
      { emoji: '🥤', label: 'cup' },
      { emoji: '🧸', label: 'teddy' },
      { emoji: '⚽', label: 'ball' },
      { emoji: '📘', label: 'book' },
    ],
    anchors: [
      { emoji: '🧱', label: 'block' },
      { emoji: '📦', label: 'box' },
      { emoji: '🪑', label: 'chair' },
      { emoji: '🛋️', label: 'couch' },
    ],
    distractors: [
      { emoji: '🪴', label: 'plant' },
      { emoji: '🌳', label: 'tree' },
      { emoji: '🧺', label: 'basket' },
    ],
  },
};

function isWhereRelation(value: string): value is WhereRelation {
  return value === 'in' || value === 'on' || value === 'under' || value === 'next to';
}

function getRecipeKeyForRelation(relation: WhereRelation) {
  if (relation === 'in') {
    return 'container';
  }

  if (relation === 'on') {
    return 'surface';
  }

  if (relation === 'under') {
    return 'under';
  }

  return 'adjacent';
}

function createSeed(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRandom(seed: string) {
  let state = createSeed(seed) || 0x9e3779b9;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let next = Math.imul(state ^ (state >>> 15), 1 | state);
    next ^= next + Math.imul(next ^ (next >>> 7), 61 | next);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function pickOne<T>(items: T[], random: () => number) {
  return items[Math.floor(random() * items.length)];
}

function pickManyUnique(items: SceneToken[], count: number, random: () => number, excludeLabels: string[]) {
  const pool = items.filter((item) => !excludeLabels.includes(item.label));
  const selected: SceneToken[] = [];

  while (pool.length > 0 && selected.length < count) {
    const index = Math.floor(random() * pool.length);
    selected.push(pool[index]);
    pool.splice(index, 1);
  }

  return selected;
}

function getDistractorCount(difficultyLevel: PromptTemplate['difficulty_level'], random: () => number) {
  if (difficultyLevel === 1) {
    return 0;
  }

  if (difficultyLevel === 2) {
    return random() > 0.55 ? 1 : 0;
  }

  if (difficultyLevel === 3) {
    return 1;
  }

  return random() > 0.45 ? 2 : 1;
}

export function resolveWhereIsItScene(
  prompt: PromptTemplate,
  sessionId: string,
  promptIndex: number
): ResolvedWhereIsItScene | null {
  if (prompt.game_id !== 'where_is_it' || !isWhereRelation(prompt.correct_answer)) {
    return null;
  }

  const recipeKey = prompt.scene_recipe_key ?? getRecipeKeyForRelation(prompt.correct_answer);
  const recipe = WHERE_IS_IT_SCENE_RECIPES[recipeKey];

  if (!recipe) {
    return null;
  }

  const random = createRandom(`${sessionId}:${prompt.prompt_id}:${promptIndex}:${recipeKey}`);
  const subject = pickOne(recipe.subjects, random);
  const anchor = pickOne(
    recipe.anchors.filter((candidate) => candidate.label !== subject.label),
    random
  );
  const distractorCount = getDistractorCount(prompt.difficulty_level, random);
  const distractors = pickManyUnique(
    [...recipe.distractors, ...SHARED_DISTRACTORS],
    distractorCount,
    random,
    [subject.label, anchor.label]
  );

  return {
    relation: prompt.correct_answer,
    subject,
    anchor,
    distractors,
    recipeKey,
  };
}

export function resolvePromptSceneTokens(
  text: string,
  scene: ResolvedWhereIsItScene | null,
  { childName, parentLabel }: { childName: string; parentLabel: string }
) {
  return resolveCopyTokens(text, {
    childName,
    parentLabel,
    subjectLabel: scene?.subject.label,
    anchorLabel: scene?.anchor.label,
  });
}
