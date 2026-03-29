import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

import { SEED_PROMPTS_GAME1 } from '@/data/seeds/prompts';
import { SEED_PROMPTS_GAME2 } from '@/data/seeds/prompts-game2';
import {
  SEED_PROMPTS_BUILD_THE_SENTENCE,
  SEED_PROMPTS_DAILY_PHRASE_PRACTICE,
  SEED_PROMPTS_DO_WHAT_I_SAY,
  SEED_PROMPTS_MOVEMENT_SEARCH,
  SEED_PROMPTS_PICTURE_QUESTIONS,
} from '@/data/seeds/prompts-ranked';
import { SEED_TARGETS } from '@/data/seeds/targets';
import {
  AppSettings,
  ChildProfile,
  GameProgress,
  GameId,
  ParentObservation,
  PracticeSession,
  PromptAttempt,
  PromptTemplate,
  SpeechMappingExample,
  SupportAction,
  TargetConcept,
  TargetStatus,
} from '@/types';

let db: SQLite.SQLiteDatabase | null = null;
let dbInitPromise: Promise<SQLite.SQLiteDatabase> | null = null;
const useWebMemoryStore = Platform.OS === 'web' && process.env.NODE_ENV !== 'production';

type MemoryState = {
  childProfiles: ChildProfile[];
  targets: TargetConcept[];
  prompts: PromptTemplate[];
  sessions: PracticeSession[];
  attempts: PromptAttempt[];
  gameProgress: GameProgress[];
  speechMappings: SpeechMappingExample[];
  observations: ParentObservation[];
  settings: AppSettings;
};

let memoryState: MemoryState | null = null;

function isWebNoModificationAllowedError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes('nomodificationallowederror') ||
    message.includes('no modification allowed')
  );
}

function isWebStorageUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    isWebNoModificationAllowedError(error) ||
    message.includes('unable to open database file') ||
    message.includes('cannot create file') ||
    message.includes('invalid vfs state') ||
    message.includes('error code 14')
  );
}

interface CountRow {
  count: number;
}

interface TargetRow {
  target_id: string;
  slug: string;
  label: string;
  category: TargetConcept['category'];
  game_id: GameId;
  status: TargetStatus;
  difficulty_order: number;
  created_at: string;
  updated_at: string;
}

interface PromptRow {
  prompt_id: string;
  game_id: GameId;
  target_ids: string;
  prompt_type: PromptTemplate['prompt_type'];
  difficulty_level: PromptTemplate['difficulty_level'];
  prompt_group: string;
  feedback_key: string;
  spoken_text: string;
  visual_scene_key: string;
  answer_options: string;
  correct_answer: string;
  model_phrase: string | null;
  enabled: number;
}

interface SessionRow {
  session_id: string;
  child_id: string;
  game_id: GameId;
  level_started: number;
  level_ended: number;
  accuracy: number;
  started_at: string;
  ended_at: string | null;
  prompt_count: number;
  notes: string | null;
}

interface GameProgressRow {
  child_id: string;
  game_id: GameId;
  current_level: number;
  highest_level_unlocked: number;
  last_session_accuracy: number;
  updated_at: string;
}

interface AttemptRow {
  attempt_id: string;
  session_id: string;
  prompt_id: string;
  target_ids: string;
  input_mode: PromptAttempt['input_mode'];
  raw_speech_text: string | null;
  audio_clip_path: string | null;
  model_top_guess: string | null;
  model_second_guess: string | null;
  model_confidence: number | null;
  final_interpreted_answer: string;
  was_parent_corrected: number;
  was_correct_for_prompt: number;
  support_action_used: SupportAction | null;
  support_action_count: number | null;
  visual_support_level: number | null;
  model_replay_count: number | null;
  break_taken: number | null;
  demo_was_shown: number | null;
  selected_tokens_json: string | null;
  response_time_ms: number | null;
  created_at: string;
}

interface SpeechMappingRow {
  mapping_id: string;
  child_id: string;
  target_id: string;
  raw_speech_text: string;
  audio_clip_path: string | null;
  context_tag: string;
  confirmed_by_parent: number;
  times_seen: number;
  last_seen_at: string;
}

interface ObservationRow {
  observation_id: string;
  child_id: string;
  target_id: string | null;
  note_text: string;
  observed_at: string;
}

interface WeeklyStatsRow {
  totalPrompts: number | null;
  touchCorrect: number | null;
  speechMatched: number | null;
  supportUsed: number | null;
}

interface MaxLevelRow {
  maxLevel: number | null;
}

interface AppSettingRow {
  setting_key: string;
  setting_value: string;
  updated_at: string;
}

