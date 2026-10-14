"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Invaders } from "@/components/invaders";
import { PromptLine } from "@/components/prompt-line";
import type { Question } from "@/lib/questions/schema";
import { roundScore, xpFromScore } from "@/lib/scoring";
import type { AnswerResult, ScoredAnswer } from "@/lib/scoring";
import { recordSoloSession } from "@/lib/sessions";
import { strings } from "@/lib/strings";
import { FeedbackView } from "./feedback-view";
import { QuestionView } from "./question-view";
import { ResultView } from "./result-view";

export const ROUND_SECONDS = 15;

type RoundProps = {
  questions: Question[];
  categorySlug: string;
  categoryDisplay: string;
  userStatus?: string;
};

export function Round({
  questions,
  categorySlug,
  categoryDisplay,
  userStatus,
}: RoundProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"question" | "feedback" | "result">(
    "question",
  );
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [result, setResult] = useState<AnswerResult>("no-answer");
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<ScoredAnswer[]>([]);
  const [playAgainHref, setPlayAgainHref] = useState(
    `/play/${categorySlug}?r=0`,
  );
  const [roundId] = useState(() => crypto.randomUUID());
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [confirmedScore, setConfirmedScore] = useState<number | null>(null);
  const timeLeftRef = useRef(ROUND_SECONDS);
  const resolvedRef = useRef(false);
  const submittedRef = useRef(false);

  const question = questions[currentIndex];
  const total = questions.length;
  const isLast = currentIndex === total - 1;
  const score = roundScore(answers);
  const displayScore = confirmedScore ?? score;

  const resolve = useCallback(
    (answerResult: AnswerResult, chosen: string | null) => {
      if (phase !== "question" || resolvedRef.current) {
        return;
      }
      resolvedRef.current = true;
      setResult(answerResult);
      setSelected(chosen);
      setPhase("feedback");
      setAnswers((prev) => [
        ...prev,
        {
          questionId: question.id,
          difficulty: question.difficulty,
          result: answerResult,
          selected: chosen,
        },
      ]);
    },
    [phase, question],
  );

  useEffect(() => {
    if (phase !== "question") {
      return;
    }
    const id = window.setInterval(() => {
      const next = timeLeftRef.current - 1;
      timeLeftRef.current = next;
      setTimeLeft(next);
      if (next <= 0) {
        resolve("no-answer", null);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, resolve]);

  const handleNext = () => {
    if (isLast) {
      setPlayAgainHref(`/play/${categorySlug}?r=${Date.now()}`);
      setPhase("result");
      return;
    }
    setCurrentIndex((index) => index + 1);
    timeLeftRef.current = ROUND_SECONDS;
    resolvedRef.current = false;
    setTimeLeft(ROUND_SECONDS);
    setResult("no-answer");
    setSelected(null);
    setPhase("question");
  };

  useEffect(() => {
    if (phase !== "result" || submittedRef.current) {
      return;
    }
    submittedRef.current = true;
    void recordSoloSession({
      sessionId: roundId,
      category: categoryDisplay,
      answers,
    }).then((result) => {
      if (result.recorded) {
        setConfirmedScore(result.score);
        setPersisted(true);
      } else {
        setPersisted(false);
      }
    });
  }, [phase, roundId, categoryDisplay, answers]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-[40rem] flex-col">
        <PromptLine prompt={strings.round.prompt(categoryDisplay)} userStatus={userStatus} />

        <section className="mt-12 flex flex-col gap-8">
          {phase === "question" ? (
            <QuestionView
              question={question}
              current={currentIndex + 1}
              total={total}
              timeLeft={timeLeft}
              onAnswer={(answerResult, chosen) =>
                resolve(answerResult, chosen)
              }
            />
          ) : null}

          {phase === "feedback" ? (
            <FeedbackView
              question={question}
              result={result}
              selected={selected}
              current={currentIndex + 1}
              total={total}
              score={score}
              isLast={isLast}
              onNext={handleNext}
            />
          ) : null}

          {phase === "result" ? (
            <ResultView
              score={displayScore}
              xp={xpFromScore(displayScore)}
              playAgainHref={playAgainHref}
              recorded={persisted}
            />
          ) : null}
        </section>

        {phase !== "result" ? (
          <div className="mt-12 w-full max-w-[24rem]">
            <Invaders
              total={total}
              current={currentIndex}
              results={answers.map((answer) => answer.result)}
            />
          </div>
        ) : null}

        <hr className="mt-12 w-full border-t border-dashed border-term-border" />

        <p className="mt-4 text-xs text-term-secondary">{strings.round.hint}</p>
      </div>
    </main>
  );
}
