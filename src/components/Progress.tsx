import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Dumbbell,
  Lightbulb,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "../context/AppContext";
import { listPracticeSessions, SKILL_KEYS, type PracticeSession } from "../lib/api";
import {
  averageScore,
  averageSkills,
  band,
  chartBars,
  latestImprovements,
  latestStrengths,
  levelWord,
  trend,
} from "../lib/progress";
import { markets } from "../data/practice";
import { formatDate, formatShortDate } from "../lib/dates";
import AppHeader from "./AppHeader";

/*
  Progress — «Мои тренировки»: отдельная страница с разбором прогресса.

  Правило этой страницы: один блок — одна мысль, и везде, где можно, вместо
  цифры стоит слово. Аудитория — продавцы, которым цифра «6.4» не говорит
  ничего, а «Надо подтянуть» говорит всё.

  Вся арифметика вынесена в lib/progress.ts, здесь только отрисовка.
*/

/** Цвет площадки для столбика графика; незнакомое название — нейтральный зелёный. */
function marketColor(name: string): string {
  const key = name.trim().toLowerCase();
  const market = markets.find((m) => m.id === key || m.name.toLowerCase() === key);
  return market?.accentBg ?? "bg-forest";
}

export default function Progress() {
  const { t } = useLang();
  const navigate = useNavigate();
  const p = t.progress;

  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPracticeSessions()
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  const average = averageScore(sessions) ?? 0;
  const movement = trend(sessions);
  const skills = averageSkills(sessions);
  const strengths = latestStrengths(sessions);
  const improvements = latestImprovements(sessions);
  const bars = chartBars(sessions);

  const trendText =
    movement.direction === "up"
      ? p.trendUp
      : movement.direction === "down"
        ? p.trendDown
        : movement.direction === "flat"
          ? p.trendFlat
          : p.trendUnknown;

  const TrendIcon =
    movement.direction === "up"
      ? TrendingUp
      : movement.direction === "down"
        ? TrendingDown
        : Minus;

  const backButton = (
    <button
      type="button"
      onClick={() => navigate("/app/profile")}
      className="inline-flex items-center gap-2 rounded-lg py-2 pr-3 font-medium text-ink/60 transition-colors hover:text-terracotta"
    >
      <ArrowLeft size={18} aria-hidden />
      {t.cards.back}
    </button>
  );

  if (loading) {
    return (
      <>
        <AppHeader />
        <main className="flex min-h-[70vh] items-center justify-center">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-terracotta border-t-transparent" />
        </main>
      </>
    );
  }

  /* ===== Ещё ни одной тренировки ===== */
  if (sessions.length === 0) {
    return (
      <>
        <AppHeader />
        <main className="mx-auto max-w-2xl px-4 py-8">
          {backButton}
          <h1 className="mt-4 font-heading text-3xl font-extrabold">{p.title}</h1>
          <div className="mt-6 rounded-3xl bg-surface p-8 text-center shadow-sm">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-burgundy text-white">
              <Dumbbell size={30} aria-hidden />
            </span>
            <p className="mt-5 text-lg leading-relaxed text-ink/70">{p.empty}</p>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/app/practice")}
              className="mt-6 w-full rounded-2xl bg-terracotta px-8 py-4 text-lg font-bold text-white shadow-lg transition-colors hover:bg-terracotta-dark"
            >
              {p.emptyBtn}
            </motion.button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        {backButton}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="mt-4 font-heading text-3xl font-extrabold">{p.title}</h1>
          <p className="mt-2 text-lg text-ink/60">{p.subtitle}</p>

          {/* ===== Уровень и движение ===== */}
          <section className="mt-6 rounded-3xl bg-forest p-7 text-white shadow-lg">
            <p className="font-semibold text-white/70">{p.levelLabel}</p>
            <p className="mt-1 font-heading text-3xl font-extrabold">
              {p.levels[levelWord(average)]}
            </p>
            <p className="mt-4 font-heading text-6xl font-extrabold leading-none">
              {Math.round(average)}
              <span className="ml-2 align-middle text-xl font-bold text-white/60">
                {p.ofTen}
              </span>
            </p>
            <p className="mt-5 flex items-start gap-2.5 rounded-2xl bg-white/12 px-4 py-3 text-lg leading-snug">
              <TrendIcon size={24} className="mt-0.5 shrink-0" aria-hidden />
              <span>
                {trendText
                  .replace("{from}", String(movement.from))
                  .replace("{to}", String(movement.to))}
              </span>
            </p>
          </section>

          {/* ===== График ===== */}
          <section className="mt-4 rounded-3xl bg-surface p-6 shadow-sm">
            <h2 className="font-heading text-xl font-bold">{p.chartTitle}</h2>
            <div className="mt-5 flex h-52 justify-between gap-2">
              {bars.map((bar) => (
                <div key={bar.id} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <span className="font-heading text-sm font-extrabold text-ink/70">
                    {bar.score}
                  </span>
                  {/* Дорожка занимает всю оставшуюся высоту — от неё и считается
                      процент столбика, иначе он схлопывается в полоску */}
                  <div className="flex w-full flex-1 items-end">
                    <motion.span
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(bar.score, 1) * 10}%` }}
                      transition={{ duration: 0.5 }}
                      className={`w-full rounded-t-lg ${marketColor(bar.marketplace)}`}
                    />
                  </div>
                  <span className="w-full truncate text-center text-xs text-ink/40">
                    {formatShortDate(bar.createdAt, p.monthsShort)}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-ink/50">{p.chartHint}</p>
          </section>

          {/* ===== Что получается ===== */}
          <section className="mt-4 rounded-3xl border-2 border-forest/30 bg-forest/10 p-6">
            <h2 className="font-heading text-xl font-bold text-forest">
              {p.strengthsTitle}
            </h2>
            {strengths.length === 0 ? (
              <p className="mt-3 text-lg text-ink/60">{p.strengthsEmpty}</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {strengths.map((strength) => (
                  <li key={strength} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest text-white">
                      <Check size={18} aria-hidden />
                    </span>
                    <span className="text-lg leading-snug">{strength}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ===== Что подтянуть ===== */}
          <section className="mt-4 rounded-3xl border-2 border-terracotta/30 bg-terracotta/10 p-6">
            <h2 className="font-heading text-xl font-bold text-terracotta">
              {p.improveTitle}
            </h2>
            {improvements.length === 0 ? (
              <p className="mt-3 text-lg text-ink/60">{p.improveEmpty}</p>
            ) : (
              <>
                <ul className="mt-4 flex flex-col gap-4">
                  {improvements.map((item) => (
                    <li key={item.skill} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-terracotta text-white">
                        <Lightbulb size={18} aria-hidden />
                      </span>
                      <span>
                        <span className="block font-heading font-bold">
                          {p.skillNames[item.skill]}
                        </span>
                        <span className="mt-0.5 block text-lg leading-snug text-ink/70">
                          {item.advice}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/app/practice")}
                  className="mt-5 w-full rounded-2xl bg-terracotta px-6 py-4 text-lg font-bold text-white shadow-lg transition-colors hover:bg-terracotta-dark"
                >
                  {p.trainThis}
                </motion.button>
              </>
            )}
          </section>

          {/* ===== Полосы по умениям ===== */}
          <section className="mt-4 rounded-3xl bg-surface p-6 shadow-sm">
            <h2 className="font-heading text-xl font-bold">{p.skillsTitle}</h2>
            {Object.keys(skills).length === 0 ? (
              <p className="mt-3 text-lg text-ink/60">{p.skillsEmpty}</p>
            ) : (
              <ul className="mt-5 flex flex-col gap-5">
                {SKILL_KEYS.filter((key) => typeof skills[key] === "number").map((key) => {
                  const value = skills[key] as number;
                  const level = band(value);
                  const fill =
                    level === "good"
                      ? "bg-forest"
                      : level === "ok"
                        ? "bg-sun"
                        : "bg-terracotta";
                  return (
                    <li key={key}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <span className="font-heading text-lg font-bold">
                          {p.skillNames[key]}
                        </span>
                        <span className="font-semibold text-ink/60">{p.bands[level]}</span>
                      </div>
                      <div className="mt-2 h-4 w-full overflow-hidden rounded-full bg-beige">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${value * 10}%` }}
                          transition={{ duration: 0.6 }}
                          className={`h-full rounded-full ${fill}`}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* ===== История ===== */}
          <section className="mt-4 rounded-3xl bg-surface p-6 shadow-sm">
            <h2 className="font-heading text-xl font-bold">{p.historyTitle}</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {sessions.map((session) => (
                <li key={session.id} className="rounded-2xl bg-beige p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold capitalize">{session.marketplace}</span>
                    <span className="rounded-full bg-forest px-3 py-1 font-heading text-sm font-extrabold text-white">
                      {session.score}/10
                    </span>
                  </div>
                  <p className="mt-2 leading-relaxed text-ink/70">{session.feedback}</p>
                  {session.tip && (
                    <p className="mt-2 leading-relaxed text-ink/70">
                      <span className="font-bold">{p.tipLabel}: </span>
                      {session.tip}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-ink/40">
                    {formatDate(session.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </motion.div>
      </main>
    </>
  );
}