const TABLE_CREATION_SQL = [
  `CREATE TABLE IF NOT EXISTS child_profiles (
    child_id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    birth_year INTEGER,
    notes TEXT,
    preferred_rewards TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS target_concepts (
    target_id TEXT PRIMARY KEY,
    slug TEXT NOT NULL,
    label TEXT NOT NULL,
    category TEXT NOT NULL,
    game_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'enabled',
    difficulty_order INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS prompt_templates (
    prompt_id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL,
    target_ids TEXT NOT NULL,
    prompt_type TEXT NOT NULL,
    spoken_text TEXT NOT NULL,
    visual_scene_key TEXT NOT NULL,
    answer_options TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1
  );`,
  `CREATE TABLE IF NOT EXISTS practice_sessions (
    session_id TEXT PRIMARY KEY,
    child_id TEXT NOT NULL,
    game_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    prompt_count INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    FOREIGN KEY (child_id) REFERENCES child_profiles(child_id)
  );`,
  `CREATE TABLE IF NOT EXISTS prompt_attempts (
    attempt_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    prompt_id TEXT NOT NULL,
    target_ids TEXT NOT NULL,
    input_mode TEXT NOT NULL,
    raw_speech_text TEXT,
    audio_clip_path TEXT,
    model_top_guess TEXT,
    model_second_guess TEXT,
    model_confidence REAL,
    final_interpreted_answer TEXT NOT NULL,
    was_parent_corrected INTEGER NOT NULL DEFAULT 0,
    was_correct_for_prompt INTEGER NOT NULL DEFAULT 0,
    response_time_ms INTEGER,
    created_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES practice_sessions(session_id)
  );`,
  `CREATE TABLE IF NOT EXISTS speech_mapping_examples (
    mapping_id TEXT PRIMARY KEY,
    child_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    raw_speech_text TEXT NOT NULL,
    audio_clip_path TEXT,
    context_tag TEXT NOT NULL,
    confirmed_by_parent INTEGER NOT NULL DEFAULT 0,
    times_seen INTEGER NOT NULL DEFAULT 1,
    last_seen_at TEXT NOT NULL,
    FOREIGN KEY (child_id) REFERENCES child_profiles(child_id)
  );`,
  `CREATE TABLE IF NOT EXISTS parent_observations (
    observation_id TEXT PRIMARY KEY,
    child_id TEXT NOT NULL,
    target_id TEXT,
    note_text TEXT NOT NULL,
    observed_at TEXT NOT NULL,
    FOREIGN KEY (child_id) REFERENCES child_profiles(child_id)
  );`,
  `CREATE TABLE IF NOT EXISTS game_progress (
    child_id TEXT NOT NULL,
    game_id TEXT NOT NULL,
    current_level INTEGER NOT NULL DEFAULT 1,
    highest_level_unlocked INTEGER NOT NULL DEFAULT 1,
    last_session_accuracy REAL NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (child_id, game_id)
  );`,
  `CREATE TABLE IF NOT EXISTS app_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
];

function parseStringArray(raw: string): string[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.filter((item): item is string => typeof item === 'string');
}

function clonePrompt(prompt: PromptTemplate): PromptTemplate {
  return {
    ...prompt,
    target_ids: [...prompt.target_ids],
    answer_options: [...prompt.answer_options],
  };
}

function cloneAttempt(attempt: PromptAttempt): PromptAttempt {
  return {
    ...attempt,
    target_ids: [...attempt.target_ids],
    selected_tokens_json: attempt.selected_tokens_json
      ? [...attempt.selected_tokens_json]
      : undefined,
  };
}

function ensureMemoryState(): MemoryState {
  if (memoryState) {
    return memoryState;
  }

  const now = new Date().toISOString();
  memoryState = {
    childProfiles: [
      {
        child_id: 'child_01',
        display_name: 'Caelum',
        created_at: now,
        updated_at: now,
      },
    ],
    targets: SEED_TARGETS.map((target) => ({ ...target })),
    prompts: getSeedPrompts().map(clonePrompt),
    sessions: [],
    attempts: [],
    gameProgress: [],
    speechMappings: [],
    observations: [],
    settings: {
      speech_enabled: true,
      updated_at: now,
    },
  };

  return memoryState;
}

function toPromptTemplate(row: PromptRow): PromptTemplate {
  return {
    prompt_id: row.prompt_id,
    game_id: row.game_id,
    target_ids: parseStringArray(row.target_ids),
    prompt_type: row.prompt_type,
    difficulty_level: row.difficulty_level,
    prompt_group: row.prompt_group,
    feedback_key: row.feedback_key,
    spoken_text: row.spoken_text,
    visual_scene_key: row.visual_scene_key,
    answer_options: parseStringArray(row.answer_options),
    correct_answer: row.correct_answer,
    model_phrase: row.model_phrase ?? undefined,
    enabled: Boolean(row.enabled),
  };
}

function toPracticeSession(row: SessionRow): PracticeSession {
  return {
    session_id: row.session_id,
    child_id: row.child_id,
    game_id: row.game_id,
    level_started: row.level_started,
    level_ended: row.level_ended,
    accuracy: row.accuracy,
    started_at: row.started_at,
    ended_at: row.ended_at ?? undefined,
    prompt_count: row.prompt_count,
    notes: row.notes ?? undefined,
  };
}

function toGameProgress(row: GameProgressRow): GameProgress {
  return {
    child_id: row.child_id,
    game_id: row.game_id,
    current_level: row.current_level,
    highest_level_unlocked: row.highest_level_unlocked,
    last_session_accuracy: row.last_session_accuracy,
    updated_at: row.updated_at,
  };
}

function toPromptAttempt(row: AttemptRow): PromptAttempt {
  return {
    attempt_id: row.attempt_id,
    session_id: row.session_id,
    prompt_id: row.prompt_id,
    target_ids: parseStringArray(row.target_ids),
    input_mode: row.input_mode,
    raw_speech_text: row.raw_speech_text ?? undefined,
    audio_clip_path: row.audio_clip_path ?? undefined,
    model_top_guess: row.model_top_guess ?? undefined,
    model_second_guess: row.model_second_guess ?? undefined,
    model_confidence: row.model_confidence ?? undefined,
    final_interpreted_answer: row.final_interpreted_answer,
    was_parent_corrected: Boolean(row.was_parent_corrected),
    was_correct_for_prompt: Boolean(row.was_correct_for_prompt),
    support_action_used: row.support_action_used ?? undefined,
    support_action_count: row.support_action_count ?? undefined,
    visual_support_level: row.visual_support_level ?? undefined,
    model_replay_count: row.model_replay_count ?? undefined,
    break_taken: row.break_taken === null ? undefined : Boolean(row.break_taken),
    demo_was_shown: row.demo_was_shown === null ? undefined : Boolean(row.demo_was_shown),
    selected_tokens_json: row.selected_tokens_json
      ? parseStringArray(row.selected_tokens_json)
      : undefined,
    response_time_ms: row.response_time_ms ?? undefined,
    created_at: row.created_at,
  };
}

function toSpeechMapping(row: SpeechMappingRow): SpeechMappingExample {
  return {
    mapping_id: row.mapping_id,
    child_id: row.child_id,
    target_id: row.target_id,
    raw_speech_text: row.raw_speech_text,
    audio_clip_path: row.audio_clip_path ?? undefined,
    context_tag: row.context_tag,
    confirmed_by_parent: Boolean(row.confirmed_by_parent),
    times_seen: row.times_seen,
    last_seen_at: row.last_seen_at,
  };
}

function toParentObservation(row: ObservationRow): ParentObservation {
  return {
    observation_id: row.observation_id,
    child_id: row.child_id,
    target_id: row.target_id ?? undefined,
    note_text: row.note_text,
    observed_at: row.observed_at,
  };
}

function getSeedPrompts(): PromptTemplate[] {
  return [
    ...SEED_PROMPTS_GAME1,
    ...SEED_PROMPTS_GAME2,
    ...SEED_PROMPTS_DAILY_PHRASE_PRACTICE,
    ...SEED_PROMPTS_DO_WHAT_I_SAY,
    ...SEED_PROMPTS_BUILD_THE_SENTENCE,
    ...SEED_PROMPTS_PICTURE_QUESTIONS,
    ...SEED_PROMPTS_MOVEMENT_SEARCH,
  ];
}

async function upsertSeedContent(database: SQLite.SQLiteDatabase): Promise<void> {
  for (const target of SEED_TARGETS) {
    await database.runAsync(
      `INSERT OR REPLACE INTO target_concepts (
        target_id,
        slug,
        label,
        category,
        game_id,
        status,
        difficulty_order,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      target.target_id,
      target.slug,
      target.label,
      target.category,
      target.game_id,
      target.status,
      target.difficulty_order,
      target.created_at,
      target.updated_at
    );
  }

  for (const prompt of getSeedPrompts()) {
    await database.runAsync(
      `INSERT OR REPLACE INTO prompt_templates (
        prompt_id,
        game_id,
        target_ids,
        prompt_type,
        difficulty_level,
        prompt_group,
        feedback_key,
        spoken_text,
        visual_scene_key,
        answer_options,
        correct_answer,
        model_phrase,
        enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      prompt.prompt_id,
      prompt.game_id,
      JSON.stringify(prompt.target_ids),
      prompt.prompt_type,
      prompt.difficulty_level,
      prompt.prompt_group,
      prompt.feedback_key,
      prompt.spoken_text,
      prompt.visual_scene_key,
      JSON.stringify(prompt.answer_options),
      prompt.correct_answer,
      prompt.model_phrase ?? null,
      Number(prompt.enabled)
    );
  }
}

async function seedIfFirstRun(database: SQLite.SQLiteDatabase): Promise<void> {
  const countRow = await database.getFirstAsync<CountRow>('SELECT COUNT(*) as count FROM child_profiles;');
  const count = countRow?.count ?? 0;
  if (count > 0) {
    return;
  }

  const now = new Date().toISOString();
  const defaultChild: ChildProfile = {
    child_id: 'child_01',
    display_name: 'Caelum',
    created_at: now,
    updated_at: now,
  };

  await database.runAsync(
    `INSERT INTO child_profiles (
      child_id,
      display_name,
      birth_year,
      notes,
      preferred_rewards,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
    defaultChild.child_id,
    defaultChild.display_name,
    defaultChild.birth_year ?? null,
    defaultChild.notes ?? null,
    JSON.stringify(defaultChild.preferred_rewards ?? []),
    defaultChild.created_at,
    defaultChild.updated_at
  );

  await upsertSeedContent(database);
  await database.runAsync(
    `INSERT OR IGNORE INTO app_settings (setting_key, setting_value, updated_at)
     VALUES ('speech_enabled', 'true', ?);`,
    now
  );
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync('PRAGMA foreign_keys = ON;');

  for (const statement of TABLE_CREATION_SQL) {
    await database.execAsync(statement);
  }

  const versionRow = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;'
  );
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion < 2) {
    await database.execAsync(
      'ALTER TABLE prompt_templates ADD COLUMN difficulty_level INTEGER NOT NULL DEFAULT 1;'
    );
    await database.execAsync(
      "ALTER TABLE prompt_templates ADD COLUMN prompt_group TEXT NOT NULL DEFAULT '';"
    );
    await database.execAsync(
      "ALTER TABLE prompt_templates ADD COLUMN feedback_key TEXT NOT NULL DEFAULT '';"
    );
    await database.execAsync('PRAGMA user_version = 2;');
  }

  if (currentVersion < 3) {
    await database.execAsync(
      'ALTER TABLE practice_sessions ADD COLUMN level_started INTEGER NOT NULL DEFAULT 1;'
    );
    await database.execAsync(
      'ALTER TABLE practice_sessions ADD COLUMN level_ended INTEGER NOT NULL DEFAULT 1;'
    );
    await database.execAsync(
      'ALTER TABLE practice_sessions ADD COLUMN accuracy REAL NOT NULL DEFAULT 0;'
    );
    await database.execAsync('PRAGMA user_version = 3;');
  }

  if (currentVersion < 4) {
    await database.execAsync(`CREATE TABLE IF NOT EXISTS game_progress (
      child_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      current_level INTEGER NOT NULL DEFAULT 1,
      highest_level_unlocked INTEGER NOT NULL DEFAULT 1,
      last_session_accuracy REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (child_id, game_id)
    );`);
    await database.execAsync('PRAGMA user_version = 4;');
  }

  if (currentVersion < 5) {
    await database.execAsync(
      'ALTER TABLE prompt_templates ADD COLUMN model_phrase TEXT;'
    );
    await database.execAsync('PRAGMA user_version = 5;');
  }

  if (currentVersion < 6) {
    await database.execAsync(
      'ALTER TABLE prompt_attempts ADD COLUMN support_action_used TEXT;'
    );
    await database.execAsync(
      'ALTER TABLE prompt_attempts ADD COLUMN support_action_count INTEGER NOT NULL DEFAULT 0;'
    );
    await database.execAsync(
      'ALTER TABLE prompt_attempts ADD COLUMN visual_support_level INTEGER NOT NULL DEFAULT 0;'
    );
    await database.execAsync(
      'ALTER TABLE prompt_attempts ADD COLUMN model_replay_count INTEGER NOT NULL DEFAULT 0;'
    );
    await database.execAsync(
      'ALTER TABLE prompt_attempts ADD COLUMN break_taken INTEGER NOT NULL DEFAULT 0;'
    );
    await database.execAsync(
      'ALTER TABLE prompt_attempts ADD COLUMN demo_was_shown INTEGER NOT NULL DEFAULT 0;'
    );
    await database.execAsync(
      'ALTER TABLE prompt_attempts ADD COLUMN selected_tokens_json TEXT;'
    );
    await database.execAsync('PRAGMA user_version = 6;');
  }

  if (currentVersion < 7) {
    await database.execAsync(
      `DELETE FROM prompt_attempts
       WHERE session_id IN (SELECT session_id FROM practice_sessions WHERE game_id = 'which_is_bigger');`
    );
    await database.execAsync(`DELETE FROM practice_sessions WHERE game_id = 'which_is_bigger';`);
    await database.execAsync(`DELETE FROM game_progress WHERE game_id = 'which_is_bigger';`);
    await database.execAsync(`DELETE FROM target_concepts WHERE game_id = 'which_is_bigger';`);
    await database.execAsync(`DELETE FROM prompt_templates WHERE game_id = 'which_is_bigger';`);
    await database.runAsync(
      `UPDATE child_profiles
       SET display_name = 'Caelum', updated_at = ?
       WHERE child_id = 'child_01' AND display_name = 'Kiddo';`,
      new Date().toISOString()
    );
    await upsertSeedContent(database);
    await database.execAsync('PRAGMA user_version = 7;');
  }

  if (currentVersion < 8) {
    await database.execAsync(`CREATE TABLE IF NOT EXISTS app_settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`);
    await database.runAsync(
      `INSERT OR IGNORE INTO app_settings (setting_key, setting_value, updated_at)
       VALUES ('speech_enabled', 'true', ?);`,
      new Date().toISOString()
    );
    await database.execAsync('PRAGMA user_version = 8;');
  }

  await database.execAsync('PRAGMA user_version = 8;');
  await seedIfFirstRun(database);
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (useWebMemoryStore) {
    ensureMemoryState();
    return null as unknown as SQLite.SQLiteDatabase;
  }

  if (db) {
    return db;
  }

  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = (async () => {
    try {
      const openedDb = await SQLite.openDatabaseAsync('caelum.db');
      await runMigrations(openedDb);
      db = openedDb;
      return openedDb;
    } catch (error) {
      if (Platform.OS !== 'web' || !isWebStorageUnavailableError(error)) {
        throw error;
      }

      console.warn(
        '[db] Web persistent SQLite unavailable. Falling back to in-memory SQLite for this session.'
      );
      const fallbackDb = await SQLite.openDatabaseAsync(':memory:');
      await runMigrations(fallbackDb);
      db = fallbackDb;
      return fallbackDb;
    } finally {
      dbInitPromise = null;
    }
  })();

  return dbInitPromise;
}

