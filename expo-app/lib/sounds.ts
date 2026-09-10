import { useEffect } from 'react';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { usePreferences } from '../contexts/PreferencesContext';

/**
 * UI sound effects. Mirrors lib/haptics.ts: every play function checks the
 * user's Sound Effects preference first and early-returns when it is off, so
 * call sites never need their own gating.
 *
 * Players are module-level singletons created once and reused, so the files
 * are decoded on first use rather than on every mount. Volumes are set per
 * clip because the source files differ in loudness by ~14 dB (toggle click
 * is the hottest, message-send the quietest); the targets are subtle UI
 * cues, not alerts.
 */
type SoundName = 'send' | 'capture' | 'toggle' | 'success';

const SOUND_SOURCES: Record<SoundName, { source: number; volume: number }> = {
  send: { source: require('../assets/sounds/message-send-.mp3'), volume: 0.7 },
  capture: { source: require('../assets/sounds/camera-13695.mp3'), volume: 0.6 },
  toggle: { source: require('../assets/sounds/toggle-click.mp3'), volume: 0.4 },
  success: { source: require('../assets/sounds/success-chime.mp3'), volume: 0.5 },
};

let players: Record<SoundName, AudioPlayer> | null = null;
let audioModeConfigured = false;

function ensurePlayers(): Record<SoundName, AudioPlayer> {
  if (players) return players;

  if (!audioModeConfigured) {
    audioModeConfigured = true;
    // Respect the hardware silent switch (playsInSilentMode: false) and don't
    // interrupt the user's music/podcast for a 400ms click.
    setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
  }

  players = Object.fromEntries(
    (Object.keys(SOUND_SOURCES) as SoundName[]).map((name) => {
      const { source, volume } = SOUND_SOURCES[name];
      const player = createAudioPlayer(source);
      player.volume = volume;
      return [name, player];
    })
  ) as Record<SoundName, AudioPlayer>;

  return players;
}

function playSound(name: SoundName) {
  try {
    const player = ensurePlayers()[name];
    // Rewind so rapid repeat taps restart the clip instead of being ignored
    // while the previous playback is still finishing.
    player.seekTo(0).catch(() => {});
    player.play();
  } catch (e) {
    // Sound is a nicety; never let it break an interaction.
    if (__DEV__) console.warn(`Sound "${name}" failed to play:`, e);
  }
}

interface PlayOptions {
  /** Bypass the preference check. Used only by the Sound Effects toggle itself
   *  so enabling it gives audible confirmation (same reasoning as haptics). */
  force?: boolean;
}

export function useSounds() {
  const { prefs } = usePreferences();
  const enabled = prefs.soundEffects;

  // Preload on first mount of any consumer so the first tap isn't delayed
  // by decoding. Cheap no-op after the first call.
  useEffect(() => {
    if (enabled) ensurePlayers();
  }, [enabled]);

  const gated = (name: SoundName) => (opts?: PlayOptions) => {
    if (!enabled && !opts?.force) return;
    playSound(name);
  };

  return {
    playSend: gated('send'),
    playCapture: gated('capture'),
    playToggle: gated('toggle'),
    playSuccess: gated('success'),
  };
}
