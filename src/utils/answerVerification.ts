/**
 * Answer Verification Utilities
 *
 * Handles verification of user answers for Chinese character learning,
 * supporting various input formats and common variations.
 */

/**
 * Pinyin tone mark to tone number mapping
 * Maps ONLY accented characters to their base character + tone number
 * Unaccented vowels are NOT included (they don't get a tone number)
 */
const TONE_MARKS: Record<string, string> = {
  // Tone 1 (ā)
  'ā': 'a1', 'ē': 'e1', 'ī': 'i1', 'ō': 'o1', 'ū': 'u1', 'ǖ': 'v1',
  'Ā': 'A1', 'Ē': 'E1', 'Ī': 'I1', 'Ō': 'O1', 'Ū': 'U1', 'Ǖ': 'V1',

  // Tone 2 (á)
  'á': 'a2', 'é': 'e2', 'í': 'i2', 'ó': 'o2', 'ú': 'u2', 'ǘ': 'v2',
  'Á': 'A2', 'É': 'E2', 'Í': 'I2', 'Ó': 'O2', 'Ú': 'U2', 'Ǘ': 'V2',

  // Tone 3 (ǎ)
  'ǎ': 'a3', 'ě': 'e3', 'ǐ': 'i3', 'ǒ': 'o3', 'ǔ': 'u3', 'ǚ': 'v3',
  'Ǎ': 'A3', 'Ě': 'E3', 'Ǐ': 'I3', 'Ǒ': 'O3', 'Ǔ': 'U3', 'Ǚ': 'V3',

  // Tone 4 (à)
  'à': 'a4', 'è': 'e4', 'ì': 'i4', 'ò': 'o4', 'ù': 'u4', 'ǜ': 'v4',
  'À': 'A4', 'È': 'E4', 'Ì': 'I4', 'Ò': 'O4', 'Ù': 'U4', 'Ǜ': 'V4',
};

