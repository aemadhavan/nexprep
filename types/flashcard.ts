export interface Flashcard {
  id: string;
  skillId: string;
  question: string;
  answer: string;
  explanation?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlashcardProgress {
  id: string;
  userId: string;
  flashcardId: string;
  status: "new" | "learning" | "known";
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
  lastReviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlashcardWithProgress extends Flashcard {
  progress?: FlashcardProgress;
}

export interface StudySessionCard {
  flashcard: Flashcard;
  progress?: FlashcardProgress;
  isFlipped: boolean;
}
