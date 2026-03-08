import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getObservations, getTargets, getWeeklyStats, saveObservation } from '@/db';
import type { ParentObservation, TargetConcept } from '@/types';

export default function ProgressScreen() {
  const [weeklyStats, setWeeklyStats] = useState({
    totalPrompts: 0,
    touchCorrect: 0,
    speechMatched: 0,
  });
  const [targets, setTargets] = useState<TargetConcept[]>([]);
  const [observations, setObservations] = useState<ParentObservation[]>([]);
  const [noteText, setNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadProgressData = useCallback(async () => {
    const [stats, loadedObservations, loadedTargets] = await Promise.all([
      getWeeklyStats(),
      getObservations('child_01'),
      getTargets(),
    ]);

    setWeeklyStats(stats);
    setObservations(loadedObservations);
    setTargets(loadedTargets);
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
                This week
              </ThemedText>
              <ThemedText style={styles.statText}>Practiced: {weeklyStats.totalPrompts} prompts</ThemedText>
              <ThemedText style={styles.statText}>Touch correct: {weeklyStats.touchCorrect}</ThemedText>
              <ThemedText style={styles.statText}>Speech matched: {weeklyStats.speechMatched}</ThemedText>
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
