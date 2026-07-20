import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Mic, Square, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth, useLang } from "../context/AppContext";
import {
  uploadPhoto,
  generateCard,
  transcribeAudio,
  type Answers,
  type GeneratedCard,
} from "../lib/api";
import AppHeader from "./AppHeader";
import Field from "./Field";
import CardResult from "./CardResult";

/*
  CreateCardWizard — весь путь создания карточки на одном экране,
  сверху вниз, без вкладок:

    фото → три вопроса (или голосом) → [Создать карточку] → результат

  Голосовой ввод: MediaRecorder пишет звук, Edge Function расшифровывает
  через Whisper (понимает казахский и русский). Расшифровка попадает
  в свободное поле — его можно поправить руками.
*/

type Stage = "form" | "generating" | "result";

export default function CreateCardWizard() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const w = t.wizard;

  const [stage, setStage] = useState<Stage>("form");
  const [formError, setFormError] = useState("");

  // Фото
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ответы
  const [what, setWhat] = useState("");
  const [madeOf, setMadeOf] = useState("");
  const [forWhom, setForWhom] = useState("");
  const [price, setPrice] = useState("");
  const [freeText, setFreeText] = useState("");

  // Голос
  const [voiceState, setVoiceState] = useState<"idle" | "recording" | "processing">("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Результат
  const [result, setResult] = useState<{
    card: GeneratedCard;
    category: string;
    answers: Answers;
    photoPath: string;
  } | null>(null);

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setFormError("");
  }

  /* ===== Голосовой ввод ===== */

  async function toggleVoice() {
    if (voiceState === "processing") return;

    if (voiceState === "recording") {
      recorderRef.current?.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Safari не умеет webm — берём mp4
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setVoiceState("processing");
        try {
          const blob = new Blob(chunksRef.current, { type: mime });
          const base64 = await blobToBase64(blob);
          const text = await transcribeAudio(base64, mime);
          // Дописываем к уже сказанному, а не затираем
          setFreeText((prev) => (prev ? `${prev} ${text}` : text));
        } catch {
          setFormError(w.errorGenerate);
        }
        setVoiceState("idle");
      };

      recorder.start();
      recorderRef.current = recorder;
      setVoiceState("recording");
    } catch {
      // Микрофон не дали — ничего страшного, есть текстовые поля
      setVoiceState("idle");
    }
  }

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.slice(dataUrl.indexOf(",") + 1));
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /* ===== Генерация ===== */

  async function handleGenerate() {
    if (!user) return;
    if (!photoFile) {
      setFormError(w.errorPhoto);
      return;
    }
    if (what.trim() === "" && freeText.trim() === "") {
      setFormError(w.errorAnswers);
      return;
    }

    setFormError("");
    setStage("generating");
    const desiredPrice = parseInt(price.replace(/\D/g, ""), 10);
    const answers: Answers = {
      what: what.trim(),
      madeOf: madeOf.trim(),
      forWhom: forWhom.trim(),
      desiredPrice: Number.isFinite(desiredPrice) && desiredPrice > 0 ? desiredPrice : undefined,
      freeText: freeText.trim() || undefined,
    };

    try {
      const photoPath = await uploadPhoto(user.id, photoFile);
      const { card, category } = await generateCard(photoPath, answers, lang);
      setResult({ card, category, answers, photoPath });
      setStage("result");
      window.scrollTo(0, 0);
    } catch {
      setFormError(w.errorGenerate);
      setStage("form");
    }
  }

  function resetWizard() {
    setStage("form");
    setResult(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setWhat("");
    setMadeOf("");
    setForWhom("");
    setPrice("");
    setFreeText("");
    window.scrollTo(0, 0);
  }

  /* ===== Экран ожидания ===== */
  if (stage === "generating") {
    return (
      <>
        <AppHeader />
        <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-terracotta text-white"
          >
            <Sparkles size={30} aria-hidden />
          </motion.span>
          <h1 className="mt-6 font-heading text-2xl font-extrabold">{w.generating}</h1>
          <p className="mt-2 max-w-sm text-ink/60">{w.generatingHint}</p>
        </main>
      </>
    );
  }

  /* ===== Экран результата ===== */
  if (stage === "result" && result) {
    return (
      <>
        <AppHeader />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <CardResult
            card={result.card}
            category={result.category}
            answers={result.answers}
            photoPath={result.photoPath}
            photoUrl={photoPreview}
            onNewCard={resetWizard}
          />
        </main>
      </>
    );
  }

  /* ===== Форма ===== */
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <button
          type="button"
          onClick={() => navigate("/app")}
          className="inline-flex items-center gap-2 rounded-lg py-2 pr-3 text-sm font-medium text-ink/60 transition-colors hover:text-terracotta"
        >
          <ArrowLeft size={18} aria-hidden />
          {t.cards.back}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="mt-4 font-heading text-3xl font-extrabold">{w.title}</h1>

          {/* Шаг 1: фото */}
          <section className="mt-8">
            <h2 className="font-heading text-lg font-extrabold">{w.stepPhoto}</h2>
            <p className="mt-1 text-sm text-ink/50">{w.photoHint}</p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />

            {photoPreview ? (
              <div className="mt-4 flex items-end gap-4">
                <img
                  src={photoPreview}
                  alt=""
                  className="h-44 w-44 rounded-2xl object-cover shadow-md"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors hover:bg-beige"
                >
                  {w.photoRetake}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-ink/15 bg-white py-12 font-semibold text-ink/60 transition-colors hover:border-terracotta hover:text-terracotta"
              >
                <Camera size={32} aria-hidden />
                {w.photoButton}
              </button>
            )}
          </section>

          {/* Шаг 2: вопросы или голос */}
          <section className="mt-10">
            <h2 className="font-heading text-lg font-extrabold">{w.stepAnswers}</h2>

            {/* Голос — самый простой путь, поэтому кнопка первая и крупная */}
            <button
              type="button"
              onClick={toggleVoice}
              disabled={voiceState === "processing"}
              className={`mt-4 flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-5 font-heading text-lg font-extrabold text-white shadow-lg transition-all disabled:cursor-wait disabled:opacity-70 ${
                voiceState === "recording"
                  ? "animate-pulse bg-terracotta"
                  : "bg-forest hover:bg-forest/90"
              }`}
            >
              {voiceState === "recording" ? (
                <Square size={22} aria-hidden />
              ) : (
                <Mic size={22} aria-hidden />
              )}
              {voiceState === "recording"
                ? w.voiceRecording
                : voiceState === "processing"
                  ? w.voiceProcessing
                  : w.voiceBtn}
            </button>
            <p className="mt-2 text-center text-sm text-ink/50">{w.voiceHint}</p>

            {/* Расшифровка голоса — можно поправить руками */}
            {freeText && (
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                rows={4}
                className="mt-4 w-full rounded-xl border-2 border-forest/30 bg-white px-4 py-3 leading-relaxed outline-none focus:border-forest"
              />
            )}

            <div className="mt-6 flex flex-col gap-5">
              <Field
                id="what"
                label={w.q1Label}
                placeholder={w.q1Placeholder}
                value={what}
                onChange={setWhat}
              />
              <Field
                id="madeOf"
                label={w.q2Label}
                placeholder={w.q2Placeholder}
                value={madeOf}
                onChange={setMadeOf}
              />
              <Field
                id="forWhom"
                label={w.q3Label}
                placeholder={w.q3Placeholder}
                value={forWhom}
                onChange={setForWhom}
              />
              <Field
                id="price"
                label={w.priceLabel}
                inputMode="numeric"
                placeholder={w.pricePlaceholder}
                value={price}
                hint={w.priceHint}
                onChange={(v) => setPrice(v.replace(/\D/g, ""))}
              />
            </div>
          </section>

          {formError && (
            <p role="alert" className="mt-6 rounded-xl bg-terracotta/10 px-4 py-3 font-medium text-terracotta">
              {formError}
            </p>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            className="mt-8 w-full rounded-2xl bg-terracotta px-8 py-5 font-heading text-xl font-extrabold text-white shadow-xl shadow-terracotta/25 transition-all hover:-translate-y-0.5 hover:bg-terracotta-dark"
          >
            {w.generateBtn}
          </button>
        </motion.div>
      </main>
    </>
  );
}