export async function getTargets(): Promise<TargetConcept[]> {
  if (useWebMemoryStore) {
    return [...ensureMemoryState().targets].sort(
      (a, b) => a.difficulty_order - b.difficulty_order
    );
  }

  const database = await getDatabase();
  const rows = await database.getAllAsync<TargetRow>(
    'SELECT * FROM target_concepts ORDER BY difficulty_order ASC;'
  );
  return rows;
}

export async function getTargetsByGame(gameId: GameId): Promise<TargetConcept[]> {
  if (useWebMemoryStore) {
    return ensureMemoryState()
      .targets
      .filter((target) => target.game_id === gameId)
      .sort((a, b) => a.difficulty_order - b.difficulty_order);
  }

  const database = await getDatabase();
  const rows = await database.getAllAsync<TargetRow>(
    'SELECT * FROM target_concepts WHERE game_id = ? ORDER BY difficulty_order ASC;',
    gameId
  );
  return rows;
}

export async function getEnabledTargetIdsByGame(gameId: GameId): Promise<string[]> {
  if (useWebMemoryStore) {
    return ensureMemoryState()
      .targets
      .filter((target) => target.game_id === gameId && target.status === 'enabled')
      .sort((a, b) => a.difficulty_order - b.difficulty_order)
      .map((target) => target.target_id);
  }

  const database = await getDatabase();
  const rows = await database.getAllAsync<Pick<TargetRow, 'target_id'>>(
    `SELECT target_id FROM target_concepts
     WHERE game_id = ? AND status = 'enabled'
     ORDER BY difficulty_order ASC;`,
    gameId
  );
  return rows.map((row) => row.target_id);
}

