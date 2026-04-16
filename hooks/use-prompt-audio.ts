import { useIsFocused } from '@react-navigation/native';
import { useAudioPlayer, useAudioPlayerStatus, type AudioSource } from 'expo-audio';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
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
  const playbackTokenRef = useRef(0);
  const trimmedFallbackText = fallbackText?.trim() ?? '';
  const hasRecordedAudio = audioSource !== undefined && audioSource !== null;
  const isAvailable = enabled && (hasRecordedAudio || trimmedFallbackText.length > 0);
  const isReadyToAutoPlay = hasRecordedAudio ? status.isLoaded : trimmedFallbackText.length > 0;
  const canAutoPlayInCurrentContext = autoPlay && Platform.OS !== 'web';

  async function stop() {
    playbackTokenRef.current += 1;
    setIsSpeakingFallback(false);
    Speech.stop();

    if (!player.playing && player.currentTime <= 0) {
      return;
    }

    player.pause();

    try {
      await player.seekTo(0);
    } catch {
      // Ignore seek failures for unloaded or already-reset players.
    }
  }

  async function play() {
    const playbackToken = playbackTokenRef.current + 1;
    playbackTokenRef.current = playbackToken;

    if (!enabled) {
      await stop();
      return false;
    }

    Speech.stop();

    if (hasRecordedAudio) {
      setIsSpeakingFallback(false);
      player.pause();

      try {
        await player.seekTo(0);
      } catch {
        // The first replay can happen before the asset has fully loaded.
      }

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

    setIsSpeakingFallback(true);

    Speech.speak(trimmedFallbackText, {
      pitch: 1,
      rate: 0.85,
      onDone: () => {
        if (playbackTokenRef.current === playbackToken) {
          setIsSpeakingFallback(false);
        }
      },
      onError: () => {
        if (playbackTokenRef.current === playbackToken) {
          setIsSpeakingFallback(false);
        }
      },
      onStopped: () => {
        if (playbackTokenRef.current === playbackToken) {
          setIsSpeakingFallback(false);
        }
      },
    });

    return true;
  }

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
    return () => {
      void stop();
    };
  }, []);

  return {
    isAvailable,
    isLoading: hasRecordedAudio ? !status.isLoaded : false,
    isPlaying: hasRecordedAudio ? status.playing : isSpeakingFallback,
    play,
    stop,
  };
}
