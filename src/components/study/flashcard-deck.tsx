"use client";

import { useState, useCallback } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers3,
  RotateCcw,
  Shuffle,
  XCircle,
} from "lucide-react";
import type { Flashcard } from "@/types/database";

interface FlashcardDeckProps {
  flashcards: Flashcard[];
}

type BinaryAnswer = "certo" | "errado";

function getCorrectBinaryAnswer(answer: string): BinaryAnswer | null {
  const match = answer.match(/\bGabarito:\s*(CERTO|ERRADO)\b/i);
  if (!match) return null;
  return match[1].toLocaleLowerCase("pt-BR") as BinaryAnswer;
}

function getAdaptiveCardHeight(question: string, answer: string) {
  const longestContent = Math.max(question.length, answer.length);

  if (longestContent > 700) return 460;
  if (longestContent > 480) return 410;
  if (longestContent > 300) return 360;
  if (longestContent > 170) return 320;
  return 270;
}

/**
 * Deck interativo de flashcards com efeito 3D flip (CSS perspective + rotateY).
 * Cards binários exigem resposta antes de liberar o gabarito.
 */
export function FlashcardDeck({ flashcards }: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userAnswer, setUserAnswer] = useState<BinaryAnswer | null>(null);

  const total = flashcards.length;
  const current = flashcards[currentIndex];
  const isLawCard = current?.question.trim().startsWith("[LETRA DA LEI]");
  const displayQuestion = current?.question
    .replace(
      /^\[(?:CERTO\/ERRADO|LETRA DA LEI|CEBRASPE[^\]]*|CESPE[^\]]*|FGV[^\]]*|FCC[^\]]*)\]\s*/i,
      "",
    )
    .trim();
  const correctAnswer = current ? getCorrectBinaryAnswer(current.answer) : null;
  const isBinaryCard = correctAnswer !== null;
  const hasAnswered = userAnswer !== null;
  const answeredCorrectly = hasAnswered && userAnswer === correctAnswer;
  const adaptiveHeight = current
    ? getAdaptiveCardHeight(displayQuestion, current.answer)
    : 270;

  const flip = useCallback(() => {
    if (isBinaryCard && !hasAnswered) return;
    setIsFlipped((prev) => !prev);
  }, [hasAnswered, isBinaryCard]);

  const goTo = useCallback(
    (index: number) => {
      setIsFlipped(false);
      setUserAnswer(null);
      setCurrentIndex(index);
    },
    []
  );

  const answerCard = (answer: BinaryAnswer) => {
    setUserAnswer(answer);
    setIsFlipped(false);
  };

  const next = useCallback(() => {
    goTo((currentIndex + 1) % total);
  }, [currentIndex, total, goTo]);

  const prev = useCallback(() => {
    goTo((currentIndex - 1 + total) % total);
  }, [currentIndex, total, goTo]);

  const randomCard = useCallback(() => {
    let newIndex: number;
    do {
      newIndex = Math.floor(Math.random() * total);
    } while (newIndex === currentIndex && total > 1);
    goTo(newIndex);
  }, [currentIndex, total, goTo]);

  if (total === 0) return null;

  return (
    <section className="study-resource-block animate-fade-in-up">
      <div className="study-resource-heading">
        <h3>
          <Layers3 size={17} aria-hidden="true" />
          Flashcards
        </h3>
        <span
          aria-label={`Flashcard ${currentIndex + 1} de ${total}`}
        >
          {currentIndex + 1}/{total}
        </span>
      </div>

      <div className="study-resource-body space-y-4">
        {/* Card com flip 3D */}
        <div
          className={`flashcard-perspective w-full ${
            hasAnswered
              ? answeredCorrectly
                ? "flashcard-result-correct"
                : "flashcard-result-incorrect"
              : ""
          }`}
          style={{ height: `clamp(270px, ${adaptiveHeight}px, 460px)` }}
          role="button"
          tabIndex={0}
          onClick={flip}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              flip();
            } else if (e.key === "ArrowRight") {
              next();
            } else if (e.key === "ArrowLeft") {
              prev();
            }
          }}
          aria-disabled={isBinaryCard && !hasAnswered}
          aria-label={`Flashcard ${currentIndex + 1} de ${total}. ${
            isFlipped ? "Resposta" : "Pergunta"
          }. ${
            isBinaryCard && !hasAnswered
              ? "Responda certo ou errado antes de virar."
              : "Clique para virar."
          }`}
        >
          <div className={`flashcard-inner ${isFlipped ? "flipped" : ""}`}>
            {/* Frente: Pergunta */}
            <div
              className="flashcard-face"
              style={{
                background: "var(--bg-card)",
                border: `2px solid ${
                  hasAnswered
                    ? answeredCorrectly
                      ? "var(--quiz-correct-border)"
                      : "var(--quiz-incorrect-border)"
                    : "var(--accent)"
                }`,
                boxShadow: "var(--shadow-lg)",
                cursor: isBinaryCard && !hasAnswered ? "default" : "pointer",
              }}
            >
              <div className="flex h-full w-full flex-col">
                <div
                  className="flex items-center justify-between gap-3 border-b px-5 py-3"
                  style={{
                    background: "var(--accent-soft)",
                    borderColor: "var(--accent)",
                  }}
                >
                  <span
                    className="text-sm font-extrabold uppercase tracking-[0.16em]"
                    style={{ color: "var(--accent)" }}
                  >
                    {isBinaryCard ? "Certo ou errado?" : isLawCard ? "Letra da lei" : "Pergunta"}
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {isBinaryCard && !hasAnswered
                      ? "Escolha uma resposta"
                      : "Toque para ver o gabarito"}
                  </span>
                </div>
                <div className="flashcard-content-scroll flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-6 py-5 sm:px-8">
                  <p
                    className="w-full whitespace-pre-line text-left text-base font-semibold leading-7 sm:text-lg"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {displayQuestion}
                  </p>

                  {isBinaryCard && (
                    <div className="mt-6 grid w-full grid-cols-2 gap-3" role="group" aria-label="Responder ao flashcard">
                      {(["certo", "errado"] as const).map((answer) => {
                        const selected = userAnswer === answer;
                        return (
                          <button
                            key={answer}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              answerCard(answer);
                            }}
                            disabled={hasAnswered}
                            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-extrabold uppercase tracking-wider transition-all enabled:hover:-translate-y-0.5 disabled:cursor-default"
                            style={{
                              background: selected
                                ? answeredCorrectly
                                  ? "var(--quiz-correct-bg)"
                                  : "var(--quiz-incorrect-bg)"
                                : "var(--bg-secondary)",
                              borderColor: selected
                                ? answeredCorrectly
                                  ? "var(--quiz-correct-border)"
                                  : "var(--quiz-incorrect-border)"
                                : "var(--border-strong)",
                              color: selected
                                ? answeredCorrectly
                                  ? "var(--quiz-correct-text)"
                                  : "var(--quiz-incorrect-text)"
                                : "var(--text-primary)",
                            }}
                            aria-pressed={selected}
                          >
                            {answer === "certo" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                            {answer}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {hasAnswered && (
                    <div
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold"
                      style={{
                        background: answeredCorrectly
                          ? "var(--quiz-correct-bg)"
                          : "var(--quiz-incorrect-bg)",
                        color: answeredCorrectly
                          ? "var(--quiz-correct-text)"
                          : "var(--quiz-incorrect-text)",
                      }}
                      role="status"
                    >
                      {answeredCorrectly ? <CheckCircle2 size={19} /> : <XCircle size={19} />}
                      {answeredCorrectly
                        ? "Você acertou. Toque no card para ver a justificativa."
                        : `Você errou. O gabarito é ${correctAnswer?.toUpperCase()}. Toque para ver a justificativa.`}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Verso: Resposta */}
            <div
              className="flashcard-face flashcard-back"
              style={{
                background: "var(--bg-card)",
                border: `2px solid ${
                  hasAnswered && !answeredCorrectly
                    ? "var(--quiz-incorrect-border)"
                    : "var(--quiz-correct-border)"
                }`,
                boxShadow: "var(--shadow-lg)",
                cursor: "pointer",
              }}
            >
              <div className="flex h-full w-full flex-col">
                <div
                  className="border-b px-5 py-3"
                  style={{
                    background:
                      hasAnswered && !answeredCorrectly
                        ? "var(--quiz-incorrect-bg)"
                        : "var(--quiz-correct-bg)",
                    borderColor:
                      hasAnswered && !answeredCorrectly
                        ? "var(--quiz-incorrect-border)"
                        : "var(--quiz-correct-border)",
                  }}
                >
                  <span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{
                      color:
                        hasAnswered && !answeredCorrectly
                          ? "var(--quiz-incorrect-text)"
                          : "var(--quiz-correct-text)",
                    }}
                  >
                    Gabarito e justificativa
                  </span>
                </div>
                <div className="flashcard-content-scroll flex min-h-0 flex-1 items-center overflow-y-auto px-6 py-5 sm:px-8">
                  <p
                    className="w-full whitespace-pre-line text-left text-base font-medium leading-7"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {current.answer}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={prev}
            className="p-2 rounded-lg cursor-pointer"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
            aria-label="Card anterior"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={() => {
              setIsFlipped(false);
              setUserAnswer(null);
            }}
            className="p-2 rounded-lg cursor-pointer"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
            aria-label="Resetar card"
          >
            <RotateCcw size={18} />
          </button>

          <button
            onClick={randomCard}
            className="p-2 rounded-lg cursor-pointer"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
            aria-label="Card aleatório"
          >
            <Shuffle size={18} />
          </button>

          <button
            onClick={next}
            className="p-2 rounded-lg cursor-pointer"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
            aria-label="Próximo card"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