export async function updateTargetStatus(targetId: string, status: TargetStatus): Promise<void> {
  if (useWebMemoryStore) {
    const state = ensureMemoryState();
    state.targets = state.targets.map((target) =>
      target.target_id === targetId
        ? { ...target, status, updated_at: new Date().toISOString() }
        : target
    );
    return;
  }

  const database = await getDatabase();
  await database.runAsync(
    'UPDATE target_concepts SET status = ?, updated_at = ? WHERE target_id = ?;',
    status,
    new Date().toISOString(),
    targetId
  );
}

export async function getAppSettings(): Promise<AppSettings> {
  if (useWebMemoryStore) {
    return { ...ensureMemoryState().settings };
  }

  const database = await getDatabase();
  const row = await database.getFirstAsync<AppSettingRow>(
    `SELECT setting_key, setting_value, updated_at
     FROM app_settings
     WHERE setting_key = 'speech_enabled';`
  );

  if (!row) {
    const now = new Date().toISOString();
    await database.runAsync(
      `INSERT INTO app_settings (setting_key, setting_value, updated_at)
       VALUES ('speech_enabled', 'true', ?);`,
      now
    );
    return {
      speech_enabled: true,
      updated_at: now,
    };
  }

  return {
    speech_enabled: row.setting_value === 'true',
    updated_at: row.updated_at,
  };
}

