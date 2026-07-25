/*
  progress.ts — вся арифметика страницы «Мои тренировки». Чистые функции,
  без React и без обращений к сети: их легко проверить и легко объяснить.

  Соглашение: на вход везде приходит список тренировок в том виде, в каком его
  отдаёт listPracticeSessions — от новой к старой. Функции, которым нужен
  хронологический порядок, разворачивают его сами.

  Тренировки, сделанные до появления разбора по умениям, приходят с пустым
  skills. Такие сессии учитываются в общем балле, но пропускаются там, где
  считаются умения, — иначе средние поедут вниз без всякой вины продавца.
*/
import { SKILL_KEYS, type PracticeSession, type SkillKey, type Skills } from "./api";

/** Уровень продавца по среднему баллу — для крупной надписи наверху страницы. */
export type Level = "beginner" | "confident" | "master";

/** Словесная оценка умения. Пожилому продавцу «Хорошо» понятнее, чем «7.4». */
export type Band = "good" | "ok" | "weak";

export type Trend = {
  direction: "up" | "down" | "flat" | "unknown";
  /** Было — округлённый балл более раннего отрезка */
  from: number;
  /** Стало — округлённый балл свежего отрезка */
  to: number;
};

/** Столбик графика: один прошедший разбор. */
export type Bar = {
  id: string;
  score: number;
  marketplace: string;
  createdAt: string;
};

/** Среднее арифметическое; пустой список — null, а не ноль. */
function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Есть ли у сессии разбор по умениям (старые тренировки его не имеют). */
function hasSkills(session: PracticeSession): boolean {
  return SKILL_KEYS.some((key) => typeof session.skills?.[key] === "number");
}

/**
 * Средний балл по каждому умению за все тренировки с разбором.
 * Умение, которое ни разу не оценивали, в результат не попадает.
 */
export function averageSkills(sessions: PracticeSession[]): Skills {
  const graded = sessions.filter(hasSkills);
  const result: Skills = {};

  for (const key of SKILL_KEYS) {
    const values = graded
      .map((session) => session.skills?.[key])
      .filter((value): value is number => typeof value === "number");
    const average = mean(values);
    if (average !== null) result[key] = average;
  }

  return result;
}

/** Общий средний балл. limit — сколько последних тренировок брать. */
export function averageScore(
  sessions: PracticeSession[],
  limit = sessions.length
): number | null {
  return mean(sessions.slice(0, limit).map((session) => session.score));
}

/**
 * Растёт продавец или нет: среднее последних трёх тренировок против трёх
 * предыдущих. Если тренировок ещё мало, сравниваем самую свежую с самой первой —
 * иначе человек, сходивший дважды, не увидит вообще никакого ответа.
 * Разница меньше половины балла — это шум, называем её «без изменений».
 */
export function trend(sessions: PracticeSession[]): Trend {
  if (sessions.length < 2) return { direction: "unknown", from: 0, to: 0 };

  let recent = sessions.slice(0, 3);
  let earlier = sessions.slice(3, 6);

  if (earlier.length === 0) {
    recent = [sessions[0]];
    earlier = [sessions[sessions.length - 1]];
  }

  const to = mean(recent.map((s) => s.score)) ?? 0;
  const from = mean(earlier.map((s) => s.score)) ?? 0;
  const difference = to - from;

  return {
    direction: difference >= 0.5 ? "up" : difference <= -0.5 ? "down" : "flat",
    from: Math.round(from),
    to: Math.round(to),
  };
}

/** Самое сильное умение — то, что хвалим. */
export function strongest(skills: Skills): SkillKey | null {
  return pick(skills, (a, b) => b - a);
}

/** Самое слабое умение — то, что предлагаем подтянуть. */
export function weakest(skills: Skills): SkillKey | null {
  return pick(skills, (a, b) => a - b);
}

function pick(skills: Skills, compare: (a: number, b: number) => number): SkillKey | null {
  const entries = SKILL_KEYS.filter((key) => typeof skills[key] === "number");
  if (entries.length === 0) return null;
  return entries.sort((a, b) => compare(skills[a] as number, skills[b] as number))[0];
}

/** Уровень по среднему баллу: новичок / уверенный / мастер. */
export function levelWord(score: number): Level {
  if (score >= 8) return "master";
  if (score >= 6) return "confident";
  return "beginner";
}

/** Балл словом — то, что видит продавец справа от полосы умения. */
export function band(score: number): Band {
  if (score >= 7) return "good";
  if (score >= 5) return "ok";
  return "weak";
}

/**
 * Столбики графика в хронологическом порядке — слева старые, справа свежие,
 * как человек привык читать время.
 */
export function chartBars(sessions: PracticeSession[], limit = 8): Bar[] {
  return sessions
    .slice(0, limit)
    .map((session) => ({
      id: session.id,
      score: session.score,
      marketplace: session.marketplace,
      createdAt: session.created_at,
    }))
    .reverse();
}

/**
 * Что подтянуть: советы из последних разборов, без повторов по одному умению.
 * Берём свежие — старый совет продавец, скорее всего, уже отработал.
 */
export function latestImprovements(
  sessions: PracticeSession[],
  limit = 2
): { skill: SkillKey; advice: string }[] {
  const seen = new Set<SkillKey>();
  const result: { skill: SkillKey; advice: string }[] = [];

  for (const session of sessions) {
    for (const item of session.improvements ?? []) {
      if (seen.has(item.skill) || item.advice.trim() === "") continue;
      seen.add(item.skill);
      result.push(item);
      if (result.length === limit) return result;
    }
  }

  return result;
}

/** Что получается: сильные стороны из последних разборов, без повторов. */
export function latestStrengths(sessions: PracticeSession[], limit = 2): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const session of sessions) {
    for (const strength of session.strengths ?? []) {
      const text = strength.trim();
      const key = text.toLowerCase();
      if (text === "" || seen.has(key)) continue;
      seen.add(key);
      result.push(text);
      if (result.length === limit) return result;
    }
  }

  return result;
}
