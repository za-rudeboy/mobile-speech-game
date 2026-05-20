import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { childTheme } from '@/constants/semantic-theme';
import { ResolvedStoryStepsScene } from '@/data/content/story-steps-scenes';

export function StoryStepsScene({
  compact = false,
  disabled = false,
  highlightedCardId,
  onSelect,
  scene,
}: {
  compact?: boolean;
  disabled?: boolean;
  highlightedCardId?: string | null;
  onSelect: (cardId: string) => void;
  scene: ResolvedStoryStepsScene | null;
}) {
  if (!scene) {
    return null;
  }

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      {scene.cards.map((card) => {
        const isHighlighted = highlightedCardId === card.id;

        return (
          <Pressable
            key={card.id}
            accessibilityRole="button"
            accessibilityLabel={card.accessibilityLabel}
            disabled={disabled}
            onPress={() => onSelect(card.id)}
            style={({ pressed }) => [
              styles.card,
              compact && styles.cardCompact,
              isHighlighted && styles.cardHighlighted,
              pressed && !disabled && styles.cardPressed,
            ]}>
            <Image
              source={card.imageSource}
              style={[styles.image, { aspectRatio: card.aspectRatio }]}
              contentFit="cover"
            />
            <View style={styles.cardFooter}>
              <ThemedText role="childLabel" style={[styles.cardLabel, compact && styles.cardLabelCompact]}>
                {card.label}
              </ThemedText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  rowCompact: {
    gap: 8,
    marginBottom: 8,
  },
  card: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: childTheme.radiusMd,
    borderWidth: 2,
    borderColor: childTheme.outline,
    backgroundColor: childTheme.surfaceRaised,
  },
  cardCompact: {
    borderRadius: 20,
  },
  cardHighlighted: {
    borderColor: childTheme.primary,
    backgroundColor: '#223648',
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ translateY: 1.5 }, { scale: 0.99 }],
  },
  image: {
    width: '100%',
  },
  cardFooter: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    minHeight: 60,
    justifyContent: 'center',
  },
  cardLabel: {
    textAlign: 'center',
    color: childTheme.text,
  },
  cardLabelCompact: {
    fontSize: 15,
    lineHeight: 20,
  },
});
