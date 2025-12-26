"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  CircleSlash,
  Zap,
  Check,
  Star,
} from "lucide-react";

interface StudyControlsProps {
  currentIndex: number;
  totalCards: number;
  hasNext: boolean;
  hasPrevious: boolean;
  isFlipped: boolean;
  isUpdating: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onRate: (rating: "forgot" | "hard" | "good" | "easy") => void;
  onExit: () => void;
}

export function StudyControls({
  currentIndex,
  totalCards,
  hasNext,
  hasPrevious,
  isFlipped,
  isUpdating,
  onNext,
  onPrevious,
  onRate,
  onExit,
}: StudyControlsProps) {
  const progress = totalCards > 0 ? ((currentIndex + 1) / totalCards) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Card {currentIndex + 1} of {totalCards}
          </span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Rating Buttons (shown when flipped) */}
      {isFlipped && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => onRate("forgot")}
            disabled={isUpdating}
            className="flex-col h-auto py-4 gap-2 hover:border-destructive hover:text-destructive"
          >
            <CircleSlash className="h-5 w-5" />
            <span className="text-xs font-medium">Forgot</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => onRate("hard")}
            disabled={isUpdating}
            className="flex-col h-auto py-4 gap-2 hover:border-orange-500 hover:text-orange-500"
          >
            <X className="h-5 w-5" />
            <span className="text-xs font-medium">Hard</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => onRate("good")}
            disabled={isUpdating}
            className="flex-col h-auto py-4 gap-2 hover:border-blue-500 hover:text-blue-500"
          >
            <Check className="h-5 w-5" />
            <span className="text-xs font-medium">Good</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => onRate("easy")}
            disabled={isUpdating}
            className="flex-col h-auto py-4 gap-2 hover:border-green-500 hover:text-green-500"
          >
            <Star className="h-5 w-5" />
            <span className="text-xs font-medium">Easy</span>
          </Button>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrevious}
          disabled={!hasPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onExit}>
            Exit Study Session
          </Button>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={onNext}
          disabled={!hasNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="text-xs text-center text-muted-foreground pt-2 border-t">
        <kbd className="px-2 py-1 bg-muted rounded">Space</kbd> to flip •{" "}
        <kbd className="px-2 py-1 bg-muted rounded">←</kbd> Previous •{" "}
        <kbd className="px-2 py-1 bg-muted rounded">→</kbd> Next
        {isFlipped && (
          <>
            {" "}
            • <kbd className="px-2 py-1 bg-muted rounded">1-4</kbd> to rate
          </>
        )}
      </div>
    </div>
  );
}
