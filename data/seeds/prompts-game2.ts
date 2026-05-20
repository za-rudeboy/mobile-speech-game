import { PromptTemplate } from '@/types';

const WHERE_QUESTION = 'Where is the {subject_label}?';
const ANSWER_OPTIONS = ['in', 'on', 'under', 'next to'] as const;
const TARGET_IDS = ['target_in', 'target_on', 'target_under', 'target_next_to'];

type WhereRelation = (typeof ANSWER_OPTIONS)[number];
type AuthoredWhereSceneKey =
  | 'car_in_box'
  | 'cup_on_chair'
  | 'car_under_box'
  | 'car_next_to_box'
  | 'apple_in_house'
  | 'car_on_log'
  | 'cup_under_chair'
  | 'car_next_to_log'
  | 'teddy_on_bed'
  | 'teddy_under_bed';

const RELATION_TO_SCENE_KEYS: Record<WhereRelation, AuthoredWhereSceneKey[]> = {
  in: ['car_in_box', 'apple_in_house'],
  on: ['cup_on_chair', 'car_on_log', 'teddy_on_bed'],
  under: ['car_under_box', 'cup_under_chair', 'teddy_under_bed'],
  'next to': ['car_next_to_box', 'car_next_to_log'],
};

function createWherePrompt({
  promptId,
  difficultyLevel,
  correctAnswer,
  sceneKey,
}: {
  promptId: string;
  difficultyLevel: PromptTemplate['difficulty_level'];
  correctAnswer: WhereRelation;
  sceneKey: AuthoredWhereSceneKey;
}): PromptTemplate {
  return {
    prompt_id: promptId,
    game_id: 'where_is_it',
    target_ids: [...TARGET_IDS],
    prompt_type: 'choose_between_four',
    difficulty_level: difficultyLevel,
    prompt_group: 'where',
    feedback_key: `where_${correctAnswer.replace(' ', '_')}`,
    spoken_text: WHERE_QUESTION,
    support_text: `The {subject_label} is ${correctAnswer} the {anchor_label}.`,
    visual_scene_key: sceneKey,
    scene_recipe_key: sceneKey,
    answer_options: [...ANSWER_OPTIONS],
    correct_answer: correctAnswer,
    model_phrase: `The {subject_label} is ${correctAnswer} the {anchor_label}.`,
    enabled: true,
  };
}

function createLevelPrompts(
  difficultyLevel: PromptTemplate['difficulty_level'],
  relations: WhereRelation[]
) {
  const relationSceneCounts = new Map<WhereRelation, number>();

  return relations.map((correctAnswer, index) => {
    const sceneKeys = RELATION_TO_SCENE_KEYS[correctAnswer];
    const sceneIndex = relationSceneCounts.get(correctAnswer) ?? 0;
    relationSceneCounts.set(correctAnswer, sceneIndex + 1);

    return createWherePrompt({
      promptId: `prompt_g2_l${difficultyLevel}_${String(index + 1).padStart(2, '0')}`,
      difficultyLevel,
      correctAnswer,
      sceneKey: sceneKeys[sceneIndex % sceneKeys.length],
    });
  });
}

export const SEED_PROMPTS_GAME2: PromptTemplate[] = [
  ...createLevelPrompts(1, ['in', 'on', 'under', 'next to', 'in', 'next to', 'on', 'under']),
  ...createLevelPrompts(2, ['under', 'next to', 'on', 'in', 'next to', 'under', 'in', 'on']),
  ...createLevelPrompts(3, ['next to', 'under', 'on', 'in', 'under', 'next to', 'on', 'in']),
  ...createLevelPrompts(4, ['next to', 'in', 'under', 'on', 'under', 'next to', 'in', 'on']),
];
