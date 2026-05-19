export type SRSRating = 'again' | 'hard' | 'good' | 'easy';

export interface SRSData {
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReviewDate: string;
}

/**
 * SuperMemo-2 (SM-2) Spaced Repetition Algorithm Implementation
 *
 * Ratings:
 * 0 (again) - Complete blackout, forgot everything.
 * 1 (hard)  - Incorrect response, but upon seeing the correct answer it seemed easy to remember.
 * 2 (good)  - Correct response after a hesitation.
 * 3 (easy)  - Perfect response.
 */
export function calculateNextReview(
  rating: SRSRating,
  currentInterval = 0,
  currentEaseFactor = 2.5,
  currentRepetitions = 0
): SRSData {
  let interval = currentInterval;
  let easeFactor = currentEaseFactor;
  let repetitions = currentRepetitions;

  // Convert rating to SM-2 scale (0-3 for simplified)
  let quality = 0;
  switch (rating) {
    case 'again': quality = 0; break;
    case 'hard':  quality = 1; break;
    case 'good':  quality = 2; break;
    case 'easy':  quality = 3; break;
  }

  if (quality >= 2) {
    // Correct response
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Incorrect response
    repetitions = 0;
    interval = 1;
  }

  // Update ease factor: EF' = EF + (0.1 - (3 - q) * (0.08 + (3 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));

  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);

  return {
    interval,
    easeFactor,
    repetitions,
    nextReviewDate: nextDate.toISOString()
  };
}

export function isCardDue(nextReviewDate?: string): boolean {
  if (!nextReviewDate) return true;
  const now = new Date();
  const reviewDate = new Date(nextReviewDate);
  return now >= reviewDate;
}
