import * as Haptics from 'expo-haptics';
import { usePreferences } from '../contexts/PreferencesContext';

/**
 * Wraps expo-haptics so every call site respects the user's Haptic
 * Feedback preference instead of firing unconditionally.
 */
export function useHaptics() {
  const { prefs } = usePreferences();
  const enabled = prefs.hapticFeedback;

  const impact = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    if (enabled) Haptics.impactAsync(style);
  };

  const notification = (type: Haptics.NotificationFeedbackType) => {
    if (enabled) Haptics.notificationAsync(type);
  };

  return { impact, notification };
}
