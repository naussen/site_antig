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

function getAdaptiveCardHeightClass(question: string, answer: string) {
  const longestContent = Math.max(question.length, answer.length);

  if (longestContent > 700) return "flashcard-perspective--extended";
  if (longestContent > 480) return "flashcard-perspective--large";
  if (longestContent > 300) return "flashcard-perspective--medium";
  if (longestContent > 170) return "flashcard-perspective--regular";
  return "flashcard-perspective--compact";
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
  const adaptiveHeightClass = current
    ? getAdaptiveCardHeightClass(displayQuestion, current.answer)
    : "flashcard-perspective--compact";

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
    <section className="study-resource-block flashcard-deck animate-fade-in-up">
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

      <div className="study-resource-body flashcard-deck__body">
        <div className="flashcard-deck__progress">
          <progress
            value={currentIndex + 1}
            max={total}
            aria-label={`Progresso: flashcard ${currentIndex + 1} de ${total}`}
          />
          <span>Revisão {currentIndex + 1} de {total}</span>
        </div>

        {/* Card com flip 3D */}
        <div
          className={`flashcard-perspective ${adaptiveHeightClass} ${
            isBinaryCard && !hasAnswered ? "flashcard-perspective--locked" : ""
          } ${
            hasAnswered
              ? answeredCorrectly
                ? "flashcard-result-correct"
                : "flashcard-result-incorrect"
              : ""
          }`}
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
              className={`flashcard-face flashcard-face--question ${
                hasAnswered
                  ? answeredCorrectly
                    ? "flashcard-face--correct"
                    : "flashcard-face--incorrect"
                  : ""
              }`}
            >
              <div className="flex h-full w-full flex-col">
                <div className="flashcard-face__header flashcard-face__header--question">
                  <span className="flashcard-face__title">
                    {isBinaryCard ? "Certo ou errado?" : isLawCard ? "Letra da lei" : "Pergunta"}
                  </span>
                  <span className="flashcard-face__hint">
                    {isBinaryCard && !hasAnswered
                      ? "Escolha uma resposta"
                      : "Toque para ver o gabarito"}
                  </span>
                </div>
                <div className="flashcard-content-scroll flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-6 py-5 sm:px-8">
                  <p className="flashcard-question">
                    {displayQuestion}
                  </p>

                  {isBinaryCard && (
                    <div className="flashcard-answer-options" role="group" aria-label="Responder ao flashcard">
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
                            className={`flashcard-choice ${
                              selected
                                ? answeredCorrectly
                                  ? "flashcard-choice--correct"
                                  : "flashcard-choice--incorrect"
                                : ""
                            }`}
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
                      className={`flashcard-answer-result ${
                        answeredCorrectly
                          ? "flashcard-answer-result--correct"
                          : "flashcard-answer-result--incorrect"
                      }`}
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
              className={`flashcard-face flashcard-face--answer flashcard-back ${
                hasAnswered && !answeredCorrectly ? "flashcard-face--incorrect" : "flashcard-face--correct"
              }`}
            >
              <div className="flex h-full w-full flex-col">
                <div
                  className={`flashcard-face__header flashcard-face__header--answer ${
                    hasAnswered && !answeredCorrectly ? "flashcard-face__header--incorrect" : ""
                  }`}
                >
                  <span className="flashcard-face__title">
                    Gabarito e justificativa
                  </span>
                </div>
                <div className="flashcard-content-scroll flex min-h-0 flex-1 items-center overflow-y-auto px-6 py-5 sm:px-8">
                  <p className="flashcard-answer">
                    {current.answer}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="flashcard-deck__controls">
          <button
            type="button"
            onClick={prev}
            className="flashcard-deck__control"
            aria-label="Card anterior"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsFlipped(false);
              setUserAnswer(null);
            }}
            className="flashcard-deck__control"
            aria-label="Resetar card"
          >
            <RotateCcw size={18} />
          </button>

          <button
            type="button"
            onClick={randomCard}
            className="flashcard-deck__control"
            aria-label="Card aleatório"
          >
            <Shuffle size={18} />
          </button>

          <button
            type="button"
            onClick={next}
            className="flashcard-deck__control"
            aria-label="Próximo card"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
