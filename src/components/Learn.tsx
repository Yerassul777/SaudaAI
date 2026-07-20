import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Check, ChevronRight, X } from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "../context/AppContext";
import { lessons, type Lesson } from "../data/lessons";
import AppHeader from "./AppHeader";

/*
  Learn — «Научиться продавать»: список уроков → шаги → квиз.
  Всё статическое, ни одного вызова ИИ. Прогресс пройденных квизов
  хранится в localStorage.
*/

const PASSED_KEY = "sauda-lessons-passed";

function readPassed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PASSED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export default function Learn() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const l = t.learn;
  const list = lessons[lang];

  const [lesson, setLesson] = useState<Lesson | null>(null);
  // Этап внутри урока: шаги → квиз → готово
  const [stage, setStage] = useState<"steps" | "quiz" | "done">("steps");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [passed, setPassed] = useState<string[]>(readPassed);

  function openLesson(next: Lesson) {
    setLesson(next);
    setStage("steps");
    setQuestionIndex(0);
    setChosen(null);
    window.scrollTo(0, 0);
  }

  function markPassed(id: string) {
    const next = Array.from(new Set([...passed, id]));
    setPassed(next);
    localStorage.setItem(PASSED_KEY, JSON.stringify(next));
  }

  function handleNextQuestion() {
    if (!lesson) return;
    if (questionIndex + 1 < lesson.quiz.length) {
      setQuestionIndex(questionIndex + 1);
      setChosen(null);
    } else {
      markPassed(lesson.id);
      setStage("done");
    }
  }

  /* ===== Список уроков ===== */
  if (!lesson) {
    return (
      <>
        <AppHeader />
        <main className="mx-auto max-w-2xl px-4 py-8">
          <button
            type="button"
            onClick={() => navigate("/app")}
            className="inline-flex items-center gap-2 rounded-lg py-2 pr-3 font-medium text-ink/60 transition-colors hover:text-terracotta"
          >
            <ArrowLeft size={18} aria-hidden />
            {t.cards.back}
          </button>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="mt-4 font-heading text-3xl font-extrabold">{l.title}</h1>
            <p className="mt-2 text-lg text-ink/60">{l.subtitle}</p>

            <ul className="mt-8 flex flex-col gap-4">
              {list.map((item, i) => (
                <li key={item.id}>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openLesson(item)}
                    className="flex w-full items-center gap-4 rounded-3xl bg-surface p-6 text-left shadow-sm transition-shadow hover:shadow-md"
                  >
                    <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-forest/10 font-heading text-xl font-extrabold text-forest">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-heading text-lg font-bold leading-snug">
                        {item.title}
                      </span>
                      {passed.includes(item.id) && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-semibold text-forest">
                          <Check size={12} aria-hidden />
                          {l.passedBadge}
                        </span>
                      )}
                    </span>
                    <ChevronRight size={22} className="shrink-0 text-ink/40" aria-hidden />
                  </motion.button>
                </li>
              ))}
            </ul>
          </motion.div>
        </main>
      </>
    );
  }

  /* ===== Урок пройден ===== */
  if (stage === "done") {
    return (
      <>
        <AppHeader />
        <main className="flex min-h-[70vh] items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-3xl bg-surface p-10 text-center shadow-xl"
          >
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest text-white">
              <Check size={32} aria-hidden />
            </span>
            <h1 className="mt-5 font-heading text-2xl font-extrabold">{l.doneTitle}</h1>
            <p className="mt-2 text-ink/60">{l.doneText}</p>
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => setLesson(null)}
              className="mt-7 rounded-2xl bg-terracotta px-8 py-3.5 font-bold text-white transition-colors hover:bg-terracotta-dark"
            >
              {l.backToLessons}
            </motion.button>
          </motion.div>
        </main>
      </>
    );
  }

  /* ===== Квиз ===== */
  if (stage === "quiz") {
    const question = lesson.quiz[questionIndex];
    const answered = chosen !== null;
    const isCorrect = chosen === question.correct;

    return (
      <>
        <AppHeader />
        <main className="mx-auto max-w-2xl px-4 py-8">
          <button
            type="button"
            onClick={() => setStage("steps")}
            className="inline-flex items-center gap-2 rounded-lg py-2 pr-3 font-medium text-ink/60 transition-colors hover:text-terracotta"
          >
            <ArrowLeft size={18} aria-hidden />
            {lesson.title}
          </button>

          <div className="mt-4">
            <p className="text-sm font-semibold text-ink/50">
              {l.questionWord} {questionIndex + 1} / {lesson.quiz.length}
            </p>
            <h1 className="mt-2 font-heading text-2xl font-extrabold leading-snug">
              {question.q}
            </h1>

            <div className="mt-6 flex flex-col gap-3">
              {question.options.map((option, i) => {
                let style = "bg-surface hover:shadow-md";
                if (answered && i === question.correct) {
                  style = "bg-forest text-white";
                } else if (answered && i === chosen && !isCorrect) {
                  style = "bg-terracotta text-white";
                } else if (answered) {
                  style = "bg-surface opacity-50";
                }
                return (
                  <motion.button
                    key={option}
                    type="button"
                    whileTap={answered ? undefined : { scale: 0.98 }}
                    disabled={answered}
                    onClick={() => setChosen(i)}
                    className={`flex items-center gap-3 rounded-2xl p-5 text-left font-semibold shadow-sm transition-all ${style}`}
                  >
                    {answered && i === question.correct && <Check size={20} aria-hidden />}
                    {answered && i === chosen && !isCorrect && <X size={20} aria-hidden />}
                    {option}
                  </motion.button>
                );
              })}
            </div>

            {/* Объяснение после ответа */}
            {answered && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-5 rounded-2xl p-5 ${
                  isCorrect ? "bg-forest/10" : "bg-sun/20"
                }`}
              >
                <p className="font-heading font-bold">
                  {isCorrect ? l.correct : l.wrong}
                </p>
                <p className="mt-1.5 leading-relaxed text-ink/70">{question.why}</p>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={handleNextQuestion}
                  className="mt-4 rounded-xl bg-terracotta px-6 py-3 font-bold text-white transition-colors hover:bg-terracotta-dark"
                >
                  {l.next}
                </motion.button>
              </motion.div>
            )}
          </div>
        </main>
      </>
    );
  }

  /* ===== Шаги урока ===== */
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <button
          type="button"
          onClick={() => setLesson(null)}
          className="inline-flex items-center gap-2 rounded-lg py-2 pr-3 font-medium text-ink/60 transition-colors hover:text-terracotta"
        >
          <ArrowLeft size={18} aria-hidden />
          {l.backToLessons}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mt-4 flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-forest text-white">
              <BookOpen size={24} aria-hidden />
            </span>
            <div>
              <h1 className="font-heading text-2xl font-extrabold leading-snug sm:text-3xl">
                {lesson.title}
              </h1>
            </div>
          </div>
          <p className="mt-3 text-lg leading-relaxed text-ink/70">{lesson.intro}</p>

          <h2 className="mt-8 font-heading text-lg font-bold">{l.stepsTitle}</h2>
          <ol className="mt-4 flex flex-col gap-3">
            {lesson.steps.map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-4 rounded-2xl bg-surface p-5 shadow-sm"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-terracotta/10 font-heading font-extrabold text-terracotta">
                  {i + 1}
                </span>
                <p className="leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setStage("quiz");
              window.scrollTo(0, 0);
            }}
            className="btn-pulse mt-8 w-full rounded-2xl bg-terracotta px-8 py-4 text-lg font-bold text-white shadow-lg shadow-terracotta/25 transition-colors hover:bg-terracotta-dark"
          >
            {l.toQuiz}
          </motion.button>
        </motion.div>
      </main>
    </>
  );
}