/**
 * Converts pinyin with tone numbers to tone marks (for display)
 * Example: "ma1" -> "mā", "ni3" -> "nǐ", "ni3hao3" -> "nǐhǎo"
 *
 * Strategy: Split into syllables, apply tone marks to each syllable independently.
 * A syllable is identified as: consonant(s) + vowel cluster + optional consonant(s) + tone number
 *
 * Important:
 * - Only the FIRST tone number in each syllable is applied
 * - If a syllable has an accented vowel, ignore tone numbers for that syllable only
 * - Syllable boundaries reset the accent flag (allows multi-syllable: yāona1 -> yāonā)
 * Example: "jiao34" -> "jiǎo" (3 is applied, 4 is ignored)
 * Example: "yāo2" -> "yāo" (accent exists in this syllable, 2 is ignored)
 * Example: "yāona1" -> "yāonā" (yāo has accent, but na1 is new syllable)
 * Example: "yāonā3" -> "yāonā" (both syllables have accents, 3 is ignored)
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

  // All accented vowels (to detect if already has tone mark)
  const accentedVowels = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/;

  let input = pinyin.toLowerCase().trim();
  if (!input) return '';

  // Split by spaces to handle multi-word pinyin (e.g., "ni3 hao3")
  const words = input.split(/\s+/);
  const processedWords = words.map(word => {
    let result = '';
    let i = 0;
    let hasAccentInCurrentSyllable = false; // Track if current syllable already has accent

    while (i < word.length) {
      // Try to match a syllable with tone number(s)
      // Pattern: optional consonants + vowel cluster + optional consonants + tone number(s)
      // Note: We capture ALL tone numbers but only use the first one
      const syllableMatch = word.slice(i).match(/^([bcdfghjklmnpqrstwxyz]*)([aeiouv]+)([bcdfghjklmnpqrstwxyzng]*)([1-5]+)/i);

      if (syllableMatch && !hasAccentInCurrentSyllable) {
        const [fullMatch, consonantPrefix, vowelCluster, consonantSuffix, toneStr] = syllableMatch;
        const toneNum = parseInt(toneStr[0]); // Only take the FIRST tone number!

        // Tone 5 (neutral tone) - don't add mark, just remove the number
        if (toneNum === 5) {
          result += consonantPrefix + vowelCluster + consonantSuffix;
        } else {
          // Apply tone mark to the vowel cluster according to pinyin rules
          // Priority: a > o > e > (second vowel in "iu" or "ui") > i > u > ü
          let markedVowels = vowelCluster.toLowerCase();

          if (markedVowels.includes('a')) {
            // Mark 'a' - always takes precedence
            markedVowels = markedVowels.replace('a', toneMap['a'][toneNum]);
          } else if (markedVowels.includes('o')) {
            // Mark 'o' - second priority
            markedVowels = markedVowels.replace('o', toneMap['o'][toneNum]);
          } else if (markedVowels.includes('e')) {
            // Mark 'e' - third priority
            markedVowels = markedVowels.replace('e', toneMap['e'][toneNum]);
          } else if (markedVowels === 'iu') {
            // Special case: 'iu' - mark the 'u'
            markedVowels = 'i' + toneMap['u'][toneNum];
          } else if (markedVowels === 'ui') {
            // Special case: 'ui' - mark the 'i'
            markedVowels = 'u' + toneMap['i'][toneNum];
          } else if (markedVowels.includes('i')) {
            // Mark 'i' when it appears alone or as first vowel
            markedVowels = markedVowels.replace('i', toneMap['i'][toneNum]);
          } else if (markedVowels.includes('u')) {
            // Mark 'u'
            markedVowels = markedVowels.replace('u', toneMap['u'][toneNum]);
          } else if (markedVowels.includes('v')) {
            // Mark 'v' (ü)
            markedVowels = markedVowels.replace('v', toneMap['v'][toneNum]);
          }

          result += consonantPrefix + markedVowels + consonantSuffix;
        }

        // Reset flag for next syllable
        hasAccentInCurrentSyllable = false;
        i += fullMatch.length;
      } else {
        // No tone number found - just copy character as-is
        // But check if it's already an accented vowel (don't add tone number)
        const char = word[i];
        if (accentedVowels.test(char)) {
          // Already has tone mark - set flag and skip ALL following tone numbers
          hasAccentInCurrentSyllable = true;
          result += char;
          let j = i + 1;
          while (j < word.length && /[1-5]/.test(word[j])) {
            j++; // Skip all tone numbers after accented vowel
          }
          i = j - 1; // -1 because the loop will increment
        } else if (/[1-5]/.test(char)) {
          // Stray tone number without a vowel OR after an accented vowel - ignore it
          // This handles cases where user types multiple tone numbers
        } else {
          // Regular character (consonant or unaccented vowel)
          result += char;

          // Check if this character marks a syllable boundary
          // Reset accent flag when we encounter a consonant after vowels
          const prevChar = i > 0 ? word[i - 1] : '';
          const isVowel = /[aeiouv]/i.test(char);
          const isPrevVowel = /[aeiouv]/i.test(prevChar) || accentedVowels.test(prevChar);

          // If we're at a consonant after vowels, we're starting a new syllable
          if (!isVowel && isPrevVowel) {
            hasAccentInCurrentSyllable = false;
          }
        }
        i++;
      }
    }

    return result;
  });

  return processedWords.join('');
}

/**
 * Converts pinyin with tone marks to tone numbers
 * Example: "mā" -> "ma1", "nǐ" -> "ni3", "jiǎo" -> "jiao3", "ma" -> "ma5"
 *
 * Strategy: Scan through the string looking for accented vowels.
 * When found, replace with base vowel and track the tone.
 * Append the tone number at the end of the vowel cluster.
 * If a syllable has no accent AND no existing tone number, append tone 5 (neutral tone).
 *
 * Key: Syllables with accents get their tone number, unaccented syllables get tone 5!
 * IMPORTANT: If input already has tone numbers (e.g., "ren2"), leave them unchanged!
 */
