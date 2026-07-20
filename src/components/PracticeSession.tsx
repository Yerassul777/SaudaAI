import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Sparkles, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth, useLang } from "../context/AppContext";
import { markets } from "../data/practice";
import { buyerQuestions } from "../data/practice";
import {
  getPracticeFeedback,
  savePracticeSession,
} from "../lib/api";
import AppHeader from "./AppHeader";
import Field from "./Field";

/*
  PracticeSession — сама тренировка на выбранной площадке, две фазы:

  1. «Выставьте товар» — упрощённая форма в духе интерфейса площадки
     (проверки — простыми правилами, без ИИ).
  2. «Покупатель пишет» — чат: заготовленные вопросы по очереди,
     пользователь отвечает. В конце ОДИН вызов ИИ разбирает всю переписку:
     оценка, что получилось, совет. Сессия сохраняется в базу.
*/

type Message = { from: "buyer" | "me"; text: string };

export default function PracticeSession() {
  const { market: marketId } = useParams();
  const { t, lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const p = t.practice;

  const market = markets.find((m) => m.id === marketId) ?? markets[0];
  const questions = buyerQuestions[lang];

  const [phase, setPhase] = useState<"form" | "chat" | "analyzing" | "result">("form");

  // Фаза 1: объявление
  const [adTitle, setAdTitle] = useState("");
  const [adCategory, setAdCategory] = useState("");
  const [adPrice, setAdPrice] = useState("");
  const [adDesc, setAdDesc] = useState("");
  const [formError, setFormError] = useState("");

  // Фаза 2: чат
  const [messages, setMessages] = useState<Message[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Результат
  const [result, setResult] = useState<{ score: number; feedback: string; tip: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handlePublish() {
    if (adTitle.trim() === "") {
      setFormError(p.adErrorTitle);
      return;
    }
    if (adPrice.trim() === "") {
      setFormError(p.adErrorPrice);
      return;
    }
    setFormError("");
    // Покупатель сразу задаёт первый вопрос
    setMessages([{ from: "buyer", text: questions[0] }]);
    setQuestionIndex(0);
    setPhase("chat");
    window.scrollTo(0, 0);
  }

  async function handleSend() {
    const text = draft.trim();
    if (text === "") return;
    setDraft("");

    const nextIndex = questionIndex + 1;
    const withAnswer: Message[] = [...messages, { from: "me", text }];

    if (nextIndex < questions.length) {
      // Следующий вопрос покупателя — с небольшой паузой, как в жизни
      setMessages(withAnswer);
      setQuestionIndex(nextIndex);
      setTimeout(() => {
        setMessages((prev) => [...prev, { from: "buyer", text: questions[nextIndex] }]);
      }, 700);
      return;
    }

    // Вопросы кончились → разбор ИИ
    setMessages(withAnswer);
    setPhase("analyzing");

    const dialogue = questions.map((question, i) => ({
      question,
      answer:
        withAnswer.filter((m) => m.from === "me")[i]?.text ?? "",
    }));

    try {
      const feedback = await getPracticeFeedback({
        marketplace: market.name,
        ad: { title: adTitle, category: adCategory, price: adPrice, description: adDesc },
        dialogue,
        lang,
      });
      setResult(feedback);
      if (user) {
        await savePracticeSession({
          userId: user.id,
          marketplace: market.name,
          score: feedback.score,
          feedback: feedback.feedback,
        }).catch(() => undefined);
      }
      setPhase("result");
      window.scrollTo(0, 0);
    } catch {
      setError(p.errorFeedback);
      setPhase("chat");
    }
  }

  /* ===== Разбор ===== */
  if (phase === "result" && result) {
    return (
      <>
        <AppHeader />
        <main className="mx-auto max-w-2xl px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-surface p-8 shadow-xl"
          >
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sun/25 text-terracotta">
              <Trophy size={30} aria-hidden />
            </span>
            <h1 className="mt-4 text-center font-heading text-2xl font-extrabold">
              {p.finishTitle}
            </h1>

            <div className="mx-auto mt-5 w-fit rounded-2xl bg-forest px-8 py-4 text-center text-white">
              <p className="text-sm font-semibold text-white/70">{p.scoreLabel}</p>
              <p className="font-heading text-4xl font-extrabold">{result.score}/10</p>
            </div>

            <div className="mt-6 rounded-2xl bg-beige p-5">
              <p className="font-heading font-bold">{p.feedbackLabel}</p>
              <p className="mt-1.5 leading-relaxed text-ink/70">{result.feedback}</p>
            </div>
            <div className="mt-3 rounded-2xl bg-sun/20 p-5">
              <p className="font-heading font-bold">{p.tipLabel}</p>
              <p className="mt-1.5 leading-relaxed text-ink/70">{result.tip}</p>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/app/practice")}
                className="flex-1 rounded-2xl bg-terracotta px-6 py-3.5 font-bold text-white transition-colors hover:bg-terracotta-dark"
              >
                {p.again}
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/app/profile")}
                className="flex-1 rounded-2xl border-2 border-forest px-6 py-3.5 font-bold text-forest transition-colors hover:bg-forest hover:text-white"
              >
                {p.toProfile}
              </motion.button>
            </div>
          </motion.div>
        </main>
      </>
    );
  }

  /* ===== Ожидание разбора ===== */
  if (phase === "analyzing") {
    return (
      <>
        <AppHeader />
        <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-burgundy text-white"
          >
            <Sparkles size={30} aria-hidden />
          </motion.span>
          <h1 className="mt-6 font-heading text-2xl font-extrabold">{p.analyzing}</h1>
        </main>
      </>
    );
  }

  /* ===== Фаза 2: чат ===== */
  if (phase === "chat") {
    return (
      <>
        <AppHeader />
        <main className="mx-auto flex min-h-[calc(100dvh-64px)] max-w-2xl flex-col px-4 py-6">
          {/* Шапка чата в цветах площадки */}
          <div className={`flex items-center gap-3 rounded-t-3xl px-5 py-4 ${market.accentBg} ${market.accentText}`}>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 font-heading font-extrabold">
              {p.buyerName.charAt(0)}
            </span>
            <div>
              <p className="font-heading font-bold leading-tight">{p.buyerName}</p>
              <p className="text-xs opacity-75">{market.name}</p>
            </div>
          </div>

          {/* Сообщения */}
          <div className="flex-1 space-y-3 overflow-y-auto rounded-b-3xl bg-surface p-5 shadow-sm">
            <p className="text-center text-xs text-ink/40">{p.step2Hint}</p>
            {messages.map((message, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.from === "me" ? "justify-end" : "justify-start"}`}
              >
                <p
                  className={`max-w-[80%] rounded-2xl px-4 py-3 leading-relaxed ${
                    message.from === "me"
                      ? "rounded-br-md bg-forest text-white"
                      : "rounded-bl-md bg-beige"
                  }`}
                >
                  {message.text}
                </p>
              </motion.div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {error && (
            <p role="alert" className="mt-3 rounded-xl bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">
              {error}
            </p>
          )}

          {/* Поле ответа */}
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder={p.inputPlaceholder}
              className="min-h-13 w-full rounded-2xl border-2 border-ink/10 bg-surface px-4 outline-none transition-colors focus:border-forest"
            />
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={handleSend}
              aria-label={p.sendBtn}
              className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-terracotta text-white transition-colors hover:bg-terracotta-dark"
            >
              <Send size={22} aria-hidden />
            </motion.button>
          </div>
        </main>
      </>
    );
  }

  /* ===== Фаза 1: форма объявления в духе площадки ===== */
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <button
          type="button"
          onClick={() => navigate("/app/practice")}
          className="inline-flex items-center gap-2 rounded-lg py-2 pr-3 font-medium text-ink/60 transition-colors hover:text-terracotta"
        >
          <ArrowLeft size={18} aria-hidden />
          {p.title}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Шапка «площадки» */}
          <div className={`mt-4 rounded-t-3xl px-6 py-4 ${market.accentBg} ${market.accentText}`}>
            <p className="font-heading text-xl font-extrabold">{market.name}</p>
          </div>

          <div className={`rounded-b-3xl border-2 border-t-0 bg-surface p-6 ${market.cardBorder}`}>
            <h1 className="font-heading text-2xl font-extrabold">{p.step1Title}</h1>
            <p className="mt-1 text-ink/60">{p.step1Hint}</p>

            <div className="mt-6 flex flex-col gap-5">
              <Field
                id="adTitle"
                label={p.adTitle}
                placeholder={p.adTitlePlaceholder}
                value={adTitle}
                onChange={setAdTitle}
              />
              <Field
                id="adCategory"
                label={p.adCategory}
                placeholder={p.adCategoryPlaceholder}
                value={adCategory}
                onChange={setAdCategory}
              />
              <Field
                id="adPrice"
                label={p.adPrice}
                inputMode="numeric"
                placeholder={p.adPricePlaceholder}
                value={adPrice}
                onChange={(v) => setAdPrice(v.replace(/\D/g, ""))}
              />
              <div>
                <label htmlFor="adDesc" className="mb-1.5 block text-sm font-semibold">
                  {p.adDesc}
                </label>
                <textarea
                  id="adDesc"
                  rows={4}
                  value={adDesc}
                  onChange={(e) => setAdDesc(e.target.value)}
                  placeholder={p.adDescPlaceholder}
                  className="w-full rounded-xl border-2 border-ink/10 bg-surface px-4 py-3 leading-relaxed outline-none transition-colors placeholder:text-ink/30 focus:border-forest"
                />
              </div>
            </div>

            {formError && (
              <p role="alert" className="mt-4 rounded-xl bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">
                {formError}
              </p>
            )}

            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={handlePublish}
              className={`mt-6 w-full rounded-2xl px-8 py-4 text-lg font-bold shadow-lg ${market.accentBg} ${market.accentText}`}
            >
              {p.publishBtn}
            </motion.button>
          </div>
        </motion.div>
      </main>
    </>
  );
}
