import { useIsFocused } from '@react-navigation/native';
import { useAudioPlayer, useAudioPlayerStatus, type AudioSource } from 'expo-audio';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

const PLAYER_OPTIONS = {
  downloadFirst: true,
  updateInterval: 150,
} as const;

export interface PromptAudioConfig {
  audioSource?: AudioSource;
  autoPlay?: boolean;
  fallbackText?: string;
  enabled: boolean;
}

export interface PromptAudioController {
  isAvailable: boolean;
  isLoading: boolean;
  isPlaying: boolean;
  play: () => Promise<boolean>;
  stop: () => Promise<void>;
}

export function usePromptAudio({
  audioSource,
  autoPlay = false,
  fallbackText,
  enabled,
}: PromptAudioConfig): PromptAudioController {
  const isFocused = useIsFocused();
  const player = useAudioPlayer(audioSource ?? null, PLAYER_OPTIONS);
  const status = useAudioPlayerStatus(player);
  const [isSpeakingFallback, setIsSpeakingFallback] = useState(false);
  const autoPlayArmedRef = useRef(true);
  const isMountedRef = useRef(true);
  const latestStatusRef = useRef(status);
  const playbackTokenRef = useRef(0);
  const trimmedFallbackText = fallbackText?.trim() ?? '';
  const hasRecordedAudio = audioSource !== undefined && audioSource !== null;
  const isAvailable = enabled && (hasRecordedAudio || trimmedFallbackText.length > 0);
  const isReadyToAutoPlay = hasRecordedAudio ? status.isLoaded : trimmedFallbackText.length > 0;
  const canAutoPlayInCurrentContext = autoPlay && Platform.OS !== 'web';

  const setFallbackSpeaking = useCallback((nextValue: boolean) => {
    if (isMountedRef.current) {
      setIsSpeakingFallback(nextValue);
    }
  }, []);

  const resetRecordedAudio = useCallback(async () => {
    const currentStatus = latestStatusRef.current;

    if (!currentStatus.isLoaded && !currentStatus.playing && currentStatus.currentTime <= 0) {
      return;
    }

    try {
      player.pause();
    } catch {
      return;
    }

    try {
      await player.seekTo(0);
    } catch {
      // Ignore seek failures for unloaded, released, or already-reset players.
    }
  }, [player]);

  const stop = useCallback(async () => {
    playbackTokenRef.current += 1;
    setFallbackSpeaking(false);
    Speech.stop();

    if (!hasRecordedAudio) {
      return;
    }

    await resetRecordedAudio();
  }, [hasRecordedAudio, resetRecordedAudio, setFallbackSpeaking]);

  const play = useCallback(async () => {
    const playbackToken = playbackTokenRef.current + 1;
    playbackTokenRef.current = playbackToken;

    if (!enabled) {
      await stop();
      return false;
    }

    Speech.stop();

    if (hasRecordedAudio) {
      setFallbackSpeaking(false);
      await resetRecordedAudio();

      if (playbackTokenRef.current !== playbackToken) {
        return false;
      }

      try {
        player.play();
        return true;
      } catch (error) {
        console.warn('Audio playback did not start automatically.', error);
        return false;
      }
    }

    if (!trimmedFallbackText) {
      return false;
    }

    setFallbackSpeaking(true);

    Speech.speak(trimmedFallbackText, {
      pitch: 1,
      rate: 0.85,
      onDone: () => {
        if (playbackTokenRef.current === playbackToken) {
          setFallbackSpeaking(false);
        }
      },
      onError: () => {
        if (playbackTokenRef.current === playbackToken) {
          setFallbackSpeaking(false);
        }
      },
      onStopped: () => {
        if (playbackTokenRef.current === playbackToken) {
          setFallbackSpeaking(false);
        }
      },
    });

    return true;
  }, [
    enabled,
    hasRecordedAudio,
    resetRecordedAudio,
    setFallbackSpeaking,
    stop,
    trimmedFallbackText,
  ]);

  useEffect(() => {
    latestStatusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (!enabled || !isFocused) {
      void stop();
    }
  }, [enabled, isFocused]);

  useEffect(() => {
    if (!isFocused) {
      autoPlayArmedRef.current = true;
      return;
    }

    if (
      !canAutoPlayInCurrentContext ||
      !enabled ||
      !isAvailable ||
      !isReadyToAutoPlay ||
      !autoPlayArmedRef.current
    ) {
      return;
    }

    autoPlayArmedRef.current = false;
    void play();
  }, [canAutoPlayInCurrentContext, enabled, isAvailable, isFocused, isReadyToAutoPlay]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      playbackTokenRef.current += 1;
      Speech.stop();

      if (!hasRecordedAudio) {
        return;
      }

      try {
        player.pause();
      } catch {
        // Ignore cleanup failures after the native object has already been released.
      }
    };
  }, [hasRecordedAudio, player]);

  return {
    isAvailable,
    isLoading: hasRecordedAudio ? !status.isLoaded : false,
    isPlaying: hasRecordedAudio ? status.playing : isSpeakingFallback,
    play,
    stop,
  };
}
