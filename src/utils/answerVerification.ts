/**
 * Answer Verification Utilities
 *
 * Handles verification of user answers for Chinese character learning,
 * supporting various input formats and common variations.
 */

/**
 * Pinyin tone mark to tone number mapping
 * Maps accented characters to their base character + tone number
 */
const TONE_MARKS: Record<string, string> = {
  // Tone 1 (ā)
  'ā': 'a1', 'ē': 'e1', 'ī': 'i1', 'ō': 'o1', 'ū': 'u1', 'ǖ': 'v1',
  'Ā': 'a1', 'Ē': 'e1', 'Ī': 'i1', 'Ō': 'o1', 'Ū': 'u1', 'Ǖ': 'v1',

  // Tone 2 (á)
  'á': 'a2', 'é': 'e2', 'í': 'i2', 'ó': 'o2', 'ú': 'u2', 'ǘ': 'v2',
  'Á': 'a2', 'É': 'e2', 'Í': 'i2', 'Ó': 'o2', 'Ú': 'u2', 'Ǘ': 'v2',

  // Tone 3 (ǎ)
  'ǎ': 'a3', 'ě': 'e3', 'ǐ': 'i3', 'ǒ': 'o3', 'ǔ': 'u3', 'ǚ': 'v3',
  'Ǎ': 'a3', 'Ě': 'e3', 'Ǐ': 'i3', 'Ǒ': 'o3', 'Ǔ': 'u3', 'Ǚ': 'v3',

  // Tone 4 (à)
  'à': 'a4', 'è': 'e4', 'ì': 'i4', 'ò': 'o4', 'ù': 'u4', 'ǜ': 'v4',
  'À': 'a4', 'È': 'e4', 'Ì': 'i4', 'Ò': 'o4', 'Ù': 'u4', 'Ǜ': 'v4',

  // Neutral tone / Tone 5 (sometimes written)
  'a': 'a5', 'e': 'e5', 'i': 'i5', 'o': 'o5', 'u': 'u5', 'ü': 'v5',
};

/**
 * Converts pinyin with tone numbers to tone marks (for display)
 * Example: "ma1" -> "mā", "ni3" -> "nǐ"
 */
export function convertToneNumbersToMarks(pinyin: string): string {
  // Mapping of tone numbers to tone marks for each vowel
  const toneMap: Record<string, string[]> = {
    'a': ['a', 'ā', 'á', 'ǎ', 'à'],
    'e': ['e', 'ē', 'é', 'ě', 'è'],
    'i': ['i', 'ī', 'í', 'ǐ', 'ì'],
    'o': ['o', 'ō', 'ó', 'ǒ', 'ò'],
    'u': ['u', 'ū', 'ú', 'ǔ', 'ù'],
    'v': ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ'],
  };

  let result = pinyin.toLowerCase();

  // Process each syllable (find vowel + tone number pattern)
  // Match patterns like "ma1", "hao3", etc.
  result = result.replace(/([a-z]*?)([aeiouv]+)([a-z]*?)([1-5])/gi, (_match: string, prefix: string, vowels: string, suffix: string, tone: string) => {
    const toneNum = parseInt(tone);

    // Find which vowel gets the tone mark (pinyin tone mark rules)
    // Priority: a > e > o > (last vowel in "iu" or "ui") > other
    let markedVowels = vowels.toLowerCase();

    if (markedVowels.includes('a')) {
      markedVowels = markedVowels.replace('a', toneMap['a'][toneNum]);
    } else if (markedVowels.includes('e')) {
      markedVowels = markedVowels.replace('e', toneMap['e'][toneNum]);
    } else if (markedVowels.includes('o')) {
      markedVowels = markedVowels.replace('o', toneMap['o'][toneNum]);
    } else if (markedVowels.match(/iu|ui/)) {
      // For iu/ui, mark the second vowel
      markedVowels = markedVowels.replace(/([iu])([ui])/, (_m: string, v1: string, v2: string) => {
        const marked = toneMap[v2] ? toneMap[v2][toneNum] : v2;
        return v1 + marked;
      });
    } else if (markedVowels.includes('i')) {
      markedVowels = markedVowels.replace('i', toneMap['i'][toneNum]);
    } else if (markedVowels.includes('u')) {
      markedVowels = markedVowels.replace('u', toneMap['u'][toneNum]);
    } else if (markedVowels.includes('v')) {
      markedVowels = markedVowels.replace('v', toneMap['v'][toneNum]);
    }

    return prefix + markedVowels + suffix;
  });

  return result;
}

/**
 * Converts pinyin with tone marks to tone numbers
 * Example: "mā" -> "ma1", "nǐ" -> "ni3"
 */
export function convertToneMarksToNumbers(pinyin: string): string {
  let result = pinyin.toLowerCase();

  // Replace each tone mark with base letter + tone number
  for (const [toneMark, toneNumber] of Object.entries(TONE_MARKS)) {
    result = result.replace(new RegExp(toneMark, 'g'), toneNumber);
  }

  // Handle ü -> v conversion (common in pinyin input methods)
  result = result.replace(/ü/g, 'v');

  return result;
}

/**
 * Normalizes pinyin for comparison
 * - Converts to lowercase
 * - Trims whitespace
 * - Converts tone marks to tone numbers
 * - Removes spaces between syllables
 */
export function normalizePinyin(pinyin: string): string {
  let normalized = pinyin.trim().toLowerCase();

  // Convert tone marks to numbers
  normalized = convertToneMarksToNumbers(normalized);

  // Remove spaces between syllables for flexible matching
  // But preserve the string structure
  normalized = normalized.replace(/\s+/g, '');

  return normalized;
}

