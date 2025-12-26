"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { FlashcardViewer } from "@/components/flashcard/flashcard-viewer";
import { StudyControls } from "@/components/flashcard/study-controls";
import { FilterPanel } from "@/components/flashcard/filter-panel";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFlashcardSession } from "@/hooks/use-flashcard-session";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Trophy } from "lucide-react";
import Link from "next/link";

export default function FlashcardsPage() {
  const params = useParams();
  const router = useRouter();
  const examCode = params.examCode as string;

  const [selectedDomainId, setSelectedDomainId] = useState<string>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>();
  const [selectedSkillId, setSelectedSkillId] = useState<string>();
  const [selectedStatus, setSelectedStatus] = useState<string>();
  const [dueOnly, setDueOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch exam structure for filters
  const { data: examStructure } = useQuery({
    queryKey: ["exam-structure", examCode],
    queryFn: async () => {
      const response = await fetch(`/api/exams/${examCode}/structure`);
      if (!response.ok) throw new Error("Failed to fetch exam structure");
      return response.json();
    },
  });

  // Use flashcard session hook
  const session = useFlashcardSession({
    examCode,
    domainId: selectedDomainId,
    categoryId: selectedCategoryId,
    skillId: selectedSkillId,
    status: selectedStatus,
    dueOnly,
    search: searchQuery,
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case " ":
        case "Enter":
          e.preventDefault();
          session.flipCard();
          break;
        case "ArrowLeft":
          e.preventDefault();
          session.goToPrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          session.goToNext();
          break;
        case "1":
          if (session.isFlipped) {
            e.preventDefault();
            session.rateCard("forgot");
          }
          break;
        case "2":
          if (session.isFlipped) {
            e.preventDefault();
            session.rateCard("hard");
          }
          break;
        case "3":
          if (session.isFlipped) {
            e.preventDefault();
            session.rateCard("good");
          }
          break;
        case "4":
          if (session.isFlipped) {
            e.preventDefault();
            session.rateCard("easy");
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [session]);

  const handleClearFilters = () => {
    setSelectedDomainId(undefined);
    setSelectedCategoryId(undefined);
    setSelectedSkillId(undefined);
    setSelectedStatus(undefined);
    setDueOnly(false);
    setSearchQuery("");
  };

  const handleExit = () => {
    router.push(`/exam/${examCode}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link href={`/exam/${examCode}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Exam
              </Button>
            </Link>
          </div>

          {/* Filter Panel */}
          {examStructure && (
            <FilterPanel
              domains={examStructure.domains || []}
              categories={examStructure.categories || []}
              skills={examStructure.skills || []}
              selectedDomainId={selectedDomainId}
              selectedCategoryId={selectedCategoryId}
              selectedSkillId={selectedSkillId}
              selectedStatus={selectedStatus}
              dueOnly={dueOnly}
              searchQuery={searchQuery}
              onDomainChange={setSelectedDomainId}
              onCategoryChange={setSelectedCategoryId}
              onSkillChange={setSelectedSkillId}
              onStatusChange={setSelectedStatus}
              onDueOnlyChange={setDueOnly}
              onSearchChange={setSearchQuery}
              onClearFilters={handleClearFilters}
            />
          )}

          {/* Loading State */}
          {session.isLoading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" text="Loading flashcards..." />
            </div>
          )}

          {/* Error State */}
          {session.error && (
            <ErrorMessage
              title="Failed to load flashcards"
              message={session.error.message}
            />
          )}

          {/* No Cards State */}
          {!session.isLoading && !session.error && session.totalCards === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No flashcards found</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  No flashcards match your current filters. Try adjusting your search
                  criteria or clearing the filters.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Flashcard Viewer */}
          {!session.isLoading &&
            !session.error &&
            session.currentCard &&
            session.totalCards > 0 && (
              <>
                <FlashcardViewer
                  question={session.currentCard.question}
                  answer={session.currentCard.answer}
                  explanation={session.currentCard.explanation}
                  isFlipped={session.isFlipped}
                  onFlip={session.flipCard}
                  domain={session.currentCard.domain.title}
                  category={session.currentCard.category.title}
                  skill={session.currentCard.skill.title}
                  progressStatus={session.currentCard.progress?.status}
                />

                <StudyControls
                  currentIndex={session.currentIndex}
                  totalCards={session.totalCards}
                  hasNext={session.hasNext}
                  hasPrevious={session.hasPrevious}
                  isFlipped={session.isFlipped}
                  isUpdating={session.isUpdating}
                  onNext={session.goToNext}
                  onPrevious={session.goToPrevious}
                  onRate={session.rateCard}
                  onExit={handleExit}
                />
              </>
            )}

          {/* Session Complete */}
          {!session.isLoading &&
            !session.error &&
            session.totalCards > 0 &&
            !session.hasNext &&
            session.currentIndex === session.totalCards - 1 && (
              <Card className="mt-6">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Trophy className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Session Complete!
                  </h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                    You've reviewed all {session.totalCards} flashcards. Great job!
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={session.resetSession}>
                      Review Again
                    </Button>
                    <Button variant="outline" onClick={handleExit}>
                      Exit Study Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
}
