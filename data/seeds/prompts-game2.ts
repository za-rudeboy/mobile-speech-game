import { PromptTemplate } from '@/types';

const WHERE_QUESTION = 'Where is the {subject_label}?';
const ANSWER_OPTIONS = ['in', 'on', 'under', 'next to'] as const;
const TARGET_IDS = ['target_in', 'target_on', 'target_under', 'target_next_to'];

type WhereRelation = (typeof ANSWER_OPTIONS)[number];
type SceneRecipeKey = 'container' | 'surface' | 'under' | 'adjacent';

const RELATION_TO_SCENE_KEY: Record<WhereRelation, SceneRecipeKey> = {
  in: 'container',
  on: 'surface',
  under: 'under',
  'next to': 'adjacent',
};

function createWherePrompt({
  promptId,
  difficultyLevel,
  correctAnswer,
}: {
  promptId: string;
  difficultyLevel: PromptTemplate['difficulty_level'];
  correctAnswer: WhereRelation;
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
    visual_scene_key: RELATION_TO_SCENE_KEY[correctAnswer],
    scene_recipe_key: RELATION_TO_SCENE_KEY[correctAnswer],
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
  return relations.map((correctAnswer, index) =>
    createWherePrompt({
      promptId: `prompt_g2_l${difficultyLevel}_${String(index + 1).padStart(2, '0')}`,
      difficultyLevel,
      correctAnswer,
    })
  );
}

export const SEED_PROMPTS_GAME2: PromptTemplate[] = [
  ...createLevelPrompts(1, ['in', 'on', 'under', 'next to', 'in', 'next to', 'on', 'under']),
  ...createLevelPrompts(2, ['under', 'next to', 'on', 'in', 'next to', 'under', 'in', 'on']),
  ...createLevelPrompts(3, ['next to', 'under', 'on', 'in', 'under', 'next to', 'on', 'in']),
  ...createLevelPrompts(4, ['next to', 'in', 'under', 'on', 'under', 'next to', 'in', 'on']),
];
