// Game identifiers
export type GameId =
  | 'my_turn_your_turn'
  | 'where_is_it'
  | 'daily_phrase_practice'
  | 'do_what_i_say'
  | 'build_the_sentence'
  | 'picture_questions'
  | 'movement_search';
export type TargetCategory =
  | 'pronoun'
  | 'location'
  | 'functional_phrase'
  | 'direction'
  | 'sentence'
  | 'question';
export type TargetStatus = 'enabled' | 'later' | 'mastered';
export type InputMode = 'touch' | 'speech';
export type PromptType =
  | 'choose_between_two'
  | 'choose_between_four'
  | 'tap_object'
  | 'drag_to_place'
  | 'repeat_and_use'
  | 'follow_direction'
  | 'build_sentence'
  | 'picture_question'
  | 'movement_search';
export type GamePhase = 'idle' | 'intro' | 'playing' | 'feedback' | 'complete';
export type SupportAction = 'help' | 'show_me_again' | 'break' | 'try_again';

export interface ChildProfile {
  child_id: string;
  display_name: string;
  birth_year?: number;
  notes?: string;
  preferred_rewards?: string[];
  created_at: string;   // ISO 8601
  updated_at: string;   // ISO 8601
}

export interface TargetConcept {
  target_id: string;      // e.g. "target_my", "target_under"
  slug: string;           // e.g. "my", "under"
  label: string;          // display label e.g. "my", "under"
  category: TargetCategory;
  game_id: GameId;
  status: TargetStatus;
  difficulty_order: number;  // 1-20, controls introduction order
  created_at: string;
  updated_at: string;
}

export interface PromptTemplate {
  prompt_id: string;         // e.g. "prompt_turn_01"
  game_id: GameId;
  target_ids: string[];      // references TargetConcept.target_id
  prompt_type: PromptType;
  difficulty_level: 1 | 2 | 3 | 4;
  prompt_group: string;
  feedback_key: string;
  spoken_text: string;       // e.g. "Whose turn?"
  visual_scene_key: string;  // emoji or asset key e.g. "🏀"
  answer_options: string[];  // e.g. ["my turn", "your turn"]
  correct_answer: string;    // must be one of answer_options
  model_phrase?: string;
  enabled: boolean;
}

export interface PracticeSession {
  session_id: string;
  child_id: string;
  game_id: GameId;
  level_started: number;
  level_ended: number;
  accuracy: number;
  started_at: string;
  ended_at?: string;
  prompt_count: number;
  notes?: string;
}

export interface GameProgress {
  child_id: string;
  game_id: GameId;
  current_level: number;
  highest_level_unlocked: number;
  last_session_accuracy: number;
  updated_at: string;
}

export interface PromptAttempt {
  attempt_id: string;
  session_id: string;
  prompt_id: string;
  target_ids: string[];
  input_mode: InputMode;
  raw_speech_text?: string;
  audio_clip_path?: string;
  model_top_guess?: string;
  model_second_guess?: string;
  model_confidence?: number;    // 0-1
  final_interpreted_answer: string;
  was_parent_corrected: boolean;
  was_correct_for_prompt: boolean;
  support_action_used?: SupportAction;
  support_action_count?: number;
  visual_support_level?: number;
  model_replay_count?: number;
  break_taken?: boolean;
  demo_was_shown?: boolean;
  selected_tokens_json?: string[];
  response_time_ms?: number;
  created_at: string;
}

export interface SpeechMappingExample {
  mapping_id: string;
  child_id: string;
  target_id: string;
  raw_speech_text: string;
  audio_clip_path?: string;
  context_tag: string;      // e.g. "turns", "location", "comparison"
  confirmed_by_parent: boolean;
  times_seen: number;
  last_seen_at: string;
}

export interface ParentObservation {
  observation_id: string;
  child_id: string;
  target_id?: string;
  note_text: string;
  observed_at: string;
}
