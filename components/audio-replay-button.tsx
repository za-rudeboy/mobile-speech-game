import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { childShadow, childTheme } from '@/constants/semantic-theme';

interface AudioReplayButtonProps {
  accessibilityLabel: string;
  compact?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  isPlaying?: boolean;
  label: string;
  onPress: () => void;
}

export function AudioReplayButton({
  accessibilityLabel,
  compact = false,
  disabled = false,
  isLoading = false,
  isPlaying = false,
  label,
  onPress,
}: AudioReplayButtonProps) {
  const inactive = disabled || isLoading;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ busy: isLoading, disabled: inactive }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        inactive ? styles.buttonInactive : styles.buttonActive,
        (pressed || inactive) && styles.buttonPressed,
      ]}>
      <View style={[styles.iconBadge, compact && styles.iconBadgeCompact]}>
        <ThemedText style={[styles.iconText, compact && styles.iconTextCompact]}>
          {isPlaying ? '||' : '▶'}
        </ThemedText>
      </View>
      <View style={styles.copy}>
        <ThemedText role="childLabel" style={[styles.label, compact && styles.labelCompact]}>
          {label}
        </ThemedText>
        <ThemedText role="childBody" style={[styles.status, compact && styles.statusCompact]}>
          {isLoading ? 'Loading audio...' : isPlaying ? 'Playing now' : 'Tap to replay'}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: childTheme.tapTarget,
    borderRadius: childTheme.radiusMd,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: childTheme.surface,
    ...childShadow,
  },
  buttonCompact: {
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  buttonActive: {
    borderColor: childTheme.primary,
  },
  buttonInactive: {
    borderColor: childTheme.outline,
  },
  buttonPressed: {
    opacity: 0.82,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: childTheme.radiusPill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: childTheme.primary,
  },
  iconBadgeCompact: {
    width: 38,
    height: 38,
  },
  iconText: {
    color: childTheme.onPrimary,
    fontSize: 18,
    lineHeight: 20,
  },
  iconTextCompact: {
    fontSize: 16,
    lineHeight: 18,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: childTheme.textMuted,
  },
  labelCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  status: {
    color: childTheme.text,
  },
  statusCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
});
