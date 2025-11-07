import { invoke } from '@tauri-apps/api/core';

export type OSPlatform = 'windows' | 'macos' | 'linux' | 'unknown';

/**
 * Gets the current operating system platform
 * Uses user agent detection as a reliable cross-platform method
 */
export function getOSPlatform(): OSPlatform {
  try {
    // Use navigator.userAgent for platform detection
    const ua = navigator.userAgent.toLowerCase();
    const platform = navigator.platform?.toLowerCase() || '';

    console.log('[OS] User Agent:', ua);
    console.log('[OS] Platform:', platform);

    // Check platform first (more reliable)
    if (platform.includes('win')) {
      console.log('[OS] Detected: Windows');
      return 'windows';
    }
    if (platform.includes('mac')) {
      console.log('[OS] Detected: macOS');
      return 'macos';
    }
    if (platform.includes('linux')) {
      console.log('[OS] Detected: Linux');
      return 'linux';
    }

    // Fallback to user agent
    if (ua.includes('win')) {
      console.log('[OS] Detected via UA: Windows');
      return 'windows';
    }
    if (ua.includes('mac')) {
      console.log('[OS] Detected via UA: macOS');
      return 'macos';
    }
    if (ua.includes('linux') || ua.includes('x11')) {
      console.log('[OS] Detected via UA: Linux');
      return 'linux';
    }

    console.warn('[OS] Could not detect platform');
    return 'unknown';
  } catch (error) {
    console.error('[OS] Failed to detect platform:', error);
    return 'unknown';
  }
}

/**
 * Opens system settings to the appropriate language/voice installation page
 * Platform-specific implementation
 */
export async function openLanguageSettings(): Promise<void> {
  const os = getOSPlatform();

  try {
    switch (os) {
      case 'windows':
        await openWindowsLanguageSettings();
        break;
      case 'macos':
        await openMacOSVoiceSettings();
        break;
      case 'linux':
        // Linux doesn't have a universal settings URI
        showLinuxInstructions();
        break;
      default:
        showGenericInstructions();
    }
  } catch (error) {
    console.error('[Settings] Failed to open settings:', error);
    showPlatformInstructions(os);
  }
}

/**
 * Opens Windows Language Settings
 */
async function openWindowsLanguageSettings(): Promise<void> {
  // Windows 10/11 Settings URI for Language & Region page
  const settingsUri = 'ms-settings:regionlanguage';

  await invoke('plugin:shell|open', {
    path: settingsUri
  });

  console.log('[Settings] Opened Windows Language Settings');
}

/**
 * Opens macOS Voice Settings
 */
async function openMacOSVoiceSettings(): Promise<void> {
  // macOS System Preferences URI for Accessibility → Speech
  // Note: This may vary by macOS version
  const settingsUri = 'x-apple.systempreferences:com.apple.preference.universalaccess?Seeing_VoiceOver';

  await invoke('plugin:shell|open', {
    path: settingsUri
  });

  console.log('[Settings] Opened macOS Voice Settings');
}

/**
 * Shows Linux-specific instructions (no universal settings URI)
 */
function showLinuxInstructions(): void {
  alert(
    'Linux TTS Setup:\n\n' +
    'Install Chinese voices using your package manager:\n\n' +
    'Ubuntu/Debian:\n' +
    '  sudo apt install espeak-ng-data-cmn\n\n' +
    'Fedora:\n' +
    '  sudo dnf install espeak-ng-chinese\n\n' +
    'Arch:\n' +
    '  sudo pacman -S espeak-ng\n\n' +
    'Then restart the application.'
  );
}

/**
 * Shows generic instructions when OS is unknown
 */
function showGenericInstructions(): void {
  alert(
    'To enable Chinese pronunciation:\n\n' +
    '1. Open your system Settings\n' +
    '2. Navigate to Language or Accessibility settings\n' +
    '3. Install Chinese (Simplified) language pack\n' +
    '4. Enable Text-to-Speech for Chinese\n' +
    '5. Restart this application'
  );
}

/**
 * Shows platform-specific manual instructions
 */
function showPlatformInstructions(os: OSPlatform): void {
  switch (os) {
    case 'windows':
      alert(
        'Windows TTS Setup:\n\n' +
        '1. Press Win + I to open Settings\n' +
        '2. Go to Time & Language → Language & Region\n' +
        '3. Click "Add a language"\n' +
        '4. Search for and select "Chinese (Simplified, China)"\n' +
        '5. Check "Text-to-speech" and click Install\n' +
        '6. Restart the application'
      );
      break;
    case 'macos':
      alert(
        'macOS TTS Setup:\n\n' +
        '1. Open System Preferences (or System Settings)\n' +
        '2. Go to Accessibility → Spoken Content\n' +
        '3. Click "System Voice" dropdown\n' +
        '4. Select "Customize..."\n' +
        '5. Find and download Chinese voices (Ting-Ting, Sin-Ji, or Mei-Jia)\n' +
        '6. Restart the application'
      );
      break;
    case 'linux':
      showLinuxInstructions();
      break;
    default:
      showGenericInstructions();
  }
}

/**
 * Checks if Chinese TTS voices are available
 */
export function hasChineseVoices(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  const voices = window.speechSynthesis.getVoices();
  return voices.some(voice => voice.lang.startsWith('zh'));
}

/**
 * Gets the first available Chinese voice
 */
export function getChineseVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  const zhVoices = voices.filter(voice => voice.lang.startsWith('zh'));

  // Prefer zh-CN (Mandarin from China)
  const preferredVoice = zhVoices.find(v => v.lang === 'zh-CN');

  return preferredVoice || zhVoices[0] || null;
}
