import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PillButton, SurfaceCard } from '@/components/ui/app-primitives';
import { parentTheme } from '@/constants/semantic-theme';
import { GAME_META, HOME_GAME_ORDER } from '@/data/constants';
import { getGameProgress, getObservations, getTargets, getWeeklyStats, saveObservation } from '@/db';
import type { GameId, GameProgress, ParentObservation, TargetConcept } from '@/types';

const GAME_ORDER: GameId[] = [...HOME_GAME_ORDER];

export default function ProgressScreen() {
  const [weeklyStats, setWeeklyStats] = useState({
    totalPrompts: 0,
    touchCorrect: 0,
    speechMatched: 0,
    supportUsed: 0,
  });
  const [targets, setTargets] = useState<TargetConcept[]>([]);
  const [observations, setObservations] = useState<ParentObservation[]>([]);
  const [noteText, setNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [gameProgressMap, setGameProgressMap] = useState<Record<string, GameProgress | null>>({});

  const loadProgressData = useCallback(async () => {
    const [stats, loadedObservations, loadedTargets, ...progressRows] = await Promise.all([
      getWeeklyStats(),
      getObservations('child_01'),
      getTargets(),
      ...GAME_ORDER.map((gameId) => getGameProgress('child_01', gameId)),
    ]);

    setWeeklyStats(stats);
    setObservations(loadedObservations);
    setTargets(loadedTargets);
    const nextProgressMap = GAME_ORDER.reduce<Record<string, GameProgress | null>>((accumulator, gameId, index) => {
      accumulator[gameId] = progressRows[index] ?? null;
      return accumulator;
    }, {});
    setGameProgressMap(nextProgressMap);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProgressData();
    }, [loadProgressData])
  );

  const formattedTargets = useMemo(
    () =>
      targets.map((target) => ({
        targetId: target.target_id,
        label: target.label,
        statusLabel:
          target.status === 'enabled' ? 'Enabled' : target.status === 'later' ? 'Later' : 'Mastered',
      })),
    [targets]
  );

  const enabledCountByGame = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const target of targets) {
      if (target.status === 'enabled') {
        counts[target.game_id] = (counts[target.game_id] ?? 0) + 1;
      }
    }
    return counts;
  }, [targets]);

  const addObservation = useCallback(async () => {
    const trimmedText = noteText.trim();
    if (!trimmedText || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const newObservation: ParentObservation = {
        observation_id: `obs_${Date.now()}`,
        child_id: 'child_01',
        note_text: trimmedText,
        observed_at: new Date().toISOString(),
      };

      await saveObservation(newObservation);
      setObservations((previous) => [newObservation, ...previous]);
      setNoteText('');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, noteText]);

  const formatObservedAt = useCallback((isoDate: string) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
      return isoDate;
    }
    return date.toLocaleDateString();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={observations}
        keyExtractor={(item) => item.observation_id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <SurfaceCard variant="parent" style={styles.section}>
              <ThemedText role="parentTitle" style={styles.sectionTitle}>
                Game progress
              </ThemedText>
              {GAME_ORDER.map((gId) => {
                const progress = gameProgressMap[gId];
                const meta = GAME_META[gId];
                const currentLevel = progress?.current_level ?? 1;
                const highestUnlocked = progress?.highest_level_unlocked ?? 1;
                const lastAccuracy = progress ? Math.round(progress.last_session_accuracy * 100) : 0;
                const enabledCount = enabledCountByGame[gId] ?? 0;

                return (
                  <View key={gId} style={styles.gameCard}>
                    <ThemedText role="parentBody" style={styles.gameCardTitle}>
                      {meta.emoji} {meta.title}
                    </ThemedText>
                    <ThemedText role="parentLabel">Level {currentLevel}</ThemedText>
                    <ThemedText role="parentLabel">Highest unlocked: {highestUnlocked}</ThemedText>
                    <ThemedText role="parentLabel">Last session: {lastAccuracy}%</ThemedText>
                    <ThemedText role="parentLabel">Enabled concepts: {enabledCount}</ThemedText>
                  </View>
                );
              })}
            </SurfaceCard>

            <SurfaceCard variant="parent" style={styles.section}>
              <ThemedText role="parentTitle" style={styles.sectionTitle}>
                This week
              </ThemedText>
              <ThemedText role="parentBody">Practiced: {weeklyStats.totalPrompts} prompts</ThemedText>
              <ThemedText role="parentBody">Touch correct: {weeklyStats.touchCorrect}</ThemedText>
              <ThemedText role="parentBody">Speech matched: {weeklyStats.speechMatched}</ThemedText>
              <ThemedText role="parentBody">Support taps: {weeklyStats.supportUsed}</ThemedText>
            </SurfaceCard>

            <SurfaceCard variant="parent" style={styles.section}>
              <ThemedText role="parentTitle" style={styles.sectionTitle}>
                Target status
              </ThemedText>
              {formattedTargets.map((target) => (
                <ThemedText key={target.targetId} role="parentBody">
                  {target.label}: {target.statusLabel}
                </ThemedText>
              ))}
            </SurfaceCard>

            <SurfaceCard variant="parent" style={styles.section}>
              <ThemedText role="parentTitle" style={styles.sectionTitle}>
                Notes
              </ThemedText>
              <TextInput
                value={noteText}
                onChangeText={setNoteText}
                placeholder="Add an observation..."
                placeholderTextColor={parentTheme.textSoft}
                style={styles.input}
                multiline
              />
              <PillButton
                label={isSaving ? 'Saving...' : 'Add'}
                onPress={() => {
                  void addObservation();
                }}
                disabled={!noteText.trim() || isSaving}
                style={styles.addButton}
                variant="parent"
              />
            </SurfaceCard>

            <ThemedText role="parentTitle" style={styles.observationsTitle}>
              Observations
            </ThemedText>
          </>
        }
        ListEmptyComponent={
          <ThemedText role="parentBody" style={styles.emptyText}>
            No notes yet for this child.
          </ThemedText>
        }
        renderItem={({ item }) => (
          <SurfaceCard variant="parent" style={styles.observationRow}>
            <ThemedText role="parentBody">{item.note_text}</ThemedText>
            <ThemedText role="parentLabel">{formatObservedAt(item.observed_at)}</ThemedText>
          </SurfaceCard>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: parentTheme.background,
  },
  content: {
    paddingHorizontal: parentTheme.pagePadding,
    paddingVertical: 12,
    gap: 12,
    paddingBottom: 28,
  },
  section: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  gameCard: {
    borderTopWidth: 1,
    borderTopColor: parentTheme.outline,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 2,
  },
  gameCardTitle: {
    marginBottom: 2,
  },
  input: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: parentTheme.outline,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 10,
    color: parentTheme.text,
    backgroundColor: parentTheme.surfaceMuted,
  },
  addButton: {
    alignSelf: 'flex-start',
    minWidth: 132,
  },
  observationsTitle: {
    marginTop: 2,
  },
  emptyText: {
    color: parentTheme.textMuted,
  },
  observationRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
});