export async function updateSpeechEnabled(speechEnabled: boolean): Promise<void> {
  if (useWebMemoryStore) {
    ensureMemoryState().settings = {
      speech_enabled: speechEnabled,
      updated_at: new Date().toISOString(),
    };
    return;
  }

  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO app_settings (setting_key, setting_value, updated_at)
     VALUES ('speech_enabled', ?, ?)
     ON CONFLICT(setting_key) DO UPDATE SET
       setting_value = excluded.setting_value,
       updated_at = excluded.updated_at;`,
    speechEnabled ? 'true' : 'false',
    new Date().toISOString()
  );
}

export async function getPromptsByGame(gameId: GameId): Promise<PromptTemplate[]> {
  if (useWebMemoryStore) {
    return ensureMemoryState()
      .prompts
      .filter((prompt) => prompt.game_id === gameId)
      .map(clonePrompt);
  }

  const database = await getDatabase();
  const rows = await database.getAllAsync<PromptRow>(
    'SELECT * FROM prompt_templates WHERE game_id = ?;',
    gameId
  );
  return rows.map(toPromptTemplate);
}

export async function getEnabledPromptsByGame(gameId: GameId): Promise<PromptTemplate[]> {
  if (useWebMemoryStore) {
    return ensureMemoryState()
      .prompts
      .filter((prompt) => prompt.game_id === gameId && prompt.enabled)
      .map(clonePrompt);
  }

  const database = await getDatabase();
  const rows = await database.getAllAsync<PromptRow>(
    'SELECT * FROM prompt_templates WHERE game_id = ? AND enabled = 1;',
    gameId
  );
  return rows.map(toPromptTemplate);
}

export async function getPromptsForGameLevels(
  gameId: GameId,
  levelNumbers: number[],
  enabledTargetIds: string[]
): Promise<PromptTemplate[]> {
  if (levelNumbers.length === 0) {
    return [];
  }

  if (useWebMemoryStore) {
    return ensureMemoryState()
      .prompts
      .filter(
        (prompt) =>
          prompt.game_id === gameId &&
          prompt.enabled &&
          levelNumbers.includes(prompt.difficulty_level) &&
          (enabledTargetIds.length === 0 ||
            prompt.target_ids.some((targetId) => enabledTargetIds.includes(targetId)))
      )
      .map(clonePrompt);
  }

  const database = await getDatabase();
  const levelPlaceholders = levelNumbers.map(() => '?').join(', ');
  const params: Array<string | number> = [gameId, ...levelNumbers];

  let query = `SELECT * FROM prompt_templates
    WHERE game_id = ?
      AND enabled = 1
      AND difficulty_level IN (${levelPlaceholders})`;

  if (enabledTargetIds.length > 0) {
    const targetClause = enabledTargetIds.map(() => 'target_ids LIKE ?').join(' OR ');
    query += `
      AND (${targetClause})`;
    params.push(...enabledTargetIds.map((targetId) => `%"${targetId}"%`));
  }

  query += ';';

  const rows = await database.getAllAsync<PromptRow>(query, ...params);
  return rows.map(toPromptTemplate);
}

export async function saveSession(session: PracticeSession): Promise<void> {
  if (useWebMemoryStore) {
    const state = ensureMemoryState();
    state.sessions = [
      ...state.sessions.filter((item) => item.session_id !== session.session_id),
      { ...session },
    ];
    return;
  }

  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO practice_sessions (
      session_id,
      child_id,
      game_id,
      level_started,
      level_ended,
      accuracy,
      started_at,
      ended_at,
      prompt_count,
      notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    session.session_id,
    session.child_id,
    session.game_id,
    session.level_started,
    session.level_ended,
    session.accuracy,
    session.started_at,
    session.ended_at ?? null,
    session.prompt_count,
    session.notes ?? null
  );
}

export async function getGameProgress(childId: string, gameId: GameId): Promise<GameProgress | null> {
  if (useWebMemoryStore) {
    return (
      ensureMemoryState().gameProgress.find(
        (item) => item.child_id === childId && item.game_id === gameId
      ) ?? null
    );
  }

  const database = await getDatabase();
  const row = await database.getFirstAsync<GameProgressRow>(
    'SELECT * FROM game_progress WHERE child_id = ? AND game_id = ?;',
    childId,
    gameId
  );
  return row ? toGameProgress(row) : null;
}

export async function upsertGameProgress(progress: GameProgress): Promise<void> {
  if (useWebMemoryStore) {
    const state = ensureMemoryState();
    state.gameProgress = [
      ...state.gameProgress.filter(
        (item) => !(item.child_id === progress.child_id && item.game_id === progress.game_id)
      ),
      { ...progress },
    ];
    return;
  }

  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO game_progress (
      child_id,
      game_id,
      current_level,
      highest_level_unlocked,
      last_session_accuracy,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?);`,
    progress.child_id,
    progress.game_id,
    progress.current_level,
    progress.highest_level_unlocked,
    progress.last_session_accuracy,
    progress.updated_at
  );
}

