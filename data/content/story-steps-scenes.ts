import { ImageSourcePropType } from 'react-native';

import { PromptTemplate } from '@/types';

export interface StoryStepCard {
  accessibilityLabel: string;
  aspectRatio: number;
  id: string;
  imageSource: ImageSourcePropType;
  label: string;
}

interface StoryFrameCopy {
  frameText: string;
  helpText: string;
  modelPhrase: string;
  spokenText: string;
}

interface StorySceneDefinition {
  cards: StoryStepCard[];
  id: string;
  sequenceCopy: StoryFrameCopy;
  causeCopy?: StoryFrameCopy;
}

export interface ResolvedStoryStepsScene {
  cards: StoryStepCard[];
  id: string;
}

export interface ResolvedStoryStepsCopy {
  frameText: string;
  helpText: string;
  modelPhrase: string;
  spokenText: string;
}

const STORY_SCENES: StorySceneDefinition[] = [
  {
    id: 'brush_sleep',
    cards: [
      {
        id: 'brush_teeth',
        label: 'Brush teeth',
        imageSource: require('../../assets/images/conjunctions/01_boy_brushing_teeth.jpg'),
        aspectRatio: 1024 / 559,
        accessibilityLabel: 'Boy brushing his teeth in the bathroom',
      },
      {
        id: 'sleeping',
        label: 'Go to sleep',
        imageSource: require('../../assets/images/conjunctions/02_boy_sleeping.jpg'),
        aspectRatio: 1024 / 559,
        accessibilityLabel: 'Boy sleeping in bed at night',
      },
    ],
    sequenceCopy: {
      spokenText: 'What happened first?',
      frameText: 'First ... Then ...',
      helpText: 'First he brushed his teeth. Then he went to sleep.',
      modelPhrase: 'First he brushed his teeth. Then he went to sleep.',
    },
  },
  {
    id: 'wash_eat',
    cards: [
      {
        id: 'wash_hands',
        label: 'Wash hands',
        imageSource: require('../../assets/images/conjunctions/03_boy_washing_hands.jpg'),
        aspectRatio: 1024 / 559,
        accessibilityLabel: 'Boy washing his hands at the sink',
      },
      {
        id: 'eating',
        label: 'Eat food',
        imageSource: require('../../assets/images/conjunctions/04_boy_eating.jpg'),
        aspectRatio: 1024 / 559,
        accessibilityLabel: 'Boy eating food at the table',
      },
    ],
    sequenceCopy: {
      spokenText: 'What happened first?',
      frameText: 'First ... Then ...',
      helpText: 'First he washed his hands. Then he ate.',
      modelPhrase: 'First he washed his hands. Then he ate.',
    },
  },
  {
    id: 'ice_cream_drop',
    cards: [
      {
        id: 'happy_ice_cream',
        label: 'Happy with ice cream',
        imageSource: require('../../assets/images/conjunctions/06_happy_boy_with_ice_cream.jpg'),
        aspectRatio: 1024 / 559,
        accessibilityLabel: 'Boy smiling while holding an ice cream',
      },
      {
        id: 'dropped_ice_cream',
        label: 'Dropped ice cream',
        imageSource: require('../../assets/images/conjunctions/07_crying_boy_with_dropped_ice_cream.jpg'),
        aspectRatio: 1024 / 559,
        accessibilityLabel: 'Boy crying because the ice cream dropped on the ground',
      },
    ],
    sequenceCopy: {
      spokenText: 'What happened then?',
      frameText: 'First ... Then ...',
      helpText: 'First he had an ice cream. Then it dropped.',
      modelPhrase: 'First he had an ice cream. Then it dropped.',
    },
    causeCopy: {
      spokenText: 'Why is he crying?',
      frameText: 'He is sad because ...',
      helpText: 'He is crying because he dropped his ice cream.',
      modelPhrase: 'He is crying because he dropped his ice cream.',
    },
  },
];

function findSceneById(sceneId: string) {
  return STORY_SCENES.find((scene) => scene.id === sceneId);
}

export function resolveStoryStepsScene(prompt: PromptTemplate): ResolvedStoryStepsScene | null {
  if (prompt.game_id !== 'story_steps') {
    return null;
  }

  const scene = findSceneById(prompt.visual_scene_key);
  if (!scene) {
    return null;
  }

  return {
    id: scene.id,
    cards: scene.cards,
  };
}

export function resolveStoryStepsCopy(
  prompt: PromptTemplate,
  scene: ResolvedStoryStepsScene | null
): ResolvedStoryStepsCopy | null {
  if (prompt.game_id !== 'story_steps' || !scene) {
    return null;
  }

  const definition = findSceneById(scene.id);
  if (!definition) {
    return null;
  }

  const copy = prompt.prompt_type === 'story_cause' ? definition.causeCopy : definition.sequenceCopy;
  if (!copy) {
    return null;
  }

  const resolvedFrameText =
    prompt.prompt_type === 'story_cause'
      ? prompt.spoken_text.toLowerCase().includes('sad')
        ? 'He is sad because ...'
        : 'He is crying because ...'
      : copy.frameText;

  return {
    spokenText: prompt.spoken_text || copy.spokenText,
    frameText: resolvedFrameText,
    helpText: prompt.support_text || copy.helpText,
    modelPhrase: prompt.model_phrase || copy.modelPhrase,
  };
}
