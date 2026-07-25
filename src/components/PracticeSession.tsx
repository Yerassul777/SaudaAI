import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Lightbulb, Send, Sparkles, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth, useLang } from "../context/AppContext";
import { markets } from "../data/practice";
import { buyerQuestions } from "../data/practice";
import { marketplaceForms } from "../data/marketplaceForms";
import {
  getBuyerReply,
  getPracticeFeedback,
  savePracticeSession,
  type ChatTurn,
  type PracticeFeedback,
} from "../lib/api";
import AppHeader from "./AppHeader";
import MarketForm from "./MarketForm";

/*
  PracticeSession — тренировка на выбранной площадке, четыре фазы:

  1. «Выставьте товар» — форма конкретной площадки. У Kaspi, OLX и Wildberries
     разные поля и разный порядок шагов, поэтому форма собирается по схеме
     из data/marketplaceForms.ts, а не одна на всех.
  2. «Посмотрим объявление» — разбор заполненного по правилам площадки.
     Считается на клиенте обычными правилами: мгновенно и без затрат на ИИ.
  3. «Покупатель пишет» — чат. Каждую реплику покупателя сочиняет модель,
     видя объявление и всю переписку целиком, поэтому он реагирует на то, что
     продавец действительно ответил. Тему реплики при этом задаёт сервер, а не
     модель: пять тем подряд кормят пять умений в рубрике разбора.
     Если модель не ответила или вышла из роли, подставляется заготовленный
     вопрос из data/practice.ts — тренировка не ломается из-за сети.
  4. В конце ещё один вызов ИИ разбирает всю переписку: оценка, пять умений,
     сильные стороны и что подтянуть. Сессия сохраняется в базу.
*/

type Message = ChatTurn;