export async function getRecentSessions(limit = 20): Promise<PracticeSession[]> {
  if (useWebMemoryStore) {
    return [...ensureMemoryState().sessions]
      .sort((a, b) => b.started_at.localeCompare(a.started_at))
      .slice(0, limit);
  }

  const database = await getDatabase();
  const rows = await database.getAllAsync<SessionRow>(
    'SELECT * FROM practice_sessions ORDER BY started_at DESC LIMIT ?;',
    limit
  );
  return rows.map(toPracticeSession);
}

export async function saveAttempt(attempt: PromptAttempt): Promise<void> {
  if (useWebMemoryStore) {
    const state = ensureMemoryState();
    state.attempts = [
      ...state.attempts.filter((item) => item.attempt_id !== attempt.attempt_id),
      cloneAttempt(attempt),
    ];
    return;
  }

  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO prompt_attempts (
      attempt_id,
      session_id,
      prompt_id,
      target_ids,
      input_mode,
      raw_speech_text,
      audio_clip_path,
      model_top_guess,
      model_second_guess,
      model_confidence,
      final_interpreted_answer,
      was_parent_corrected,
      was_correct_for_prompt,
      support_action_used,
      support_action_count,
      visual_support_level,
      model_replay_count,
      break_taken,
      demo_was_shown,
      selected_tokens_json,
      response_time_ms,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    attempt.attempt_id,
    attempt.session_id,
    attempt.prompt_id,
    JSON.stringify(attempt.target_ids),
    attempt.input_mode,
    attempt.raw_speech_text ?? null,
    attempt.audio_clip_path ?? null,
    attempt.model_top_guess ?? null,
    attempt.model_second_guess ?? null,
    attempt.model_confidence ?? null,
    attempt.final_interpreted_answer,
    Number(attempt.was_parent_corrected),
    Number(attempt.was_correct_for_prompt),
    attempt.support_action_used ?? null,
    attempt.support_action_count ?? 0,
    attempt.visual_support_level ?? 0,
    attempt.model_replay_count ?? 0,
    Number(attempt.break_taken ?? false),
    Number(attempt.demo_was_shown ?? false),
    JSON.stringify(attempt.selected_tokens_json ?? []),
    attempt.response_time_ms ?? null,
    attempt.created_at
  );
}

