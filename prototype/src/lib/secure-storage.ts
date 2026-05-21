/**
 * Secure Storage Abstraction for Fincore.AI
 *
 * PURPOSE: Provides a unified API for storing sensitive user data (UUIDs, tokens)
 * that works across web and native iOS environments.
 *
 * WEB IMPLEMENTATION:
 * - Uses localStorage with base64 obfuscation (btoa/atob)
 * - NOT true encryption - prevents casual dev tools inspection only
 * - All keys prefixed with '__fincore_secure_' to avoid collisions
 *
 * iOS IMPLEMENTATION (future):
 * - Swap this module for @capacitor-community/secure-storage-plugin
 * - Will use iOS Keychain for true hardware-backed encryption
 * - API is async to match native plugin signatures
 *
 * MIGRATION:
 * - Automatically migrates legacy unobfuscated keys (fincore_user_id, etc.)
 * - Old keys are deleted after successful migration
 *
 * USAGE:
 *   await SecureStorage.setItem('user_id', 'uuid-here');
 *   const userId = await SecureStorage.getItem('user_id');
 *   await SecureStorage.removeItem('user_id');
 */

const STORAGE_PREFIX = '__fincore_secure_';

// Simple obfuscation (NOT encryption - for casual inspection prevention only)
function obfuscate(value: string): string {
  if (typeof window === 'undefined') return value;
  return btoa(encodeURIComponent(value));
}

function deobfuscate(value: string): string {
  if (typeof window === 'undefined') return value;
  try {
    return decodeURIComponent(atob(value));
  } catch {
    return value; // Fallback for unobfuscated legacy values
  }
}

export const SecureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_PREFIX + key, obfuscate(value));
  },

  async getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    // Also check legacy unobfuscated key for migration
    if (!raw) {
      const legacyKey = key === 'user_id' ? 'fincore_user_id' :
                        key === 'onboarding_completed' ? 'fincore_onboarding_completed' : key;
      const legacy = localStorage.getItem(legacyKey);
      if (legacy) {
        // Migrate to new format
        await SecureStorage.setItem(key, legacy);
        localStorage.removeItem(legacyKey);
        return legacy;
      }
      return null;
    }
    return deobfuscate(raw);
  },

  async removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_PREFIX + key);
  },

  // For iOS bridge - implement later
  async isSecureStorageAvailable(): Promise<boolean> {
    // TODO: Check for Capacitor SecureStorage plugin
    return false; // Web fallback
  }
};
