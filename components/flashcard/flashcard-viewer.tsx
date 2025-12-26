"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Lightbulb } from "lucide-react";

interface FlashcardViewerProps {
  question: string;
  answer: string;
  explanation?: string | null;
  isFlipped: boolean;
  onFlip: () => void;
  domain?: string;
  category?: string;
  skill?: string;
  progressStatus?: string | null;
}

export function FlashcardViewer({
  question,
  answer,
  explanation,
  isFlipped,
  onFlip,
  domain,
  category,
  skill,
  progressStatus,
}: FlashcardViewerProps) {
  return (
    <div className="perspective-1000">
      <motion.div
        className="relative w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring" }}
      >
        {/* Front of card (Question) */}
        <motion.div
          className="backface-hidden"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow min-h-[400px] flex flex-col"
            onClick={onFlip}
          >
            <CardContent className="flex-1 flex flex-col p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Question
                  </span>
                </div>
                {progressStatus && (
                  <Badge
                    variant={
                      progressStatus === "known"
                        ? "default"
                        : progressStatus === "learning"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {progressStatus}
                  </Badge>
                )}
              </div>

              {/* Question */}
              <div className="flex-1 flex items-center justify-center">
                <p className="text-2xl md:text-3xl font-medium text-center leading-relaxed">
                  {question}
                </p>
              </div>

              {/* Metadata */}
              {(domain || category || skill) && (
                <div className="mt-6 pt-4 border-t space-y-1 text-xs text-muted-foreground">
                  {domain && (
                    <div>
                      <span className="font-medium">Domain:</span> {domain}
                    </div>
                  )}
                  {category && (
                    <div>
                      <span className="font-medium">Category:</span> {category}
                    </div>
                  )}
                  {skill && (
                    <div>
                      <span className="font-medium">Skill:</span> {skill}
                    </div>
                  )}
                </div>
              )}

              {/* Tap to flip hint */}
              <div className="text-center text-sm text-muted-foreground mt-4">
                Click to see answer
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Back of card (Answer) */}
        <motion.div
          className="absolute inset-0 backface-hidden"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow min-h-[400px] flex flex-col bg-primary/5"
            onClick={onFlip}
          >
            <CardContent className="flex-1 flex flex-col p-8">
              {/* Header */}
              <div className="flex items-center gap-2 mb-6">
                <Lightbulb className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Answer</span>
              </div>

              {/* Answer */}
              <div className="flex-1 space-y-6">
                <p className="text-2xl md:text-3xl font-medium leading-relaxed">
                  {answer}
                </p>

                {/* Explanation */}
                {explanation && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Explanation
                    </h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {explanation}
                    </p>
                  </div>
                )}
              </div>

              {/* Tap to flip hint */}
              <div className="text-center text-sm text-muted-foreground mt-4">
                Click to see question
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
