/**
 * Haptic Feedback Utility for Fincore.AI
 *
 * Uses navigator.vibrate() as a web fallback.
 * When wrapped in Capacitor/React Native, the native layer can intercept
 * these calls and trigger real haptic feedback on iOS.
 *
 * Pattern durations are designed to feel natural on mobile:
 * - light: quick tap feedback (button press)
 * - medium: confirmation feedback (successful action)
 * - heavy: emphasis feedback (important action)
 * - success: positive completion pattern
 * - error: warning/error pattern
 */

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection';

// Vibration patterns (in milliseconds)
const PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 20],
  error: [20, 100, 20, 100, 20],
  selection: 5,
};

/**
 * Check if haptic feedback is available
 */
export function isHapticsAvailable(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for Capacitor Haptics plugin (for future iOS support)
  if ((window as unknown as { Capacitor?: { Plugins?: { Haptics?: unknown } } }).Capacitor?.Plugins?.Haptics) {
    return true;
  }

  // Check for native vibrate support
  return 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback
 *
 * @param style - The type of haptic feedback to trigger
 * @returns true if haptic was triggered, false if not available
 */
export function haptic(style: HapticStyle = 'light'): boolean {
  if (typeof window === 'undefined') return false;

  // Try Capacitor Haptics first (for iOS)
  const capacitorHaptics = (window as unknown as { Capacitor?: { Plugins?: { Haptics?: {
    notification: (opts: { type: string }) => void;
    selectionStart: () => void;
    selectionEnd: () => void;
    impact: (opts: { style: string }) => void;
  } } } }).Capacitor?.Plugins?.Haptics;
  if (capacitorHaptics) {
    try {
      // Map our styles to Capacitor's ImpactStyle
      const impactMap: Record<HapticStyle, string> = {
        light: 'LIGHT',
        medium: 'MEDIUM',
        heavy: 'HEAVY',
        success: 'MEDIUM',
        error: 'HEAVY',
        selection: 'LIGHT',
      };

      if (style === 'success') {
        capacitorHaptics.notification({ type: 'SUCCESS' });
      } else if (style === 'error') {
        capacitorHaptics.notification({ type: 'ERROR' });
      } else if (style === 'selection') {
        capacitorHaptics.selectionStart();
        capacitorHaptics.selectionEnd();
      } else {
        capacitorHaptics.impact({ style: impactMap[style] });
      }
      return true;
    } catch (e) {
      console.warn('[Haptics] Capacitor haptics failed:', e);
    }
  }

  // Fallback to web vibration API
  if ('vibrate' in navigator) {
    try {
      const pattern = PATTERNS[style];
      navigator.vibrate(pattern);
      return true;
    } catch {
      // Vibration not allowed (e.g., user gesture required)
      return false;
    }
  }

  return false;
}

/**
 * Convenience methods
 */
export const Haptics = {
  light: () => haptic('light'),
  medium: () => haptic('medium'),
  heavy: () => haptic('heavy'),
  success: () => haptic('success'),
  error: () => haptic('error'),
  selection: () => haptic('selection'),
  isAvailable: isHapticsAvailable,
};

export default Haptics;