export default function PracticeSession() {
  const { market: marketId } = useParams();
  const { t, lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const p = t.practice;

  const market = markets.find((m) => m.id === marketId) ?? markets[0];
  const questions = buyerQuestions[lang];
  const form = marketplaceForms[market.id];

  const [phase, setPhase] = useState<
    "form" | "adReview" | "chat" | "analyzing" | "result"
  >("form");

  // Фаза 1: объявление. Ключи полей задаёт схема площадки
  const [values, setValues] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  // Фаза 2: сработавшие правила разбора
  const [issues, setIssues] = useState<string[]>([]);

  // Фаза 3: чат
  const [messages, setMessages] = useState<Message[]>([]);
  const [buyerTyping, setBuyerTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Результат
  const [result, setResult] = useState<PracticeFeedback | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, buyerTyping]);

  /** Значение поля по роли в схеме площадки: название, цена, описание… */
  const adValue = (role: keyof typeof form.aiMap) =>
    (values[form.aiMap[role]] ?? "").trim();

  /** Объявление в том виде, в каком его видят покупатель и наставник. */
  const ad = () => ({
    title: adValue("title"),
    category: adValue("category"),
    price: adValue("price"),
    description: adValue("description"),
  });

  /*
    Поля, которых нет у всех площадок (состояние, бренд, габариты), уходят
    отдельным списком: так ИИ видит объявление целиком, а контракт функции
    остаётся общим для трёх кабинетов.
  */
  const extraFields = () => {
    const mapped = new Set(Object.values(form.aiMap));
    const texts = p.forms[market.id] as unknown as {
      labels: Record<string, string>;
    };
    return Object.entries(values)
      .filter(([id, value]) => !mapped.has(id) && value.trim() !== "")
      .map(([id, value]) => ({ label: texts.labels[id] ?? id, value }));
  };

  function handlePublish() {
    // Название и цену требуют все три площадки — без них публикации нет
    if (adValue("title") === "") {
      setFormError(p.adErrorTitle);
      return;
    }
    if (adValue("price") === "") {
      setFormError(p.adErrorPrice);
      return;
    }
    setFormError("");
    setIssues(form.checks.filter((rule) => rule.when(values)).map((rule) => rule.id));
    setPhase("adReview");
    window.scrollTo(0, 0);
  }

  /*
    Очередная реплика покупателя. Модель видит объявление и всю переписку,
    поэтому отвечает на то, что продавец действительно написал. Тему реплики
    выбирает сервер по номеру хода.

    Модель не ответила или вышла из роли (сервер вернул message = null) —
    подставляем заготовленный вопрос по этой же теме. Тренировка не должна
    ломаться из-за сети, особенно на защите.
  */
  async function askBuyer(chat: Message[]) {
    const turn = chat.filter((m) => m.from === "buyer").length;
    setBuyerTyping(true);

    let text: string | null = null;
    try {
      const reply = await getBuyerReply({
        marketplace: market.name,
        ad: ad(),
        extra: extraFields(),
        chat,
        lang,
      });
      text = reply.message;
    } catch {
      text = null;
    }

    setMessages((prev) => [
      ...prev,
      { from: "buyer", text: text ?? questions[turn] },
    ]);
    setBuyerTyping(false);
  }

  /** С разбора объявления — к покупателю: он пишет первым. */
  async function startChat() {
    setMessages([]);
    setError("");
    setPhase("chat");
    window.scrollTo(0, 0);
    await askBuyer([]);
  }

  /** Пары «вопрос покупателя → ответ продавца» для итогового разбора. */
  function toDialogue(chat: Message[]) {
    return chat
      .map((message, i) =>
        message.from === "buyer"
          ? {
              question: message.text,
              answer:
                chat.slice(i + 1).find((next) => next.from === "me")?.text ?? "",
            }
          : null
      )
      .filter((pair): pair is { question: string; answer: string } => pair !== null);
  }

  async function finish(chat: Message[]) {
    setPhase("analyzing");
    try {
      const feedback = await getPracticeFeedback({
        marketplace: market.name,
        ad: ad(),
        extra: extraFields(),
        dialogue: toDialogue(chat),
        lang,
      });
      setResult(feedback);
      if (user) {
        await savePracticeSession({
          userId: user.id,
          marketplace: market.name,
          feedback,
        }).catch(() => undefined);
      }
      setPhase("result");
      window.scrollTo(0, 0);
    } catch {
      setError(p.errorFeedback);
      setPhase("chat");
    }
  }

  async function handleSend() {
    const text = draft.trim();
    // Пока покупатель «печатает», второй ответ не принимаем: иначе реплики
    // перемешаются и разбор получит кашу вместо переписки
    if (text === "" || buyerTyping) return;
    setDraft("");

    const withAnswer: Message[] = [...messages, { from: "me", text }];
    setMessages(withAnswer);

    const asked = withAnswer.filter((m) => m.from === "buyer").length;
    if (asked < questions.length) {
      await askBuyer(withAnswer);
      return;
    }
    // Покупатель задал все свои вопросы → разбор
    await finish(withAnswer);
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
                onClick={() => navigate("/app/progress")}
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

            {/* Покупатель думает: модель сочиняет реплику 1-2 секунды */}
            {buyerTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
                aria-label={p.buyerTyping}
              >
                <span className="flex gap-1.5 rounded-2xl rounded-bl-md bg-beige px-5 py-4">
                  {[0, 1, 2].map((dot) => (
                    <motion.span
                      key={dot}
                      animate={{ opacity: [0.25, 1, 0.25] }}
                      transition={{
                        duration: 1.1,
                        repeat: Infinity,
                        delay: dot * 0.18,
                      }}
                      className="h-2.5 w-2.5 rounded-full bg-ink/50"
                    />
                  ))}
                </span>
              </motion.div>
            )}
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
              disabled={buyerTyping}
              aria-label={p.sendBtn}
              className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-terracotta text-white transition-colors hover:bg-terracotta-dark disabled:opacity-45"
            >
              <Send size={22} aria-hidden />
            </motion.button>
          </div>
        </main>
      </>
    );
  }

  /* ===== Фаза 2: разбор объявления по правилам площадки ===== */
  if (phase === "adReview") {
    return (
      <>
        <AppHeader />
        <main className="mx-auto max-w-2xl px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl bg-surface p-7 shadow-lg"
          >
            {issues.length === 0 ? (
              <>
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-forest text-white">
                  <Check size={32} aria-hidden />
                </span>
                <h1 className="mt-4 font-heading text-2xl font-extrabold">
                  {p.reviewOkTitle}
                </h1>
                <p className="mt-2 text-lg leading-relaxed text-ink/70">{p.reviewOkText}</p>
              </>
            ) : (
              <>
                <h1 className="font-heading text-2xl font-extrabold">{p.reviewTitle}</h1>
                <ul className="mt-5 flex flex-col gap-4">
                  {issues.map((id) => (
                    <li key={id} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sun/25 text-terracotta">
                        <Lightbulb size={20} aria-hidden />
                      </span>
                      <span className="text-lg leading-snug">
                        {p.checks[id as keyof typeof p.checks]}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={startChat}
                className="flex-1 rounded-2xl bg-terracotta px-6 py-4 text-lg font-bold text-white shadow-lg transition-colors hover:bg-terracotta-dark"
              >
                {p.reviewNext}
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setPhase("form");
                  window.scrollTo(0, 0);
                }}
                className="rounded-2xl border-2 border-forest px-6 py-4 font-bold text-forest transition-colors hover:bg-forest hover:text-white"
              >
                {t.cards.back}
              </motion.button>
            </div>
          </motion.div>
        </main>
      </>
    );
  }

  /* ===== Фаза 1: форма конкретной площадки ===== */
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
          className="mt-4"
        >
          <h1 className="font-heading text-2xl font-extrabold">{p.step1Title}</h1>
          <p className="mb-4 mt-1 text-ink/60">{p.step1Hint}</p>

          <MarketForm
            market={market}
            values={values}
            onChange={(id, value) =>
              setValues((prev) => ({ ...prev, [id]: value }))
            }
            onSubmit={handlePublish}
            error={formError}
          />
        </motion.div>
      </main>
    </>
  );
}
