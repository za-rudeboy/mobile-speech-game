import { ImageSourcePropType } from 'react-native';

import { resolveCopyTokens } from '@/data/content/mvp-v1';
import { PromptTemplate } from '@/types';

type WhereRelation = 'in' | 'on' | 'under' | 'next to';

interface SceneToken {
  label: string;
}

interface WhereIsItImageScene {
  kind: 'image';
  id: string;
  relation: WhereRelation;
  subject: SceneToken;
  anchor: SceneToken;
  imageSource: ImageSourcePropType;
  aspectRatio: number;
}

export type ResolvedWhereIsItScene = WhereIsItImageScene;

const IMAGE_SCENES: WhereIsItImageScene[] = [
  {
    kind: 'image',
    id: 'car_in_box',
    relation: 'in',
    subject: { label: 'car' },
    anchor: { label: 'box' },
    imageSource: require('../../assets/images/where_is_it/car_in_box.png'),
    aspectRatio: 1408 / 768,
  },
  {
    kind: 'image',
    id: 'car_next_to_box',
    relation: 'next to',
    subject: { label: 'car' },
    anchor: { label: 'box' },
    imageSource: require('../../assets/images/where_is_it/car_next_to_box.png'),
    aspectRatio: 1408 / 768,
  },
  {
    kind: 'image',
    id: 'car_next_to_log',
    relation: 'next to',
    subject: { label: 'car' },
    anchor: { label: 'log' },
    imageSource: require('../../assets/images/where_is_it/car_next_to_log.png'),
    aspectRatio: 1408 / 768,
  },
  {
    kind: 'image',
    id: 'car_on_log',
    relation: 'on',
    subject: { label: 'car' },
    anchor: { label: 'log' },
    imageSource: require('../../assets/images/where_is_it/car_on_log.png'),
    aspectRatio: 1408 / 768,
  },
  {
    kind: 'image',
    id: 'car_under_box',
    relation: 'under',
    subject: { label: 'car' },
    anchor: { label: 'box' },
    imageSource: require('../../assets/images/where_is_it/car_under_box.png'),
    aspectRatio: 1408 / 768,
  },
  {
    kind: 'image',
    id: 'cup_next_to_chair',
    relation: 'next to',
    subject: { label: 'cup' },
    anchor: { label: 'chair' },
    imageSource: require('../../assets/images/where_is_it/cup_next_to_chair.png'),
    aspectRatio: 1408 / 768,
  },
  {
    kind: 'image',
    id: 'cup_on_chair',
    relation: 'on',
    subject: { label: 'cup' },
    anchor: { label: 'chair' },
    imageSource: require('../../assets/images/where_is_it/cup_on_chair.png'),
    aspectRatio: 1408 / 768,
  },
  {
    kind: 'image',
    id: 'cup_under_chair',
    relation: 'under',
    subject: { label: 'cup' },
    anchor: { label: 'chair' },
    imageSource: require('../../assets/images/where_is_it/cup_under_chair.png'),
    aspectRatio: 1408 / 768,
  },
  {
    kind: 'image',
    id: 'apple_in_house',
    relation: 'in',
    subject: { label: 'apple' },
    anchor: { label: 'house' },
    imageSource: require('../../assets/images/where_is_it/apple_in_house.png'),
    aspectRatio: 1407 / 768,
  },
  {
    kind: 'image',
    id: 'teddy_on_bed',
    relation: 'on',
    subject: { label: 'teddy' },
    anchor: { label: 'bed' },
    imageSource: require('../../assets/images/where_is_it/teddy_on_bed.png'),
    aspectRatio: 1408 / 768,
  },
  {
    kind: 'image',
    id: 'teddy_under_bed',
    relation: 'under',
    subject: { label: 'teddy' },
    anchor: { label: 'bed' },
    imageSource: require('../../assets/images/where_is_it/teddy_under_bed.jpg'),
    aspectRatio: 1170 / 1163,
  },
];

function isWhereRelation(value: string): value is WhereRelation {
  return value === 'in' || value === 'on' || value === 'under' || value === 'next to';
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

export function resolveWhereIsItScene(
  prompt: PromptTemplate,
  sessionId: string,
  promptIndex: number
): ResolvedWhereIsItScene | null {
  if (prompt.game_id !== 'where_is_it' || !isWhereRelation(prompt.correct_answer)) {
    return null;
  }

  const matchingScenes = IMAGE_SCENES.filter((scene) => scene.relation === prompt.correct_answer);

  if (matchingScenes.length === 0) {
    return null;
  }

  const random = createRandom(`${sessionId}:${prompt.prompt_id}:${promptIndex}:${prompt.correct_answer}`);
  return pickOne(matchingScenes, random);
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
