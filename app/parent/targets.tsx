import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GAME_META, HOME_GAME_ORDER } from '@/data/constants';
import { getGameProgress, getTargets, updateTargetStatus } from '@/db';
import type { GameId, GameProgress, TargetConcept } from '@/types';

const GAME_ORDER: GameId[] = [...HOME_GAME_ORDER];

export default function TargetsScreen() {
  const [targets, setTargets] = useState<TargetConcept[]>([]);
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});
  const [gameProgressMap, setGameProgressMap] = useState<Record<string, GameProgress | null>>({});

  const loadTargets = useCallback(async () => {
    const [loadedTargets, ...progressRows] = await Promise.all([
      getTargets(),
      ...GAME_ORDER.map((gameId) => getGameProgress('child_01', gameId)),
    ]);
    setTargets(loadedTargets);
    const nextProgressMap = GAME_ORDER.reduce<Record<string, GameProgress | null>>((accumulator, gameId, index) => {
      accumulator[gameId] = progressRows[index] ?? null;
      return accumulator;
    }, {});
    setGameProgressMap(nextProgressMap);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTargets();
    }, [loadTargets])
  );

  const groupedTargets = useMemo(() => {
    const grouped: Record<GameId, TargetConcept[]> = {
      my_turn_your_turn: [],
      where_is_it: [],
      daily_phrase_practice: [],
      do_what_i_say: [],
      build_the_sentence: [],
      picture_questions: [],
      movement_search: [],
    };

    for (const target of targets) {
      grouped[target.game_id].push(target);
    }

    return grouped;
  }, [targets]);

  const handleToggle = useCallback(async (targetId: string, nextEnabled: boolean) => {
    const nextStatus = nextEnabled ? 'enabled' : 'later';
    setUpdatingIds((previous) => ({ ...previous, [targetId]: true }));

    try {
      await updateTargetStatus(targetId, nextStatus);
      setTargets((previous) =>
        previous.map((target) =>
          target.target_id === targetId
            ? {
                ...target,
                status: nextStatus,
              }
            : target
        )
      );
    } finally {
      setUpdatingIds((previous) => {
        const next = { ...previous };
        delete next[targetId];
        return next;
      });
    }
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {GAME_ORDER.map((gameId) => {
          const gameTargets = groupedTargets[gameId];
          const gameMeta = GAME_META[gameId];

          if (gameTargets.length === 0) {
            return null;
          }

          return (
            <View key={gameId} style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                {gameMeta.title}
              </ThemedText>
              <ThemedText style={styles.levelSubtitle}>
                Current level: {gameProgressMap[gameId]?.current_level ?? 1}
              </ThemedText>

              {gameTargets.map((target) => {
                const isEnabled = target.status === 'enabled';
                const isUpdating = Boolean(updatingIds[target.target_id]);

                return (
                  <View key={target.target_id} style={styles.targetRow}>
                    <View>
                      <ThemedText style={styles.targetLabel}>{target.label}</ThemedText>
                      <ThemedText style={styles.targetStatus}>
                        {isEnabled ? 'Enabled' : 'Later'}
                      </ThemedText>
                    </View>

                    <Switch
                      value={isEnabled}
                      onValueChange={(nextValue) => {
                        void handleToggle(target.target_id, nextValue);
                      }}
                      disabled={isUpdating}
                    />
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
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
    gap: 16,
  },
  section: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  targetLabel: {
    fontSize: 18,
    lineHeight: 22,
  },
  targetStatus: {
    fontSize: 14,
    lineHeight: 18,
    opacity: 0.7,
  },
  levelSubtitle: {
    fontSize: 14,
    lineHeight: 18,
    opacity: 0.7,
    marginBottom: 8,
  },
});
