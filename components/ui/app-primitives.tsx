import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { childShadow, childTheme, parentShadow, parentTheme } from '@/constants/semantic-theme';

type AppVariant = 'child' | 'parent';

interface SurfaceCardProps extends ViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: AppVariant;
}

interface PillButtonProps extends Omit<PressableProps, 'style'> {
  compact?: boolean;
  label: string;
  labelStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  variant?: AppVariant;
  tone?: 'primary' | 'secondary';
}

interface ProgressBarProps {
  compact?: boolean;
  current: number;
  total: number;
}

export function SurfaceCard({ children, style, variant = 'child', ...viewProps }: SurfaceCardProps) {
  const isChild = variant === 'child';

  return (
    <View
      {...viewProps}
      style={[
        styles.card,
        isChild ? styles.childCard : styles.parentCard,
        isChild ? childShadow : parentShadow,
        style,
      ]}>
      {children}
    </View>
  );
}

export function PillButton({
  accessibilityState,
  compact = false,
  disabled,
  label,
  labelStyle,
  style,
  tone = 'primary',
  variant = 'child',
  ...pressableProps
}: PillButtonProps) {
  const isChild = variant === 'child';
  const isPrimary = tone === 'primary';
  const isDisabled = disabled ?? false;

  return (
    <Pressable
      accessibilityState={{ ...accessibilityState, disabled: isDisabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        isChild
          ? isPrimary
            ? styles.childPrimaryButton
            : styles.childSecondaryButton
          : isPrimary
            ? styles.parentPrimaryButton
            : styles.parentSecondaryButton,
        isDisabled && styles.buttonDisabled,
        pressed && !isDisabled && styles.buttonPressed,
        style,
      ]}
      {...pressableProps}>
      <ThemedText
        role={isChild ? 'childButton' : 'parentButton'}
        style={[
          compact && styles.compactButtonText,
          isChild
            ? isPrimary
              ? styles.childPrimaryButtonText
              : styles.childSecondaryButtonText
            : isPrimary
              ? styles.parentPrimaryButtonText
              : styles.parentSecondaryButtonText,
          labelStyle,
        ]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function ProgressBar({ compact = false, current, total }: ProgressBarProps) {
  const progress = total > 0 ? Math.min(Math.max(current / total, 0), 1) : 0;

  return (
    <View style={[styles.progressTrack, compact && styles.progressTrackCompact]}>
      <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  childCard: {
    borderRadius: childTheme.radiusLg,
    backgroundColor: childTheme.surface,
    borderColor: childTheme.outline,
  },
  parentCard: {
    borderRadius: parentTheme.radiusMd,
    backgroundColor: parentTheme.surface,
    borderColor: parentTheme.outline,
  },
  button: {
    minHeight: childTheme.tapTarget,
    borderRadius: childTheme.radiusPill,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonCompact: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  childPrimaryButton: {
    backgroundColor: childTheme.primary,
    borderColor: childTheme.primary,
    ...childShadow,
  },
  childSecondaryButton: {
    backgroundColor: childTheme.surfaceRaised,
    borderColor: childTheme.outline,
  },
  parentPrimaryButton: {
    minHeight: parentTheme.tapTarget,
    backgroundColor: parentTheme.primary,
    borderColor: parentTheme.primary,
  },
  parentSecondaryButton: {
    minHeight: parentTheme.tapTarget,
    backgroundColor: parentTheme.surfaceMuted,
    borderColor: parentTheme.outline,
  },
  buttonPressed: {
    transform: [{ translateY: 1.5 }, { scale: 0.985 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  compactButtonText: {
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
  },
  childPrimaryButtonText: {
    color: childTheme.onPrimary,
  },
  childSecondaryButtonText: {
    color: childTheme.text,
  },
  parentPrimaryButtonText: {
    color: parentTheme.onPrimary,
  },
  parentSecondaryButtonText: {
    color: parentTheme.text,
  },
  progressTrack: {
    height: 18,
    borderRadius: childTheme.radiusPill,
    backgroundColor: childTheme.surfaceBright,
    overflow: 'hidden',
  },
  progressTrackCompact: {
    height: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: childTheme.radiusPill,
    backgroundColor: childTheme.primary,
  },
});
