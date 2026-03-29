import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
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
                    <ThemedText style={styles.gameCardTitle}>
                      {meta.emoji} {meta.title}
                    </ThemedText>
                    <ThemedText style={styles.gameCardStat}>Level {currentLevel}</ThemedText>
                    <ThemedText style={styles.gameCardStat}>
                      Highest unlocked: {highestUnlocked}
                    </ThemedText>
                    <ThemedText style={styles.gameCardStat}>
                      Last session: {lastAccuracy}%
                    </ThemedText>
                    <ThemedText style={styles.gameCardStat}>
                      Enabled concepts: {enabledCount}
                    </ThemedText>
                  </View>
                );
              })}
            </View>

            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                This week
              </ThemedText>
              <ThemedText style={styles.statText}>Practiced: {weeklyStats.totalPrompts} prompts</ThemedText>
              <ThemedText style={styles.statText}>Touch correct: {weeklyStats.touchCorrect}</ThemedText>
              <ThemedText style={styles.statText}>Speech matched: {weeklyStats.speechMatched}</ThemedText>
              <ThemedText style={styles.statText}>Support taps: {weeklyStats.supportUsed}</ThemedText>
            </View>

            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Target status
              </ThemedText>
              {formattedTargets.map((target) => (
                <ThemedText key={target.targetId} style={styles.targetText}>
                  {target.label}: {target.statusLabel}
                </ThemedText>
              ))}
            </View>

            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Notes
              </ThemedText>
              <TextInput
                value={noteText}
                onChangeText={setNoteText}
                placeholder="Add an observation..."
                style={styles.input}
                multiline
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  void addObservation();
                }}
                style={({ pressed }) => [
                  styles.addButton,
                  (!noteText.trim() || isSaving) && styles.addButtonDisabled,
                  pressed && styles.addButtonPressed,
                ]}
                disabled={!noteText.trim() || isSaving}>
                <ThemedText style={styles.addButtonText}>{isSaving ? 'Saving...' : 'Add'}</ThemedText>
              </Pressable>
            </View>

            <ThemedText type="subtitle" style={styles.observationsTitle}>
              Observations
            </ThemedText>
          </>
        }
        ListEmptyComponent={
          <ThemedText style={styles.emptyText}>No notes yet for this child.</ThemedText>
        }
        renderItem={({ item }) => (
          <ThemedView style={styles.observationRow}>
            <ThemedText style={styles.observationNote}>{item.note_text}</ThemedText>
            <ThemedText style={styles.observationDate}>{formatObservedAt(item.observed_at)}</ThemedText>
          </ThemedView>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    paddingBottom: 28,
  },
  section: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  sectionTitle: {
    marginBottom: 6,
  },
  gameCard: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    paddingBottom: 4,
    gap: 2,
  },
  gameCardTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  gameCardStat: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.85,
  },
  statText: {
    fontSize: 18,
    lineHeight: 24,
  },
  targetText: {
    fontSize: 16,
    lineHeight: 22,
  },
  input: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  addButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9CA3AF',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  addButtonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  observationsTitle: {
    marginTop: 2,
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 22,
    opacity: 0.7,
  },
  observationRow: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  observationNote: {
    fontSize: 16,
    lineHeight: 22,
  },
  observationDate: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 18,
    opacity: 0.75,
  },
});