/**
 * Checks if two pinyin strings match
 * Handles tone marks, tone numbers, and case variations
 *
 * @param userAnswer - User's input
 * @param correctAnswer - Correct pinyin (may have multiple pronunciations separated by semicolons)
 * @returns true if answer matches any valid pronunciation
 */
export function verifyPinyin(userAnswer: string, correctAnswer: string): boolean {
  if (!userAnswer || !correctAnswer) return false;

  const normalizedUser = normalizePinyin(userAnswer);

  // Handle multiple valid pronunciations (separated by semicolons or slashes)
  const validPronunciations = correctAnswer
    .split(/[;/]/)
    .map(p => normalizePinyin(p.trim()));

  // Check if user's answer matches any valid pronunciation
  return validPronunciations.some(valid => normalizedUser === valid);
}

/**
 * Extracts keywords from a definition string
 * Splits on semicolons, commas, and "or" conjunctions
 * Removes common articles and prepositions
 */
export function extractKeywords(definition: string): string[] {
  const commonWords = new Set(['a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'for', 'with', 'by']);

  // Split on semicolons, commas, and "or"
  const parts = definition
    .toLowerCase()
    .split(/[;,]|\s+or\s+/)
    .map(part => part.trim())
    .filter(part => part.length > 0);

  // For each part, extract meaningful words
  const keywords: string[] = [];

  for (const part of parts) {
    // Remove parenthetical content
    const cleaned = part.replace(/\([^)]*\)/g, '').trim();

    // If nothing remains after removing parentheses, extract from inside parentheses
    // This handles characters like 了 that only have parenthetical definitions
    if (cleaned.length === 0) {
      const parentheticalMatch = part.match(/\(([^)]*)\)/);
      if (parentheticalMatch) {
        const insideParens = parentheticalMatch[1].trim();
        // Remove any classifier markers or pinyin inside brackets
        const cleanedParens = insideParens.replace(/\[[^\]]*\]/g, '').trim();
        if (cleanedParens.length > 0) {
          keywords.push(cleanedParens);
          const parenWords = cleanedParens
            .split(/\s+/)
            .filter(word => word.length > 0 && !commonWords.has(word));
          keywords.push(...parenWords);
        }
      }
      continue; // Skip to next part
    }

    // Split into words and filter out common words
    const words = cleaned
      .split(/\s+/)
      .filter(word => word.length > 0 && !commonWords.has(word));

    // Add the whole phrase as one keyword
    if (cleaned.length > 0) {
      keywords.push(cleaned);
    }

    // Also add individual significant words
    keywords.push(...words);
  }

  return [...new Set(keywords)]; // Remove duplicates
}

/**
 * Checks if user's definition answer matches the correct definition
 * Uses keyword-based matching to be flexible with phrasing
 *
 * @param userAnswer - User's input
 * @param correctDefinition - Correct definition
 * @returns true if answer contains key concepts from the definition
 */
export function verifyDefinition(userAnswer: string, correctDefinition: string): boolean {
  if (!userAnswer || !correctDefinition) return false;

  const normalizedUser = userAnswer.toLowerCase().trim();
  const normalizedCorrect = correctDefinition.toLowerCase().trim();

  // Empty answer is always wrong
  if (normalizedUser.length === 0) return false;

  // Extract keywords from the correct definition
  const keywords = extractKeywords(normalizedCorrect);

  // User answer must match at least one keyword (or vice versa)
  // This handles both:
  // - User typing a subset (e.g., "study" for "to study; to learn")
  // - User typing more (e.g., "to study hard" for "to study")
  const matches = keywords.some(keyword => {
    return normalizedUser.includes(keyword) || keyword.includes(normalizedUser);
  });

  return matches;
}

/**
 * Main verification function that routes to appropriate checker
 *
 * @param userAnswer - User's input
 * @param correctAnswer - Correct answer
 * @param questionType - Type of question ('pinyin' or 'definition')
 * @returns true if answer is correct
 */
export function verifyAnswer(
  userAnswer: string,
  correctAnswer: string,
  questionType: 'pinyin' | 'definition'
): boolean {
  if (questionType === 'pinyin') {
    return verifyPinyin(userAnswer, correctAnswer);
  } else {
    return verifyDefinition(userAnswer, correctAnswer);
  }
}

/**
 * Test helper to check various answer formats
 * Returns detailed result for debugging
 */
export function debugVerification(
  userAnswer: string,
  correctAnswer: string,
  questionType: 'pinyin' | 'definition'
): {
  isCorrect: boolean;
  normalizedUser: string;
  normalizedCorrect: string | string[];
  matched?: string;
} {
  if (questionType === 'pinyin') {
    const normalizedUser = normalizePinyin(userAnswer);
    const validPronunciations = correctAnswer
      .split(/[;/]/)
      .map(p => normalizePinyin(p.trim()));

    const matched = validPronunciations.find(valid => normalizedUser === valid);

    return {
      isCorrect: !!matched,
      normalizedUser,
      normalizedCorrect: validPronunciations,
      matched,
    };
  } else {
    const normalizedUser = userAnswer.toLowerCase().trim();
    const keywords = extractKeywords(correctAnswer);
    const matched = keywords.find(keyword =>
      normalizedUser.includes(keyword) || keyword.includes(normalizedUser)
    );

    return {
      isCorrect: !!matched,
      normalizedUser,
      normalizedCorrect: keywords,
      matched,
    };
  }
}