export async function saveAttempts(attempts: PromptAttempt[]): Promise<void> {
  if (useWebMemoryStore) {
    for (const attempt of attempts) {
      await saveAttempt(attempt);
    }
    return;
  }

  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    for (const attempt of attempts) {
      await saveAttempt(attempt);
    }
  });
}

export async function getAttemptsBySession(sessionId: string): Promise<PromptAttempt[]> {
  if (useWebMemoryStore) {
    return ensureMemoryState()
      .attempts
      .filter((attempt) => attempt.session_id === sessionId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(cloneAttempt);
  }

  const database = await getDatabase();
  const rows = await database.getAllAsync<AttemptRow>(
    'SELECT * FROM prompt_attempts WHERE session_id = ? ORDER BY created_at ASC;',
    sessionId
  );
  return rows.map(toPromptAttempt);
}

export async function getWeeklyStats(): Promise<{
  totalPrompts: number;
  touchCorrect: number;
  speechMatched: number;
  supportUsed: number;
}> {
  if (useWebMemoryStore) {
    const weeklyCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentAttempts = ensureMemoryState().attempts.filter(
      (attempt) => attempt.created_at >= weeklyCutoff
    );
    return {
      totalPrompts: recentAttempts.length,
      touchCorrect: recentAttempts.filter(
        (attempt) => attempt.input_mode === 'touch' && attempt.was_correct_for_prompt
      ).length,
      speechMatched: recentAttempts.filter(
        (attempt) =>
          attempt.input_mode === 'speech' &&
          attempt.model_top_guess === attempt.final_interpreted_answer
      ).length,
      supportUsed: recentAttempts.reduce(
        (total, attempt) => total + (attempt.support_action_count ?? 0),
        0
      ),
    };
  }

  const database = await getDatabase();
  const weeklyCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const row = await database.getFirstAsync<WeeklyStatsRow>(
    `SELECT
      COUNT(*) AS totalPrompts,
      SUM(CASE WHEN input_mode = 'touch' AND was_correct_for_prompt = 1 THEN 1 ELSE 0 END) AS touchCorrect,
      SUM(CASE WHEN input_mode = 'speech' AND model_top_guess = final_interpreted_answer THEN 1 ELSE 0 END) AS speechMatched,
      SUM(COALESCE(support_action_count, 0)) AS supportUsed
    FROM prompt_attempts
    WHERE created_at >= ?;`,
    weeklyCutoff
  );

  return {
    totalPrompts: row?.totalPrompts ?? 0,
    touchCorrect: row?.touchCorrect ?? 0,
    speechMatched: row?.speechMatched ?? 0,
    supportUsed: row?.supportUsed ?? 0,
  };
}

export async function getGameMaxLevel(gameId: GameId): Promise<number> {
  if (useWebMemoryStore) {
    const levels = ensureMemoryState()
      .prompts
      .filter((prompt) => prompt.game_id === gameId && prompt.enabled)
      .map((prompt) => prompt.difficulty_level);
    return Math.max(1, ...levels);
  }

  const database = await getDatabase();
  const row = await database.getFirstAsync<MaxLevelRow>(
    'SELECT MAX(difficulty_level) AS maxLevel FROM prompt_templates WHERE game_id = ? AND enabled = 1;',
    gameId
  );
  return Math.max(1, row?.maxLevel ?? 1);
}

export async function getSpeechMappings(childId?: string): Promise<SpeechMappingExample[]> {
  if (useWebMemoryStore) {
    const rows = childId
      ? ensureMemoryState().speechMappings.filter((item) => item.child_id === childId)
      : ensureMemoryState().speechMappings;
    return [...rows].sort((a, b) => b.last_seen_at.localeCompare(a.last_seen_at));
  }

  const database = await getDatabase();
  const rows = childId
    ? await database.getAllAsync<SpeechMappingRow>(
        'SELECT * FROM speech_mapping_examples WHERE child_id = ? ORDER BY last_seen_at DESC;',
        childId
      )
    : await database.getAllAsync<SpeechMappingRow>(
        'SELECT * FROM speech_mapping_examples ORDER BY last_seen_at DESC;'
      );
  return rows.map(toSpeechMapping);
}

export async function saveSpeechMapping(mapping: SpeechMappingExample): Promise<void> {
  if (useWebMemoryStore) {
    const state = ensureMemoryState();
    state.speechMappings = [
      ...state.speechMappings.filter((item) => item.mapping_id !== mapping.mapping_id),
      { ...mapping },
    ];
    return;
  }

  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO speech_mapping_examples (
      mapping_id,
      child_id,
      target_id,
      raw_speech_text,
      audio_clip_path,
      context_tag,
      confirmed_by_parent,
      times_seen,
      last_seen_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    mapping.mapping_id,
    mapping.child_id,
    mapping.target_id,
    mapping.raw_speech_text,
    mapping.audio_clip_path ?? null,
    mapping.context_tag,
    Number(mapping.confirmed_by_parent),
    mapping.times_seen,
    mapping.last_seen_at
  );
}

export async function saveObservation(observation: ParentObservation): Promise<void> {
  if (useWebMemoryStore) {
    const state = ensureMemoryState();
    state.observations = [
      ...state.observations.filter((item) => item.observation_id !== observation.observation_id),
      { ...observation },
    ];
    return;
  }

  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO parent_observations (
      observation_id,
      child_id,
      target_id,
      note_text,
      observed_at
    ) VALUES (?, ?, ?, ?, ?);`,
    observation.observation_id,
    observation.child_id,
    observation.target_id ?? null,
    observation.note_text,
    observation.observed_at
  );
}

export async function getObservations(childId?: string): Promise<ParentObservation[]> {
  if (useWebMemoryStore) {
    const rows = childId
      ? ensureMemoryState().observations.filter((item) => item.child_id === childId)
      : ensureMemoryState().observations;
    return [...rows].sort((a, b) => b.observed_at.localeCompare(a.observed_at));
  }

  const database = await getDatabase();
  const rows = childId
    ? await database.getAllAsync<ObservationRow>(
        'SELECT * FROM parent_observations WHERE child_id = ? ORDER BY observed_at DESC;',
        childId
      )
    : await database.getAllAsync<ObservationRow>(
        'SELECT * FROM parent_observations ORDER BY observed_at DESC;'
      );
  return rows.map(toParentObservation);
}

export async function getCorrectedAttempts(): Promise<PromptAttempt[]> {
  if (useWebMemoryStore) {
    return ensureMemoryState()
      .attempts
      .filter((attempt) => attempt.was_parent_corrected)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(cloneAttempt);
  }

  const database = await getDatabase();
  const rows = await database.getAllAsync<AttemptRow>(
    'SELECT * FROM prompt_attempts WHERE was_parent_corrected = 1 ORDER BY created_at DESC;'
  );
  return rows.map(toPromptAttempt);
}
