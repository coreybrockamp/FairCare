export interface CharityCareMatch {
  isNonprofit: boolean;
  hospitalName: string;
  charityUrl: string;
  confidence: 'high' | 'medium' | 'none';
}

interface HospitalEntry {
  name: string;
  aliases: string[];
  state: string;
  ein: string;
  charityUrl: string;
}

/**
 * Fuzzy matches a provider name against the nonprofit hospital database.
 * Returns match info with confidence based on word overlap.
 */
export function matchCharityCare(providerName: string): CharityCareMatch {
  const noMatch: CharityCareMatch = {
    isNonprofit: false,
    hospitalName: '',
    charityUrl: '',
    confidence: 'none',
  };

  if (!providerName || providerName.trim().length === 0) return noMatch;

  // Lazy-load to avoid circular deps / large upfront cost
  const { NONPROFIT_HOSPITALS } = require('../data/nonprofitHospitals');

  const inputWords = normalizeToWords(providerName);
  if (inputWords.length === 0) return noMatch;

  let bestMatch: HospitalEntry | null = null;
  let bestScore = 0;

  for (const hospital of NONPROFIT_HOSPITALS as HospitalEntry[]) {
    // Check name and all aliases
    const candidates = [hospital.name, ...hospital.aliases];
    let maxScore = 0;

    for (const candidate of candidates) {
      const candidateWords = normalizeToWords(candidate);
      const score = countWordMatches(inputWords, candidateWords);
      if (score > maxScore) maxScore = score;
    }

    if (maxScore > bestScore) {
      bestScore = maxScore;
      bestMatch = hospital;
    }
  }

  if (bestScore >= 2 && bestMatch) {
    return {
      isNonprofit: true,
      hospitalName: bestMatch.name,
      charityUrl: bestMatch.charityUrl,
      confidence: 'high',
    };
  }

  if (bestScore >= 1 && bestMatch) {
    return {
      isNonprofit: true,
      hospitalName: bestMatch.name,
      charityUrl: bestMatch.charityUrl,
      confidence: 'medium',
    };
  }

  return noMatch;
}

// --- Helpers ---

const STOP_WORDS = new Set([
  'the', 'of', 'and', 'a', 'an', 'in', 'at', 'for', 'to', 'inc', 'llc', 'corp',
  'hospital', 'hospitals', 'medical', 'center', 'centres', 'system', 'systems',
  'health', 'healthcare', 'group', 'network', 'clinic', 'clinics', 'foundation',
]);

function normalizeToWords(str: string): string[] {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

function countWordMatches(inputWords: string[], candidateWords: string[]): number {
  let matches = 0;
  for (const iw of inputWords) {
    for (const cw of candidateWords) {
      if (iw === cw || iw.includes(cw) || cw.includes(iw)) {
        matches++;
        break;
      }
    }
  }
  return matches;
}