export function convertToneMarksToNumbers(pinyin: string): string {
  if (!pinyin) return '';

  let result = '';
  const input = pinyin.trim();
  const vowels = new Set(['a', 'e', 'i', 'o', 'u', 'v', 'ü', 'A', 'E', 'I', 'O', 'U', 'V', 'Ü']);
  const consonants = new Set(['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'w', 'x', 'y', 'z']);

  let i = 0;
  let currentSyllable = '';
  let currentTone = ''; // Store tone to be appended at syllable end

  const finishSyllable = () => {
    if (currentSyllable) {
      result += currentSyllable;
      // Append the tone number if we have one
      if (currentTone) {
        result += currentTone;
      } else {
        // If syllable has vowels but no tone mark AND no existing tone number, it's tone 5 (neutral)
        const hasVowel = [...currentSyllable].some(c => vowels.has(c));
        const hasToneNumber = /[1-5]$/.test(currentSyllable);
        if (hasVowel && !hasToneNumber) {
          result += '5';
        }
      }
      currentSyllable = '';
      currentTone = '';
    }
  };

  while (i < input.length) {
    const char = input[i];

    // Space or dash = syllable boundary
    if (char === ' ' || char === '-') {
      finishSyllable();
      i++;
      continue;
    }

    // Check if this is an accented vowel
    const toneInfo = TONE_MARKS[char];
    if (toneInfo) {
      // This is an accented vowel
      const baseLetter = toneInfo[0].toLowerCase();
      const toneNumber = toneInfo[1];

      // Store the tone number to be added at the end of the syllable
      currentTone = toneNumber;

      // Add the base letter
      currentSyllable += baseLetter;

      // Look ahead: collect any remaining vowels in this cluster
      let j = i + 1;
      while (j < input.length && vowels.has(input[j]) && input[j] !== ' ' && input[j] !== '-') {
        const nextChar = input[j];

        // Check if next vowel is also accented
        const nextToneInfo = TONE_MARKS[nextChar];
        if (nextToneInfo) {
          // Another accented vowel - just add the base letter
          currentSyllable += nextToneInfo[0].toLowerCase();
        } else if (nextChar === 'ü' || nextChar === 'Ü') {
          currentSyllable += 'v';
        } else {
          currentSyllable += nextChar.toLowerCase();
        }
        j++;
      }

      i = j;
    } else if (char === 'ü' || char === 'Ü') {
      // Handle unaccented ü -> v conversion
      currentSyllable += 'v';
      i++;
    } else if (/[1-5]/.test(char)) {
      // Tone number found - store it to be added at syllable end
      currentTone = char;
      // Tone number typically ends a syllable (unless followed by more tone numbers)
      // Peek ahead to see if we should finish
      if (i + 1 >= input.length || (input[i + 1] !== ' ' && input[i + 1] !== '-' && /[bcdfghjklmnpqrstwxyz]/i.test(input[i + 1]))) {
        // Next is a consonant (start of new syllable) or end of string
        finishSyllable();
      }
      i++;
    } else {
      // Regular character (consonant or unaccented vowel)
      const lowerChar = char.toLowerCase();

      // Check if we're starting a new syllable (consonant after vowels)
      if (currentSyllable && vowels.has(currentSyllable[currentSyllable.length - 1]) && consonants.has(lowerChar)) {
        // Special case: 'ng' and 'n' at end of syllable are part of the same syllable
        if (!(lowerChar === 'n' || lowerChar === 'g')) {
          finishSyllable();
        }
      }

      currentSyllable += lowerChar;
      i++;
    }
  }

  // Don't forget the last syllable
  finishSyllable();

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

  // Debug logging
  console.log('[verifyPinyin] User:', userAnswer, '→', normalizedUser);
  console.log('[verifyPinyin] Correct:', correctAnswer, '→', validPronunciations);

  // Check if user's answer matches any valid pronunciation
  const result = validPronunciations.some(valid => normalizedUser === valid);
  console.log('[verifyPinyin] Match:', result);

  return result;
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
/**
 * Removes tone marks and tone numbers from pinyin
 * Used to check if syllables match regardless of tones
 */
function removeTones(pinyin: string): string {
  let result = pinyin.trim().toLowerCase();

  // Convert tone marks to base letters
  result = convertToneMarksToNumbers(result);

  // Remove all tone numbers (1-5)
  result = result.replace(/[12345]/g, '');

  // Remove spaces
  result = result.replace(/\s+/g, '');

  return result;
}

/**
 * Checks if user has correct syllables but wrong tones
 * Returns true if syllables match but tones are different
 */
export function hasCorrectSyllablesButWrongTones(
  userAnswer: string,
  correctAnswer: string
): boolean {
  if (!userAnswer || !correctAnswer) return false;

  const userNoTones = removeTones(userAnswer);

  // Handle multiple valid pronunciations
  const validPronunciations = correctAnswer
    .split(/[;/]/)
    .map(p => removeTones(p.trim()));

  // Check if syllables match any valid pronunciation
  const syllablesMatch = validPronunciations.some(valid => userNoTones === valid);

  // Only return true if syllables match but the full answer (with tones) doesn't
  const fullMatch = verifyPinyin(userAnswer, correctAnswer);

  return syllablesMatch && !fullMatch;
}

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
