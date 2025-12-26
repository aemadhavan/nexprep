/**
 * SuperMemo 2 (SM-2) Algorithm Implementation
 * Used for spaced repetition flashcard scheduling
 *
 * @see https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
 */

export interface SM2Result {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
}

/**
 * Calculate the next review using SM-2 algorithm
 *
 * @param quality - User's response quality (0-5)
 *   0 - Total blackout
 *   1 - Incorrect response, but correct one seemed easy to recall
 *   2 - Incorrect response, correct one seemed hard to recall
 *   3 - Correct response, but required significant effort
 *   4 - Correct response, after some hesitation
 *   5 - Perfect response
 * @param currentEaseFactor - Current ease factor (default 2.5)
 * @param currentInterval - Current interval in days (default 0)
 * @param currentRepetitions - Current number of successful repetitions (default 0)
 * @returns Next review parameters
 */
export function calculateNextReview(
  quality: number,
  currentEaseFactor: number = 2.5,
  currentInterval: number = 0,
  currentRepetitions: number = 0
): SM2Result {
  // Validate quality (0-5)
  if (quality < 0 || quality > 5) {
    throw new Error("Quality must be between 0 and 5");
  }

  let easeFactor = currentEaseFactor;
  let interval = currentInterval;
  let repetitions = currentRepetitions;

  // Calculate new ease factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Ease factor must be at least 1.3
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  // If quality < 3, reset the card (start over)
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    // Quality >= 3, increase repetitions
    repetitions = repetitions + 1;

    // Calculate interval based on repetitions
    if (repetitions === 1) {
      interval = 1; // First review: 1 day
    } else if (repetitions === 2) {
      interval = 6; // Second review: 6 days
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    easeFactor: Math.round(easeFactor * 100) / 100, // Round to 2 decimal places
    interval,
    repetitions,
    nextReviewDate,
  };
}

/**
 * Determine if a flashcard is due for review
 * @param nextReviewDate - The scheduled review date
 * @returns true if the card should be reviewed now
 */
export function isDue(nextReviewDate: Date): boolean {
  return new Date() >= new Date(nextReviewDate);
}

/**
 * Get quality rating from user action
 * Simplified mapping for user-friendly buttons
 */
export function getUserQualityRating(action: "forgot" | "hard" | "good" | "easy"): number {
  switch (action) {
    case "forgot":
      return 0;
    case "hard":
      return 3;
    case "good":
      return 4;
    case "easy":
      return 5;
    default:
      return 3;
  }
}
