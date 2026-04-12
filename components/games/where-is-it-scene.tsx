import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ResolvedWhereIsItScene } from '@/data/content/where-is-it-scenes';

export function WhereIsItScene({ scene }: { scene: ResolvedWhereIsItScene | null }) {
  if (!scene) {
    return (
      <View style={styles.whereSceneCanvas}>
        <View style={styles.whereSceneStage}>
          <ThemedText style={styles.whereAnchorEmoji}>📍</ThemedText>
        </View>
      </View>
    );
  }

  if (scene.kind === 'image') {
    return (
      <View style={styles.whereSceneCanvas}>
        <View style={[styles.whereSceneStage, styles.whereImageStage]}>
          <Image
            source={scene.imageSource}
            style={styles.whereSceneImage}
            contentFit="contain"
            accessibilityLabel={`${scene.subject.label} ${scene.relation} ${scene.anchor.label}`}
          />
        </View>
      </View>
    );
  }

  const relation = scene.relation.toLowerCase();
  const distractorStyles = [
    styles.whereDistractorTopLeft,
    styles.whereDistractorTopRight,
    styles.whereDistractorBottomLeft,
    styles.whereDistractorBottomRight,
  ];

  if (relation === 'next to') {
    return (
      <View style={styles.whereSceneCanvas}>
        <View style={styles.whereSceneStage}>
          {scene.distractors.map((item, index) => (
            <View
              key={`${scene.recipeKey}-distractor-${item.label}-${index}`}
              style={[styles.whereDistractorBubble, distractorStyles[index % distractorStyles.length]]}>
              <ThemedText style={styles.whereDistractorEmoji}>{item.emoji}</ThemedText>
            </View>
          ))}
          <View style={styles.wherePairSceneRow}>
            <View style={styles.whereFocusBubble}>
              <ThemedText style={styles.wherePrimaryEmojiInline}>{scene.subject.emoji}</ThemedText>
            </View>
            <View style={styles.whereFocusBubble}>
              <ThemedText style={styles.whereAnchorEmojiInline}>{scene.anchor.emoji}</ThemedText>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.whereSceneCanvas}>
      <View style={styles.whereSceneStage}>
        {scene.distractors.map((item, index) => (
          <View
            key={`${scene.recipeKey}-distractor-${item.label}-${index}`}
            style={[styles.whereDistractorBubble, distractorStyles[index % distractorStyles.length]]}>
            <ThemedText style={styles.whereDistractorEmoji}>{item.emoji}</ThemedText>
          </View>
        ))}
        <ThemedText style={styles.whereAnchorEmoji}>{scene.anchor.emoji}</ThemedText>
        <ThemedText
          style={[
            styles.wherePrimaryEmoji,
            relation === 'in' && styles.wherePrimaryIn,
            relation === 'on' && styles.wherePrimaryOn,
            relation === 'under' && styles.wherePrimaryUnder,
          ]}>
          {scene.subject.emoji}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  whereSceneCanvas: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  whereSceneStage: {
    width: '100%',
    minHeight: 168,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 217, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  whereImageStage: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  whereSceneImage: {
    width: '100%',
    aspectRatio: 1408 / 768,
    maxHeight: 200,
  },
  whereAnchorEmoji: {
    fontSize: 84,
    lineHeight: 92,
  },
  whereAnchorEmojiInline: {
    fontSize: 76,
    lineHeight: 84,
  },
  wherePrimaryEmoji: {
    fontSize: 60,
    lineHeight: 66,
    position: 'absolute',
  },
  wherePrimaryIn: {
    top: 56,
  },
  wherePrimaryOn: {
    top: 14,
  },
  wherePrimaryUnder: {
    top: 106,
  },
  wherePairSceneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  wherePrimaryEmojiInline: {
    fontSize: 70,
    lineHeight: 78,
  },
  whereFocusBubble: {
    minWidth: 96,
    minHeight: 96,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  whereDistractorBubble: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whereDistractorEmoji: {
    fontSize: 28,
    lineHeight: 32,
  },
  whereDistractorTopLeft: {
    top: 16,
    left: 14,
  },
  whereDistractorTopRight: {
    top: 16,
    right: 14,
  },
  whereDistractorBottomLeft: {
    bottom: 14,
    left: 14,
  },
  whereDistractorBottomRight: {
    bottom: 14,
    right: 14,
  },
});
