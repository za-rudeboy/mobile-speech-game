import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { childTheme } from '@/constants/semantic-theme';
import { ResolvedWhereIsItScene } from '@/data/content/where-is-it-scenes';

export function WhereIsItScene({
  compact = false,
  scene,
}: {
  compact?: boolean;
  scene: ResolvedWhereIsItScene | null;
}) {
  if (!scene) {
    return (
      <View style={[styles.whereSceneCanvas, compact && styles.whereSceneCanvasCompact]}>
        <View style={[styles.whereSceneStage, compact && styles.whereSceneStageCompact]}>
          <ThemedText role="childBody" style={styles.wherePlaceholderText}>
            Image unavailable
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.whereSceneCanvas, compact && styles.whereSceneCanvasCompact]}>
      <View
        style={[
          styles.whereSceneStage,
          styles.whereImageStage,
          compact && styles.whereSceneStageCompact,
          compact && styles.whereImageStageCompact,
        ]}>
        <Image
          source={scene.imageSource}
          style={[
            styles.whereSceneImage,
            compact && styles.whereSceneImageCompact,
            { aspectRatio: scene.aspectRatio },
          ]}
          contentFit="contain"
          accessibilityLabel={`${scene.subject.label} ${scene.relation} ${scene.anchor.label}`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  whereSceneCanvas: {
    minHeight: 176,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  whereSceneCanvasCompact: {
    minHeight: 142,
    marginBottom: 8,
  },
  whereSceneStage: {
    width: '100%',
    minHeight: 164,
    borderRadius: childTheme.radiusMd,
    backgroundColor: childTheme.surfaceRaised,
    borderWidth: 1,
    borderColor: childTheme.outline,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  whereSceneStageCompact: {
    minHeight: 132,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  whereImageStage: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  whereImageStageCompact: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  whereSceneImage: {
    width: '100%',
    maxHeight: 188,
  },
  whereSceneImageCompact: {
    maxHeight: 146,
  },
  wherePlaceholderText: {
    textAlign: 'center',
    color: childTheme.textMuted,
  },
});
