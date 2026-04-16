# Audio Playback Pattern

Use `usePromptAudio` for child-facing playback on a single screen.

## Preferred order
- Provide a recorded `audioSource` when a screen has a curated clip.
- Provide `fallbackText` when that screen still needs `expo-speech` during migration.
- Set `autoPlay: true` only on screens that should speak once after the screen is ready.
- On web, browsers can block autoplay with sound, so this hook only auto-plays on native and keeps replay manual on web.
- Pass `enabled` from `useGameStore((state) => state.speechEnabled)`.

## UI pattern
- Use `AudioReplayButton` for explicit replay instead of autoplay.
- Stop playback before pushing to another route when the current screen owns the audio interaction.

## Example

```tsx
const promptAudio = usePromptAudio({
  audioSource: require('../assets/audio/example.mp3'),
  fallbackText: 'Example fallback',
  enabled: speechEnabled,
});

<AudioReplayButton
  accessibilityLabel="Replay example audio"
  isLoading={promptAudio.isLoading}
  isPlaying={promptAudio.isPlaying}
  label="Listen again"
  onPress={() => {
    void promptAudio.play();
  }}
/>;
```
