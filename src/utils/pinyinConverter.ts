import { pinyin } from 'pinyin-pro';

/**
 * Strip Chinese and English punctuation from text
 * Removes: 。，！？：；""''（）、·…
 */
function stripPunctuation(text: string): string {
  // Remove Chinese punctuation: 。，！？：；""''（）、·…
  // Remove English punctuation: . , ! ? : ; " ' ( ) - ...
  return text.replace(/[。，！？：；""''（）、·….,!?:;"'()\-]/g, '').trim();
}

/**
 * Convert Chinese characters (hanzi) to pinyin with tone numbers
 *
 * @param hanzi - Chinese characters to convert
 * @returns Pinyin with tone numbers (e.g., "ni3 hao3")
 *
 * @example
 * hanziToPinyin("你好") // Returns "ni3 hao3"
 * hanziToPinyin("是") // Returns "shi4"
 * hanziToPinyin("我。") // Returns "wo3" (punctuation stripped)
 */
export function hanziToPinyin(hanzi: string): string {
  if (!hanzi || hanzi.trim().length === 0) {
    return '';
  }

  // Strip punctuation before conversion (STT often adds periods)
  const cleanedHanzi = stripPunctuation(hanzi);

  if (!cleanedHanzi) {
    return '';
  }

  // Convert to pinyin with tone numbers
  // toneType: 'num' gives us tone numbers (ni3 hao3)
  // type: 'string' returns a string (default)
  const result = pinyin(cleanedHanzi, {
    toneType: 'num',
    type: 'string',
  });

  console.log(`[PINYIN] Converted "${hanzi}" → "${cleanedHanzi}" → "${result}"`);
  return result.toLowerCase().trim();
}

/**
 * Compare two pinyin strings for pronunciation equality
 * Normalizes spacing and handles multi-character words
 * Treats tone 0 and tone 5 as equivalent (both = neutral tone)
 *
 * @param pinyin1 - First pinyin string
 * @param pinyin2 - Second pinyin string
 * @returns True if pinyins match (pronunciation is the same)
 *
 * @example
 * comparePinyin("ni3 hao3", "ni3hao3") // Returns true (spacing doesn't matter)
 * comparePinyin("shi4", "shi4") // Returns true (exact match)
 * comparePinyin("de0", "de5") // Returns true (both are neutral tone)
 * comparePinyin("shi4", "si4") // Returns false (different pronunciation)
 */
export function comparePinyin(pinyin1: string, pinyin2: string): boolean {
  // Normalize: lowercase, remove extra spaces, remove all spaces for comparison
  // Also normalize neutral tones: convert tone 5 to tone 0
  const normalize = (p: string) => {
    const lowercaseNoSpaces = p.toLowerCase().replace(/\s+/g, '');
    // Replace tone 5 with tone 0 (both mean neutral tone)
    return lowercaseNoSpaces.replace(/5/g, '0');
  };

  const normalized1 = normalize(pinyin1);
  const normalized2 = normalize(pinyin2);

  const match = normalized1 === normalized2;

  console.log(`[PINYIN COMPARE] "${pinyin1}" vs "${pinyin2}" → ${match}`);
  console.log(`[PINYIN COMPARE] Normalized: "${normalized1}" vs "${normalized2}"`);

  return match;
}

/**
 * Normalize pinyin string (remove spaces, lowercase)
 * Useful for consistent comparisons
 */
export function normalizePinyin(pinyin: string): string {
  return pinyin.toLowerCase().replace(/\s+/g, '');
}

/**
 * Check if text contains primarily Chinese characters
 * Used to detect poor speech recognition (e.g., "Vol" instead of "我")
 */
export function isChineseText(text: string): boolean {
  if (!text) return false;

  // Remove punctuation first
  const cleaned = stripPunctuation(text);
  if (!cleaned) return false;

  // Check if at least one character is in the Chinese Unicode range
  // Chinese characters: \u4e00-\u9fff (CJK Unified Ideographs)
  const chineseRegex = /[\u4e00-\u9fff]/;
  return chineseRegex.test(cleaned);
}
