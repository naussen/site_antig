"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Shuffle, RotateCcw } from "lucide-react";
import type { Flashcard } from "@/types/database";

interface FlashcardDeckProps {
  flashcards: Flashcard[];
}

/**
 * Deck interativo de flashcards com efeito 3D flip (CSS perspective + rotateY).
 * Navegação: anterior/próximo/aleatório. Tecla Space para virar.
 */
export function FlashcardDeck({ flashcards }: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const total = flashcards.length;
  const current = flashcards[currentIndex];

  const flip = useCallback(() => setIsFlipped((prev) => !prev), []);

  const goTo = useCallback(
    (index: number) => {
      setIsFlipped(false);
      setCurrentIndex(index);
    },
    []
  );

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
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h3
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Flashcards
        </h3>
        <span
          className="text-xs font-bold px-2 py-1 rounded-md"
          style={{
            background: "var(--accent-soft)",
            color: "var(--accent)",
          }}
        >
          {currentIndex + 1}/{total}
        </span>
      </div>

      {/* Card com flip 3D */}
      <div
        className="flashcard-perspective w-full"
        style={{ height: "220px" }}
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
        aria-label={`Flashcard ${currentIndex + 1} de ${total}. ${isFlipped ? "Resposta" : "Pergunta"}. Clique para virar.`}
      >
        <div className={`flashcard-inner ${isFlipped ? "flipped" : ""}`}>
          {/* Frente: Pergunta */}
          <div
            className="flashcard-face"
            style={{
              background: `linear-gradient(135deg, var(--flashcard-front), var(--mnemonic-gradient-to))`,
              boxShadow: "var(--shadow-lg)",
              cursor: "pointer",
            }}
          >
            <div className="text-center">
              <span className="text-xs uppercase tracking-widest text-white/60 block mb-3">
                Pergunta
              </span>
              <p className="text-white font-medium text-lg leading-relaxed">
                {current.question}
              </p>
            </div>
          </div>

          {/* Verso: Resposta */}
          <div
            className="flashcard-face flashcard-back"
            style={{
              background: `linear-gradient(135deg, var(--flashcard-back), var(--callout-tip-border))`,
              boxShadow: "var(--shadow-lg)",
              cursor: "pointer",
            }}
          >
            <div className="text-center">
              <span className="text-xs uppercase tracking-widest text-white/60 block mb-3">
                Resposta
              </span>
              <p className="text-white font-medium text-base leading-relaxed">
                {current.answer}
              </p>
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
  );
}
