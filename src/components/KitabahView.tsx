import { useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, Loader2, RotateCcw, Sparkles, Star, XCircle } from "lucide-react";
import type { DarsData, LearningLevel, MaharahProgress } from "../types";
import { isArabicAnswerMatch, normalizeArabicComparison } from "../utils/arabicNormalize";
import { calculateScoreFromCounts, calculateStars } from "../utils/storage";
import { ArabicKeyboard } from "./ArabicKeyboard";

interface KitabahViewProps {
  dars: DarsData;
  level: LearningLevel;
  savedProgress: MaharahProgress;
  onSaveProgress: (progress: MaharahProgress) => void;
}

interface WritingFeedback {
  vocabularyFeedback: string;
  structureFeedback: string;
  relevanceFeedback: string;
  correctedExampleArabic: string;
  encouragement: string;
  stars: number;
}

export function KitabahView({ dars, level, savedProgress, onSaveProgress }: KitabahViewProps) {
  const isMiddle = level === "middle";
  const kitabah = dars.kitabah;

  // Part 1: Word Ordering state (stores chosen words in order per task)
  const [wordOrders, setWordOrders] = useState<Record<string, string[]>>({});
  // Part 2: Completion inputs (using Virtual Arabic Keyboard)
  const [completionInputs, setCompletionInputs] = useState<Record<string, string>>({});
  const [activeCompletionId, setActiveCompletionId] = useState<string>(
    kitabah.completionTasks[0]?.id ?? ""
  );
  // Part 2b (optional): Paragraph ordering
  const [paragraphOrder, setParagraphOrder] = useState<string[]>(
    kitabah.paragraphOrderTask ? [...kitabah.paragraphOrderTask.shuffledSentences] : []
  );
  // Part 3: Free writing
  const [freeWritingText, setFreeWritingText] = useState("");
  const [activeKeyboardTarget, setActiveKeyboardTarget] = useState<"completion" | "freeWriting">(
    "freeWriting"
  );

  const [objectiveSubmitted, setObjectiveSubmitted] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [writingFeedback, setWritingFeedback] = useState<WritingFeedback | null>(null);

  const handlePickWord = (taskId: string, word: string) => {
    if (objectiveSubmitted) return;
    setWordOrders((prev) => {
      const current = prev[taskId] ?? [];
      if (current.includes(word)) {
        return { ...prev, [taskId]: current.filter((w) => w !== word) };
      }
      return { ...prev, [taskId]: [...current, word] };
    });
  };

  const moveParagraphSentence = (index: number, dir: -1 | 1) => {
    if (objectiveSubmitted) return;
    const target = index + dir;
    if (target < 0 || target >= paragraphOrder.length) return;
    const copy = [...paragraphOrder];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    setParagraphOrder(copy);
  };

  // Scoring objective Kitabah tasks
  const totalObjective =
    kitabah.wordOrderTasks.length +
    kitabah.completionTasks.length +
    (kitabah.paragraphOrderTask ? 1 : 0);

  let correctObjective = 0;
  for (const t of kitabah.wordOrderTasks) {
    const built = (wordOrders[t.id] ?? []).join(" ");
    if (normalizeArabicComparison(built) === normalizeArabicComparison(t.correctSentence)) {
      correctObjective += 1;
    }
  }
  for (const c of kitabah.completionTasks) {
    if (isArabicAnswerMatch(completionInputs[c.id] ?? "", c.acceptedAnswers)) {
      correctObjective += 1;
    }
  }
  const isParaOrderCorrect = kitabah.paragraphOrderTask
    ? paragraphOrder.every((s, idx) => s === kitabah.paragraphOrderTask!.correctOrder[idx])
    : false;
  if (kitabah.paragraphOrderTask && isParaOrderCorrect) {
    correctObjective += 1;
  }

  const objectiveScore = calculateScoreFromCounts(correctObjective, totalObjective);

  const handleCheckObjective = () => {
    setObjectiveSubmitted(true);
    const stars = writingFeedback
      ? Math.round((calculateStars(objectiveScore) + writingFeedback.stars) / 2)
      : calculateStars(objectiveScore);
    onSaveProgress({
      completed: true,
      correctCount: correctObjective,
      totalQuestions: totalObjective,
      score: objectiveScore,
      stars,
      points: correctObjective * (isMiddle ? 20 : 15) + (writingFeedback ? writingFeedback.stars * 15 : 0),
      feedbackNote: writingFeedback?.encouragement,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleEvaluateFreeWriting = async () => {
    if (!freeWritingText.trim()) return;
    setEvalError(null);
    setIsEvaluating(true);
    try {
      const res = await fetch("/api/evaluate-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          darsTitle: `${dars.titleArabic} (${dars.titleIndonesian})`,
          taskPrompt: kitabah.freeWritingTask.instruction,
          guidancePoints: kitabah.freeWritingTask.guidancePoints,
          studentText: freeWritingText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEvalError(data.error || "Gagal mengevaluasi tulisan.");
        return;
      }
      const fb: WritingFeedback = {
        vocabularyFeedback: data.vocabularyFeedback,
        structureFeedback: data.structureFeedback,
        relevanceFeedback: data.relevanceFeedback,
        correctedExampleArabic: data.correctedExampleArabic,
        encouragement: data.encouragement,
        stars: Math.min(3, Math.max(1, Number(data.stars) || 2)),
      };
      setWritingFeedback(fb);

      const finalScore = objectiveSubmitted
        ? Math.round(objectiveScore * 0.6 + (fb.stars / 3) * 100 * 0.4)
        : Math.round((fb.stars / 3) * 100);
      const finalStars = calculateStars(finalScore);
      onSaveProgress({
        completed: true,
        correctCount: correctObjective,
        totalQuestions: totalObjective,
        score: finalScore,
        stars: finalStars,
        points: (objectiveSubmitted ? correctObjective * 20 : 20) + fb.stars * 20,
        feedbackNote: fb.encouragement,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      setEvalError("Koneksi gagal saat mengevaluasi tulisan.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReset = () => {
    setWordOrders({});
    setCompletionInputs({});
    setParagraphOrder(
      kitabah.paragraphOrderTask ? [...kitabah.paragraphOrderTask.shuffledSentences] : []
    );
    setFreeWritingText("");
    setObjectiveSubmitted(false);
    setWritingFeedback(null);
    setEvalError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 ${
          isMiddle
            ? "bg-gradient-to-br from-teal-50/90 via-sky-50/75 to-orange-50/60 border-teal-200"
            : "bg-gradient-to-br from-indigo-50/90 via-sky-50/75 to-amber-50/60 border-indigo-200"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              مَهَارَةُ الْكِتَابَةِ · Keterampilan Menulis Bahasa Arab
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {dars.titleArabic} — {dars.titleIndonesian}
            </h2>
            <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
              Susun kata acak, lengkapi kalimat menggunakan keyboard Arab virtual beserta harakatnya, lalu tulis kalimatmu sendiri berdasarkan panduan.
            </p>
          </div>
          {savedProgress.completed && (
            <div className="bg-white/90 border border-slate-200 rounded-xl px-4 py-2 text-right">
              <div className="text-xs text-slate-500">Nilai Kitabah</div>
              <div className="text-lg font-bold text-slate-900 tabular-nums">
                {savedProgress.score} / 100
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Part 1: Word Ordering */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">
          Bagian 1: Menyusun Kata Acak Menjadi Kalimat
        </h3>
        {kitabah.wordOrderTasks.map((task, idx) => {
          const picked = wordOrders[task.id] ?? [];
          const builtSentence = picked.join(" ");
          const isMatch =
            normalizeArabicComparison(builtSentence) ===
            normalizeArabicComparison(task.correctSentence);

          return (
            <div key={task.id} className="rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="text-sm font-semibold text-slate-800">
                {idx + 1}. {task.instruction}
              </div>
              <div className="text-xs text-slate-500">Arti target: "{task.indonesianMeaning}"</div>

              {/* Built sentence RTL slot */}
              <div
                dir="rtl"
                className="min-h-[56px] rounded-xl bg-slate-50 border border-dashed border-slate-300 p-3 flex flex-wrap items-center gap-2"
              >
                {picked.length === 0 ? (
                  <span className="text-xs text-slate-400" dir="ltr">
                    Klik kata-kata di bawah secara berurutan dari kanan ke kiri...
                  </span>
                ) : (
                  picked.map((w, wIdx) => (
                    <button
                      key={`${w}-${wIdx}`}
                      type="button"
                      disabled={objectiveSubmitted}
                      onClick={() => handlePickWord(task.id, w)}
                      className={`px-3 py-1.5 rounded-lg font-arabic text-xl font-semibold border cursor-pointer ${
                        isMiddle
                          ? "bg-teal-50 border-teal-300 text-teal-950"
                          : "bg-indigo-50 border-indigo-300 text-indigo-950"
                      }`}
                    >
                      {w}
                    </button>
                  ))
                )}
              </div>

              {/* Word pool */}
              <div dir="rtl" className="flex flex-wrap gap-2">
                {task.shuffledWords.map((word) => {
                  const alreadyUsed = picked.includes(word);
                  return (
                    <button
                      key={word}
                      type="button"
                      disabled={objectiveSubmitted || alreadyUsed}
                      onClick={() => handlePickWord(task.id, word)}
                      className={`px-3.5 py-2 rounded-xl font-arabic text-xl font-semibold border transition-colors cursor-pointer disabled:opacity-40 ${
                        alreadyUsed
                          ? "bg-slate-100 border-slate-200 text-slate-400"
                          : "bg-white border-slate-300 hover:bg-slate-50 text-slate-900"
                      }`}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>

              {objectiveSubmitted && (
                <div
                  className={`text-xs font-medium flex flex-wrap items-center gap-2 ${
                    isMatch ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {isMatch ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Susunan kalimat tepat!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>Susunan yang tepat:</span>
                      <span dir="rtl" className="font-arabic text-base text-slate-900">
                        {task.correctSentence}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Part 2: Sentence Completion with Virtual Arabic Keyboard */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Bagian 2: Melengkapi Ungkapan & Kalimat
            </h3>
            <p className="text-sm text-slate-600">
              Klik kolom isian Arab lalu ketik menggunakan keyboard Arab virtual atau klik pilihan kosakata.
            </p>
          </div>
          {dars.id === 2 && isMiddle && (
            <div className="w-40 rounded-xl overflow-hidden border border-slate-200 shrink-0">
              <img
                src={dars.imagePath}
                alt="Gambar tas dan peralatan sekolah"
                referrerPolicy="no-referrer"
                className="w-full h-24 object-cover"
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          {kitabah.completionTasks.map((c) => {
            const val = completionInputs[c.id] ?? "";
            const isMatch = isArabicAnswerMatch(val, c.acceptedAnswers);
            const isFocused = activeKeyboardTarget === "completion" && activeCompletionId === c.id;

            return (
              <div
                key={c.id}
                className={`rounded-xl border p-4 space-y-3 transition-colors ${
                  isFocused ? "border-teal-400 bg-teal-50/20" : "border-slate-200"
                }`}
              >
                <div className="text-sm font-semibold text-slate-800">{c.instruction}</div>
                <div dir="rtl" className="flex flex-wrap items-center gap-2 font-arabic text-xl text-slate-900">
                  <span>{c.promptBefore}</span>
                  <input
                    type="text"
                    dir="rtl"
                    disabled={objectiveSubmitted}
                    value={val}
                    onFocus={() => {
                      setActiveCompletionId(c.id);
                      setActiveKeyboardTarget("completion");
                    }}
                    onChange={(e) =>
                      setCompletionInputs((prev) => ({ ...prev, [c.id]: e.target.value }))
                    }
                    placeholder="اُكْتُبْ هُنَا"
                    className="w-44 sm:w-56 px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-arabic text-xl text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <span>{c.promptAfter}</span>
                </div>

                <div className="text-xs text-slate-500">Petunjuk: {c.hintIndonesian}</div>

                {c.wordBank && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500">Pilihan bantu:</span>
                    {c.wordBank.map((wb) => (
                      <button
                        key={wb}
                        type="button"
                        disabled={objectiveSubmitted}
                        onClick={() =>
                          setCompletionInputs((prev) => ({ ...prev, [c.id]: wb }))
                        }
                        className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-arabic text-lg text-slate-800 cursor-pointer"
                      >
                        {wb}
                      </button>
                    ))}
                  </div>
                )}

                {objectiveSubmitted && (
                  <p className={`text-xs font-medium ${isMatch ? "text-emerald-700" : "text-rose-700"}`}>
                    {isMatch ? "Tepat sekali! " : `Jawaban model: ${c.modelAnswer}`}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Optional Part 2b: Paragraph Ordering (Middle Dars 3) */}
        {kitabah.paragraphOrderTask && (
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h4 className="text-base font-bold text-slate-900">
              Bagian 2B: Mengurutkan Kalimat Kegiatan Sehari-hari
            </h4>
            <p className="text-sm text-slate-600">{kitabah.paragraphOrderTask.instruction}</p>
            <div className="space-y-2">
              {paragraphOrder.map((s, idx) => (
                <div
                  key={s}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-xs font-bold flex items-center justify-center tabular-nums">
                      {idx + 1}
                    </span>
                    <button
                      type="button"
                      disabled={objectiveSubmitted || idx === 0}
                      onClick={() => moveParagraphSentence(idx, -1)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={objectiveSubmitted || idx === paragraphOrder.length - 1}
                      onClick={() => moveParagraphSentence(idx, 1)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                  <p dir="rtl" className="font-arabic text-lg text-slate-900 text-right flex-1">
                    {s}
                  </p>
                </div>
              ))}
            </div>
            {objectiveSubmitted && (
              <p className={`text-xs font-medium ${isParaOrderCorrect ? "text-emerald-700" : "text-rose-700"}`}>
                {isParaOrderCorrect
                  ? "Urutan aktivitas harian tepat!"
                  : kitabah.paragraphOrderTask.indonesianSummary}
              </p>
            )}
          </div>
        )}

        {/* Check Objective Button */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          {objectiveSubmitted ? (
            <div className="text-sm font-semibold text-slate-800 tabular-nums">
              Nilai Bagian 1 & 2: {objectiveScore} / 100 (Benar {correctObjective} dari {totalObjective})
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              Periksa jawaban susun kata dan kelengkapan kalimat sebelum lanjut menulis bebas.
            </div>
          )}
          <button
            type="button"
            onClick={handleCheckObjective}
            disabled={objectiveSubmitted}
            className={`px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-50 ${
              isMiddle ? "bg-teal-600 hover:bg-teal-700" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {objectiveSubmitted ? "Sudah Diperiksa" : "Periksa Bagian 1 & 2"}
          </button>
        </div>
      </div>

      {/* Part 3: Guided Independent Writing + Virtual Arabic Keyboard */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{kitabah.freeWritingTask.title}</h3>
          <p className="text-sm text-slate-600 mt-1">{kitabah.freeWritingTask.instruction}</p>
        </div>

        {/* Given Info & Guidance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
            <div className="text-xs font-bold text-slate-700">Informasi Panduan:</div>
            {kitabah.freeWritingTask.givenInfoCard.map((info, i) => (
              <div key={i} className="text-xs flex flex-wrap justify-between gap-2 border-b border-slate-200/70 pb-1.5 last:border-0">
                <span className="font-semibold text-slate-600">{info.label}</span>
                <span dir="rtl" className="font-arabic text-base text-slate-900">
                  {info.value}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1.5">
            <div className="text-xs font-bold text-slate-700">Poin yang Perlu Ditulis:</div>
            <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
              {kitabah.freeWritingTask.guidancePoints.map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* RTL Arabic Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="kitabah-editor" className="text-xs font-semibold text-slate-700">
              Lembar Menulis Bahasa Arab (RTL)
            </label>
            <span className="text-xs text-slate-500">
              Target ketikan keyboard:{" "}
              <strong>
                {activeKeyboardTarget === "freeWriting" ? "Lembar Menulis Bebas" : "Kolom Isian Bagian 2"}
              </strong>
            </span>
          </div>
          <textarea
            id="kitabah-editor"
            dir="rtl"
            rows={4}
            value={freeWritingText}
            onFocus={() => setActiveKeyboardTarget("freeWriting")}
            onChange={(e) => setFreeWritingText(e.target.value)}
            placeholder="اُكْتُبِ الْجُمَلَ الْعَرَبِيَّةَ هُنَا..."
            className="w-full rounded-2xl border border-slate-300 p-4 font-arabic text-2xl text-slate-900 leading-loose focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Virtual Arabic Keyboard */}
        <ArabicKeyboard
          value={
            activeKeyboardTarget === "freeWriting"
              ? freeWritingText
              : completionInputs[activeCompletionId] ?? ""
          }
          onChange={(nextVal) => {
            if (activeKeyboardTarget === "freeWriting") {
              setFreeWritingText(nextVal);
            } else if (activeCompletionId) {
              setCompletionInputs((prev) => ({ ...prev, [activeCompletionId]: nextVal }));
            }
          }}
          level={level}
        />

        {evalError && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900">
            {evalError}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ulangi Semua</span>
          </button>

          <button
            type="button"
            onClick={handleEvaluateFreeWriting}
            disabled={isEvaluating || !freeWritingText.trim()}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-50 ${
              isMiddle ? "bg-teal-600 hover:bg-teal-700" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isEvaluating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{isEvaluating ? "Memeriksa Tulisan..." : "Kirim & Dapatkan Umpan Balik AI"}</span>
          </button>
        </div>

        {/* AI Formative Writing Feedback */}
        {writingFeedback && (
          <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-5 space-y-4 mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-bold text-slate-900">
                Umpan Balik Menulis (Ketepatan Kosakata, Struktur, & Kesesuaian)
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-5 h-5 ${
                      s <= writingFeedback.stars ? "fill-amber-400 text-amber-400" : "text-slate-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl bg-white border border-slate-200 p-3.5">
                <div className="font-semibold text-slate-800 mb-1">Ketepatan Kosakata</div>
                <p className="text-slate-600">{writingFeedback.vocabularyFeedback}</p>
              </div>
              <div className="rounded-xl bg-white border border-slate-200 p-3.5">
                <div className="font-semibold text-slate-800 mb-1">Struktur Kalimat</div>
                <p className="text-slate-600">{writingFeedback.structureFeedback}</p>
              </div>
              <div className="rounded-xl bg-white border border-slate-200 p-3.5">
                <div className="font-semibold text-slate-800 mb-1">Kesesuaian Jawaban</div>
                <p className="text-slate-600">{writingFeedback.relevanceFeedback}</p>
              </div>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-1">
              <div className="text-xs font-semibold text-slate-500">Contoh Kalimat Perbaikan / Model:</div>
              <p dir="rtl" className="font-arabic text-xl text-slate-900">
                {writingFeedback.correctedExampleArabic}
              </p>
              <p className="text-xs text-slate-600 pt-1">{writingFeedback.encouragement}</p>
            </div>

            <p className="text-xs text-slate-500">
              Catatan: Penilaian otomatis tulisan ini bersifat umpan balik formatif untuk membimbing latihan mandiri, bukan pengukuran mutlak kemampuan produktif siswa.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
