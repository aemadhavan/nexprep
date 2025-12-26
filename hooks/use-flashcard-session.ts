"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  explanation?: string | null;
  order: number;
  skill: { id: string; title: string };
  category: { id: string; title: string };
  domain: { id: string; title: string };
  progress: {
    id: string;
    status: string;
    easeFactor: number;
    interval: number;
    repetitions: number;
    nextReviewDate: Date;
    lastReviewedAt?: Date | null;
  } | null;
}

interface UseFlashcardSessionOptions {
  examCode: string;
  domainId?: string;
  categoryId?: string;
  skillId?: string;
  status?: string;
  dueOnly?: boolean;
  search?: string;
}

export function useFlashcardSession(options: UseFlashcardSessionOptions) {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Build query params
  const params = new URLSearchParams();
  if (options.domainId) params.set("domainId", options.domainId);
  if (options.categoryId) params.set("categoryId", options.categoryId);
  if (options.skillId) params.set("skillId", options.skillId);
  if (options.status) params.set("status", options.status);
  if (options.dueOnly) params.set("dueOnly", "true");
  if (options.search) params.set("search", options.search);

  // Fetch flashcards
  const { data, isLoading, error } = useQuery({
    queryKey: ["flashcards", options.examCode, params.toString()],
    queryFn: async () => {
      const response = await fetch(
        `/api/flashcards/${options.examCode}?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch flashcards");
      }

      return response.json() as Promise<{ flashcards: Flashcard[]; total: number }>;
    },
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({
      flashcardId,
      rating,
    }: {
      flashcardId: string;
      rating: "forgot" | "hard" | "good" | "easy";
    }) => {
      const response = await fetch("/api/flashcards/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcardId, rating }),
      });

      if (!response.ok) {
        throw new Error("Failed to update progress");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate flashcards query to refresh data
      queryClient.invalidateQueries({ queryKey: ["flashcards", options.examCode] });
    },
    onError: (error: Error) => {
      toast.error("Failed to update progress", {
        description: error.message,
      });
    },
  });

  const flashcards = data?.flashcards ?? [];
  const currentCard = flashcards[currentIndex];
  const totalCards = flashcards.length;
  const hasNext = currentIndex < totalCards - 1;
  const hasPrevious = currentIndex > 0;

  const goToNext = useCallback(() => {
    if (hasNext) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  }, [hasNext]);

  const goToPrevious = useCallback(() => {
    if (hasPrevious) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }, [hasPrevious]);

  const flipCard = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const rateCard = useCallback(
    async (rating: "forgot" | "hard" | "good" | "easy") => {
      if (!currentCard) return;

      await updateProgressMutation.mutateAsync({
        flashcardId: currentCard.id,
        rating,
      });

      // Auto-advance to next card after rating
      if (hasNext) {
        setTimeout(() => {
          goToNext();
        }, 500);
      }
    },
    [currentCard, hasNext, goToNext, updateProgressMutation]
  );

  const resetSession = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);

  return {
    // Data
    flashcards,
    currentCard,
    currentIndex,
    totalCards,
    isFlipped,

    // Loading states
    isLoading,
    error,
    isUpdating: updateProgressMutation.isPending,

    // Navigation
    hasNext,
    hasPrevious,
    goToNext,
    goToPrevious,

    // Actions
    flipCard,
    rateCard,
    resetSession,

    // Progress
    progress: {
      current: currentIndex + 1,
      total: totalCards,
      percentage: totalCards > 0 ? ((currentIndex + 1) / totalCards) * 100 : 0,
    },
  };
}
