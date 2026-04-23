import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SurfaceCard } from '@/components/ui/app-primitives';
import { parentTheme } from '@/constants/semantic-theme';
import { getCorrectedAttempts } from '@/db';
import type { PromptAttempt } from '@/types';

interface CorrectionSummary {
  key: string;
  rawSpeechText: string;
  finalAnswer: string;
  count: number;
}

export default function CorrectionsScreen() {
  const [attempts, setAttempts] = useState<PromptAttempt[]>([]);

  const loadCorrections = useCallback(async () => {
    const correctedAttempts = await getCorrectedAttempts();
    setAttempts(correctedAttempts);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCorrections();
    }, [loadCorrections])
  );

  const groupedCorrections = useMemo<CorrectionSummary[]>(() => {
    const grouped = new Map<string, CorrectionSummary>();

    for (const attempt of attempts) {
      const rawSpeechText = attempt.raw_speech_text?.trim() || '(unknown)';
      const finalAnswer = attempt.final_interpreted_answer;
      const key = `${rawSpeechText}::${finalAnswer}`;

      const existing = grouped.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        grouped.set(key, {
          key,
          rawSpeechText,
          finalAnswer,
          count: 1,
        });
      }
    }

    return Array.from(grouped.values());
  }, [attempts]);

  return (
    <ThemedView style={styles.container}>
      {groupedCorrections.length === 0 ? (
        <ThemedView style={styles.emptyState}>
          <ThemedText role="parentTitle" style={styles.emptyTitle}>
            No corrections yet
          </ThemedText>
          <ThemedText role="parentBody" style={styles.emptySubtitle}>
            Speech corrections will appear here once voice input is enabled.
          </ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={groupedCorrections}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <SurfaceCard variant="parent" style={styles.row}>
              <ThemedText role="parentBody">
                {`"${item.rawSpeechText}" -> ${item.finalAnswer} (${item.count} ${item.count === 1 ? 'time' : 'times'})`}
              </ThemedText>
            </SurfaceCard>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: parentTheme.pagePadding,
    paddingVertical: 12,
    backgroundColor: parentTheme.background,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
    color: parentTheme.textMuted,
  },
  listContent: {
    gap: 10,
    paddingBottom: 24,
  },
  row: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
