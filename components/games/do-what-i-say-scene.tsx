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
  scene: ResolvedDoWhatISayScene | null;
  demoNonce: number;
  highlightTargetLabel?: string | null;
  onResolved: (resolution: DragResolution) => void;
}

const STAGE_HEIGHT = 320;
const ITEM_SIZE = 88;

export function DoWhatISayScene({
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

  const startPosition = useMemo(
    () => ({
      x: Math.max((stageWidth - ITEM_SIZE) / 2, 0),
      y: STAGE_HEIGHT - ITEM_SIZE - 28,
    }),
    [stageWidth]
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

    const targetX = correctTarget.x + (correctTarget.width - ITEM_SIZE) / 2 - startPosition.x;
    const targetY = correctTarget.y + (correctTarget.height - ITEM_SIZE) / 2 - startPosition.y;

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
  }, [demoNonce, isLocked, pan, scene, stageWidth, startPosition.x, startPosition.y, targetLayouts]);

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
    const targetX = targetLayout.x + (targetLayout.width - ITEM_SIZE) / 2 - startPosition.x;
    const targetY = targetLayout.y + (targetLayout.height - ITEM_SIZE) / 2 - startPosition.y;

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

    const centerX = startPosition.x + dx + ITEM_SIZE / 2;
    const centerY = startPosition.y + dy + ITEM_SIZE / 2;
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
      style={styles.canvas}
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
                target.kind === 'person' ? styles.personTargetCard : styles.placeTargetCard,
                isHighlighted && styles.targetCardHighlighted,
              ]}>
              <ThemedText style={styles.targetEmoji}>{target.emoji}</ThemedText>
              <ThemedText style={styles.targetLabel}>{target.label}</ThemedText>
            </View>
          );
        })}
      </View>

      <View style={styles.startZone}>
        <ThemedText style={styles.startZoneLabel}>{scene.startLabel}</ThemedText>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.draggableItem,
          {
            left: startPosition.x,
            top: startPosition.y,
            transform: pan.getTranslateTransform(),
          },
        ]}>
        <Pressable disabled={isLocked} style={styles.draggableInner}>
          <ThemedText style={styles.itemEmoji}>{scene.item.emoji}</ThemedText>
          <ThemedText style={styles.itemLabel}>{scene.item.label}</ThemedText>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    minHeight: STAGE_HEIGHT,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 217, 0.12)',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    marginBottom: 14,
  },
  targetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  targetCard: {
    width: '31%',
    minHeight: 116,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(74, 144, 217, 0.14)',
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  personTargetCard: {
    backgroundColor: 'rgba(234, 246, 255, 0.96)',
  },
  placeTargetCard: {
    backgroundColor: 'rgba(246, 249, 255, 0.96)',
  },
  targetCardHighlighted: {
    borderColor: '#4A90D9',
    backgroundColor: '#DCEEFE',
  },
  targetEmoji: {
    fontSize: 44,
    lineHeight: 50,
    marginBottom: 6,
  },
  targetLabel: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'center',
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
    borderColor: 'rgba(74, 144, 217, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startZoneLabel: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    color: '#4A6478',
  },
  draggableItem: {
    position: 'absolute',
    width: ITEM_SIZE,
    height: ITEM_SIZE,
  },
  draggableInner: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: '#4A90D9',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#1E3E5A',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  itemEmoji: {
    fontSize: 38,
    lineHeight: 42,
  },
  itemLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
