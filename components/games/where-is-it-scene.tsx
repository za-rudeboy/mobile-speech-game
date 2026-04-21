import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ResolvedWhereIsItScene } from '@/data/content/where-is-it-scenes';

export function WhereIsItScene({ scene }: { scene: ResolvedWhereIsItScene | null }) {
  if (!scene) {
    return (
      <View style={styles.whereSceneCanvas}>
        <View style={styles.whereSceneStage}>
          <ThemedText style={styles.wherePlaceholderText}>Image unavailable</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.whereSceneCanvas}>
      <View style={[styles.whereSceneStage, styles.whereImageStage]}>
        <Image
          source={scene.imageSource}
          style={[styles.whereSceneImage, { aspectRatio: scene.aspectRatio }]}
          contentFit="contain"
          accessibilityLabel={`${scene.subject.label} ${scene.relation} ${scene.anchor.label}`}
        />
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
    maxHeight: 220,
  },
  wherePlaceholderText: {
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '600',
  },
});
