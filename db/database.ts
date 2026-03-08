import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

import { SEED_PROMPTS_GAME1 } from '@/data/seeds/prompts';
import { SEED_PROMPTS_GAME2 } from '@/data/seeds/prompts-game2';
import { SEED_PROMPTS_GAME3 } from '@/data/seeds/prompts-game3';
import { SEED_TARGETS } from '@/data/seeds/targets';
import {
  ChildProfile,
  GameId,
  ParentObservation,
  PracticeSession,
  PromptAttempt,
  PromptTemplate,
  SpeechMappingExample,
  TargetConcept,
  TargetStatus,
} from '@/types';

let db: SQLite.SQLiteDatabase | null = null;

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
  spoken_text: string;
  visual_scene_key: string;
  answer_options: string;
  correct_answer: string;
  enabled: number;
}

interface SessionRow {
  session_id: string;
  child_id: string;
  game_id: GameId;
  started_at: string;
  ended_at: string | null;
  prompt_count: number;
  notes: string | null;
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
];

function parseStringArray(raw: string): string[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.filter((item): item is string => typeof item === 'string');
}

function toPromptTemplate(row: PromptRow): PromptTemplate {
  return {
    prompt_id: row.prompt_id,
    game_id: row.game_id,
    target_ids: parseStringArray(row.target_ids),
    prompt_type: row.prompt_type,
    spoken_text: row.spoken_text,
    visual_scene_key: row.visual_scene_key,
    answer_options: parseStringArray(row.answer_options),
    correct_answer: row.correct_answer,
    enabled: Boolean(row.enabled),
  };
}

function toPracticeSession(row: SessionRow): PracticeSession {
  return {
    session_id: row.session_id,
    child_id: row.child_id,
    game_id: row.game_id,
    started_at: row.started_at,
    ended_at: row.ended_at ?? undefined,
    prompt_count: row.prompt_count,
    notes: row.notes ?? undefined,
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

async function seedIfFirstRun(database: SQLite.SQLiteDatabase): Promise<void> {
  const countRow = await database.getFirstAsync<CountRow>('SELECT COUNT(*) as count FROM child_profiles;');
  const count = countRow?.count ?? 0;
  if (count > 0) {
    return;
  }

  const now = new Date().toISOString();
  const defaultChild: ChildProfile = {
    child_id: 'child_01',
    display_name: 'Kiddo',
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

  for (const target of SEED_TARGETS) {
    await database.runAsync(
      `INSERT INTO target_concepts (
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

  const prompts = [...SEED_PROMPTS_GAME1, ...SEED_PROMPTS_GAME2, ...SEED_PROMPTS_GAME3];
  for (const prompt of prompts) {
    await database.runAsync(
      `INSERT INTO prompt_templates (
        prompt_id,
        game_id,
        target_ids,
        prompt_type,
        spoken_text,
        visual_scene_key,
        answer_options,
        correct_answer,
        enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      prompt.prompt_id,
      prompt.game_id,
      JSON.stringify(prompt.target_ids),
      prompt.prompt_type,
      prompt.spoken_text,
      prompt.visual_scene_key,
      JSON.stringify(prompt.answer_options),
      prompt.correct_answer,
      Number(prompt.enabled)
    );
  }
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync('PRAGMA foreign_keys = ON;');
  for (const statement of TABLE_CREATION_SQL) {
    await database.execAsync(statement);
  }
  await seedIfFirstRun(database);
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  try {
    const openedDb = await SQLite.openDatabaseAsync('caelum.db');
    await runMigrations(openedDb);
    db = openedDb;
    return db;
  } catch (error) {
    if (Platform.OS !== 'web' || !isWebNoModificationAllowedError(error)) {
      throw error;
    }

    console.warn(
      '[db] Web persistent storage unavailable (NoModificationAllowedError). Falling back to in-memory SQLite for this session.'
    );
    const fallbackDb = await SQLite.openDatabaseAsync(':memory:');
    await runMigrations(fallbackDb);
    db = fallbackDb;
    return db;
  }
}

export async function getTargets(): Promise<TargetConcept[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<TargetRow>(
    'SELECT * FROM target_concepts ORDER BY difficulty_order ASC;'
  );
  return rows;
}

export async function getTargetsByGame(gameId: GameId): Promise<TargetConcept[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<TargetRow>(
    'SELECT * FROM target_concepts WHERE game_id = ? ORDER BY difficulty_order ASC;',
    gameId
  );
  return rows;
}

export async function updateTargetStatus(targetId: string, status: TargetStatus): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE target_concepts SET status = ?, updated_at = ? WHERE target_id = ?;',
    status,
    new Date().toISOString(),
    targetId
  );
}

export async function getPromptsByGame(gameId: GameId): Promise<PromptTemplate[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<PromptRow>(
    'SELECT * FROM prompt_templates WHERE game_id = ?;',
    gameId
  );
  return rows.map(toPromptTemplate);
}

export async function getEnabledPromptsByGame(gameId: GameId): Promise<PromptTemplate[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<PromptRow>(
    'SELECT * FROM prompt_templates WHERE game_id = ? AND enabled = 1;',
    gameId
  );
  return rows.map(toPromptTemplate);
}

export async function saveSession(session: PracticeSession): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO practice_sessions (
      session_id,
      child_id,
      game_id,
      started_at,
      ended_at,
      prompt_count,
      notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
    session.session_id,
    session.child_id,
    session.game_id,
    session.started_at,
    session.ended_at ?? null,
    session.prompt_count,
    session.notes ?? null
  );
}

export async function getRecentSessions(limit = 20): Promise<PracticeSession[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<SessionRow>(
    'SELECT * FROM practice_sessions ORDER BY started_at DESC LIMIT ?;',
    limit
  );
  return rows.map(toPracticeSession);
}

export async function saveAttempt(attempt: PromptAttempt): Promise<void> {
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
      response_time_ms,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
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
    attempt.response_time_ms ?? null,
    attempt.created_at
  );
}

export async function saveAttempts(attempts: PromptAttempt[]): Promise<void> {
  for (const attempt of attempts) {
    await saveAttempt(attempt);
  }
}

export async function getAttemptsBySession(sessionId: string): Promise<PromptAttempt[]> {
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
}> {
  const database = await getDatabase();
  const weeklyCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const row = await database.getFirstAsync<WeeklyStatsRow>(
    `SELECT
      COUNT(*) AS totalPrompts,
      SUM(CASE WHEN input_mode = 'touch' AND was_correct_for_prompt = 1 THEN 1 ELSE 0 END) AS touchCorrect,
      SUM(CASE WHEN input_mode = 'speech' AND model_top_guess = final_interpreted_answer THEN 1 ELSE 0 END) AS speechMatched
    FROM prompt_attempts
    WHERE created_at >= ?;`,
    weeklyCutoff
  );

  return {
    totalPrompts: row?.totalPrompts ?? 0,
    touchCorrect: row?.touchCorrect ?? 0,
    speechMatched: row?.speechMatched ?? 0,
  };
}

export async function getSpeechMappings(childId?: string): Promise<SpeechMappingExample[]> {
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
  const database = await getDatabase();
  const rows = await database.getAllAsync<AttemptRow>(
    'SELECT * FROM prompt_attempts WHERE was_parent_corrected = 1 ORDER BY created_at DESC;'
  );
  return rows.map(toPromptAttempt);
}
