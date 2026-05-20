import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { childShadow, childTheme } from '@/constants/semantic-theme';
import { ResolvedDoWhatISayScene } from '@/data/content/do-what-i-say-scenes';

interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DragResolution {
  targetLabel: string;
  wasCorrect: boolean;
}

interface DoWhatISaySceneProps {
  compact?: boolean;
  scene: ResolvedDoWhatISayScene | null;
  demoNonce: number;
  highlightTargetLabel?: string | null;
  onResolved: (resolution: DragResolution) => void;
}

const STAGE_HEIGHT = 320;
const ITEM_SIZE = 88;

export function DoWhatISayScene({
  compact = false,
  scene,
  demoNonce,
  highlightTargetLabel,
  onResolved,
}: DoWhatISaySceneProps) {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [stageWidth, setStageWidth] = useState(0);
  const [targetLayouts, setTargetLayouts] = useState<Record<string, LayoutRect>>({});
  const [activeTargetLabel, setActiveTargetLabel] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const itemSize = compact ? 72 : ITEM_SIZE;
  const stageHeight = compact ? 252 : STAGE_HEIGHT;

  const startPosition = useMemo(
    () => ({
      x: Math.max((stageWidth - itemSize) / 2, 0),
      y: stageHeight - itemSize - (compact ? 22 : 28),
    }),
    [compact, itemSize, stageHeight, stageWidth]
  );

  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
    setTargetLayouts({});
    setActiveTargetLabel(null);
    setIsLocked(false);
  }, [pan, scene?.recipeKey]);

  useEffect(() => {
    if (!scene || demoNonce === 0) {
      return;
    }

    const correctTarget = targetLayouts[scene.correctTargetLabel];
    if (!correctTarget || stageWidth === 0 || isLocked) {
      return;
    }

    const targetX = correctTarget.x + (correctTarget.width - itemSize) / 2 - startPosition.x;
    const targetY = correctTarget.y + (correctTarget.height - itemSize) / 2 - startPosition.y;

    setIsLocked(true);
    setActiveTargetLabel(scene.correctTargetLabel);
    Animated.sequence([
      Animated.timing(pan, {
        toValue: { x: targetX, y: targetY },
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.delay(250),
      Animated.timing(pan, {
        toValue: { x: 0, y: 0 },
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(() => {
      setActiveTargetLabel(null);
      setIsLocked(false);
    });
  }, [
    demoNonce,
    isLocked,
    itemSize,
    pan,
    scene,
    stageWidth,
    startPosition.x,
    startPosition.y,
    targetLayouts,
  ]);

  const resetDrag = () => {
    Animated.timing(pan, {
      toValue: { x: 0, y: 0 },
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      setActiveTargetLabel(null);
      setIsLocked(false);
    });
  };

  const animateSuccess = (targetLabel: string, targetLayout: LayoutRect) => {
    const targetX = targetLayout.x + (targetLayout.width - itemSize) / 2 - startPosition.x;
    const targetY = targetLayout.y + (targetLayout.height - itemSize) / 2 - startPosition.y;

    setIsLocked(true);
    setActiveTargetLabel(targetLabel);
    Animated.timing(pan, {
      toValue: { x: targetX, y: targetY },
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      onResolved({ targetLabel, wasCorrect: true });
    });
  };

  const resolveDrop = (dx: number, dy: number) => {
    if (!scene) {
      return;
    }

    const centerX = startPosition.x + dx + itemSize / 2;
    const centerY = startPosition.y + dy + itemSize / 2;
    const matchedTarget = scene.targets.find((target) => {
      const layout = targetLayouts[target.label];
      if (!layout) {
        return false;
      }

      return (
        centerX >= layout.x &&
        centerX <= layout.x + layout.width &&
        centerY >= layout.y &&
        centerY <= layout.y + layout.height
      );
    });

    if (!matchedTarget) {
      setIsLocked(true);
      resetDrag();
      return;
    }

    const targetLayout = targetLayouts[matchedTarget.label];
    if (!targetLayout) {
      setIsLocked(true);
      resetDrag();
      return;
    }

    if (matchedTarget.label === scene.correctTargetLabel) {
      animateSuccess(matchedTarget.label, targetLayout);
      return;
    }

    setIsLocked(true);
    setActiveTargetLabel(scene.correctTargetLabel);
    Animated.timing(pan, {
      toValue: { x: 0, y: 0 },
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      setIsLocked(false);
      onResolved({ targetLabel: matchedTarget.label, wasCorrect: false });
    });
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !isLocked,
    onMoveShouldSetPanResponder: () => !isLocked,
    onPanResponderGrant: () => {
      setActiveTargetLabel(null);
    },
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
      useNativeDriver: false,
    }),
    onPanResponderRelease: (_, gestureState) => {
      resolveDrop(gestureState.dx, gestureState.dy);
    },
    onPanResponderTerminate: () => {
      setIsLocked(true);
      resetDrag();
    },
  });

  const updateTargetLayout =
    (label: string) =>
    ({ nativeEvent }: LayoutChangeEvent) => {
      const { layout } = nativeEvent;
      setTargetLayouts((current) => ({
        ...current,
        [label]: layout,
      }));
    };

  if (!scene) {
    return null;
  }

  return (
    <View
      style={[
        styles.canvas,
        compact && styles.canvasCompact,
        { minHeight: stageHeight },
      ]}
      onLayout={({ nativeEvent }) => {
        setStageWidth(nativeEvent.layout.width);
      }}>
      <View style={styles.targetGrid}>
        {scene.targets.map((target) => {
          const isHighlighted =
            target.label === activeTargetLabel || target.label === highlightTargetLabel;

          return (
            <View
              key={target.label}
              onLayout={updateTargetLayout(target.label)}
              style={[
                styles.targetCard,
                compact && styles.targetCardCompact,
                target.kind === 'person' ? styles.personTargetCard : styles.placeTargetCard,
                isHighlighted && styles.targetCardHighlighted,
              ]}>
              <ThemedText style={[styles.targetEmoji, compact && styles.targetEmojiCompact]}>
                {target.emoji}
              </ThemedText>
              <ThemedText style={[styles.targetLabel, compact && styles.targetLabelCompact]}>
                {target.label}
              </ThemedText>
            </View>
          );
        })}
      </View>

      <View style={[styles.startZone, compact && styles.startZoneCompact]}>
        <ThemedText style={[styles.startZoneLabel, compact && styles.startZoneLabelCompact]}>
          {scene.startLabel}
        </ThemedText>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.draggableItem,
          compact && styles.draggableItemCompact,
          {
            left: startPosition.x,
            top: startPosition.y,
            width: itemSize,
            height: itemSize,
            transform: pan.getTranslateTransform(),
          },
        ]}>
        <Pressable disabled={isLocked} style={[styles.draggableInner, compact && styles.draggableInnerCompact]}>
          <ThemedText style={[styles.itemEmoji, compact && styles.itemEmojiCompact]}>
            {scene.item.emoji}
          </ThemedText>
          <ThemedText style={[styles.itemLabel, compact && styles.itemLabelCompact]}>
            {scene.item.label}
          </ThemedText>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    borderRadius: childTheme.radiusMd,
    backgroundColor: childTheme.surfaceRaised,
    borderWidth: 1,
    borderColor: childTheme.outline,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    marginBottom: 14,
  },
  canvasCompact: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
    marginBottom: 8,
  },
  targetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  targetCard: {
    width: '31%',
    minHeight: 108,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: childTheme.outline,
    backgroundColor: childTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  targetCardCompact: {
    minHeight: 86,
    borderRadius: 18,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  personTargetCard: {
    backgroundColor: '#202935',
  },
  placeTargetCard: {
    backgroundColor: '#1d242d',
  },
  targetCardHighlighted: {
    borderColor: childTheme.primary,
    backgroundColor: '#274055',
  },
  targetEmoji: {
    fontSize: 40,
    lineHeight: 46,
    marginBottom: 4,
  },
  targetEmojiCompact: {
    fontSize: 30,
    lineHeight: 34,
  },
  targetLabel: {
    fontSize: 17,
    lineHeight: 20,
    textAlign: 'center',
    color: childTheme.text,
  },
  targetLabelCompact: {
    fontSize: 14,
    lineHeight: 17,
  },
  startZone: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
    height: 92,
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#53718a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startZoneCompact: {
    left: 18,
    right: 18,
    bottom: 18,
    height: 68,
  },
  startZoneLabel: {
    fontSize: 16,
    lineHeight: 20,
    color: childTheme.textSoft,
  },
  startZoneLabelCompact: {
    fontSize: 14,
    lineHeight: 18,
  },
  draggableItem: {
    position: 'absolute',
    width: ITEM_SIZE,
    height: ITEM_SIZE,
  },
  draggableItemCompact: {
    width: 72,
    height: 72,
  },
  draggableInner: {
    flex: 1,
    borderRadius: childTheme.radiusMd,
    backgroundColor: childTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...childShadow,
  },
  draggableInnerCompact: {
    gap: 2,
  },
  itemEmoji: {
    fontSize: 38,
    lineHeight: 42,
  },
  itemEmojiCompact: {
    fontSize: 30,
    lineHeight: 34,
  },
  itemLabel: {
    color: childTheme.onPrimary,
    fontSize: 16,
    lineHeight: 20,
    textTransform: 'capitalize',
  },
  itemLabelCompact: {
    fontSize: 13,
    lineHeight: 16,
  },
});
