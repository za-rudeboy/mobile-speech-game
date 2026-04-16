import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface AudioReplayButtonProps {
  accessibilityLabel: string;
  disabled?: boolean;
  isLoading?: boolean;
  isPlaying?: boolean;
  label: string;
  onPress: () => void;
}

export function AudioReplayButton({
  accessibilityLabel,
  disabled = false,
  isLoading = false,
  isPlaying = false,
  label,
  onPress,
}: AudioReplayButtonProps) {
  const tintColor = useThemeColor({ light: '#4A90D9', dark: '#5FA8F5' }, 'tint');
  const borderColor = useThemeColor({ light: '#BFD6EC', dark: '#33506C' }, 'text');
  const surfaceColor = useThemeColor({ light: '#FFFFFF', dark: '#1F2428' }, 'background');
  const bodyTextColor = useThemeColor({ light: '#5F6870', dark: '#BDC4CB' }, 'text');
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
        {
          backgroundColor: surfaceColor,
          borderColor: inactive ? borderColor : tintColor,
        },
        (pressed || inactive) && styles.buttonPressed,
      ]}>
      <View style={[styles.iconBadge, { backgroundColor: tintColor }]}>
        <ThemedText style={styles.iconText}>{isPlaying ? '||' : '▶'}</ThemedText>
      </View>
      <View style={styles.copy}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        <ThemedText style={[styles.status, { color: bodyTextColor }]}>
          {isLoading ? 'Loading audio...' : isPlaying ? 'Playing now' : 'Tap to replay'}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 72,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '700',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
  status: {
    fontSize: 14,
    lineHeight: 18,
  },
});
