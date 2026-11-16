import { useState } from "react";
import { CheckCircle2, Eye, RotateCcw, Star, XCircle } from "lucide-react";
import type { DarsData, LearningLevel, MaharahProgress } from "../types";
import { calculateScoreFromCounts, calculateStars } from "../utils/storage";
import { AudioPlayer } from "./AudioPlayer";

interface IstimaViewProps {
  dars: DarsData;
  level: LearningLevel;
  savedProgress: MaharahProgress;
  onSaveProgress: (progress: MaharahProgress) => void;
}

export function IstimaView({ dars, level, savedProgress, onSaveProgress }: IstimaViewProps) {
  const isMiddle = level === "middle";
  const questions = dars.istima;
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, "أ" | "ب" | "ج" | "د">>({});
  const [revealedTranscripts, setRevealedTranscripts] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const answeredCount = Object.keys(selectedAnswers).length;
  const allAnswered = answeredCount === questions.length;

  const correctCount = questions.reduce((acc, q) => {
    return acc + (selectedAnswers[q.id] === q.correctLetter ? 1 : 0);
  }, 0);
  const wrongCount = questions.length - correctCount;
  const computedScore = calculateScoreFromCounts(correctCount, questions.length);
  const earnedStars = calculateStars(computedScore);

  const handleSelect = (questionId: string, letter: "أ" | "ب" | "ج" | "د") => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: letter }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const points = correctCount * (isMiddle ? 15 : 10);
    onSaveProgress({
      completed: true,
      correctCount,
      totalQuestions: questions.length,
      score: computedScore,
      stars: earnedStars,
      points,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setRevealedTranscripts({});
    setSubmitted(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 ${
          isMiddle
            ? "bg-gradient-to-br from-teal-50/90 via-sky-50/80 to-orange-50/60 border-teal-200"
            : "bg-gradient-to-br from-indigo-50/90 via-sky-50/80 to-amber-50/60 border-indigo-200"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              مَهَارَةُ الِاسْتِمَاعِ · Keterampilan Menyimak · {questions.length} Soal
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {dars.titleArabic} — {dars.titleIndonesian}
            </h2>
            <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
              {isMiddle
                ? "Dengarkan audio kalimat dan paragraf pendek dengan saksama. Pahami informasi utama, detail, dan makna kosakata dalam konteks sebelum memilih jawaban أ، ب، ج، atau د."
                : "Putar audio kosakata dan ungkapan sederhana di bawah ini, lalu pilih jawaban yang paling tepat."}
            </p>
          </div>
          {savedProgress.completed && (
            <div className="bg-white/90 border border-slate-200 rounded-xl px-4 py-2.5 text-right shrink-0">
              <div className="text-xs text-slate-500">Nilai Tersimpan</div>
              <div className="text-xl font-bold text-slate-900 tabular-nums">
                {savedProgress.score} / 100
              </div>
              <div className="flex items-center justify-end gap-0.5 mt-0.5">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= savedProgress.stars
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Middle section split guide */}
      {isMiddle && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-white border border-teal-100 p-3.5">
            <span className="font-semibold text-teal-800">Bagian 1 (Soal 1–5):</span>{" "}
            <span className="text-slate-600">Menyimak kosakata dalam konteks kalimat informatif.</span>
          </div>
          <div className="rounded-xl bg-white border border-orange-100 p-3.5">
            <span className="font-semibold text-orange-800">Bagian 2 (Soal 6–10):</span>{" "}
            <span className="text-slate-600">Menyimak kalimat panjang & paragraf pendek (ide utama & rinci).</span>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-5">
        {questions.map((q, index) => {
          const chosen = selectedAnswers[q.id];
          const isCorrect = chosen === q.correctLetter;
          const showTranscript = submitted || revealedTranscripts[q.id];

          return (
            <div
              key={q.id}
              className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  Soal {index + 1} dari {questions.length} · {q.categoryLabel}
                </span>
                {q.visualCue && <span>Petunjuk: {q.visualCue}</span>}
              </div>

              <AudioPlayer
                textArabic={q.audioTextArabic}
                label={`Dengarkan Audio Soal ${index + 1}`}
                level={level}
              />

              <p className="text-base font-semibold text-slate-900">{q.questionPrompt}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {q.options.map((opt) => {
                  const isSelected = chosen === opt.letter;
                  const isRightOption = opt.letter === q.correctLetter;

                  let btnStyle =
                    "bg-slate-50/70 border-slate-200 hover:bg-slate-100/80 text-slate-800";
                  if (!submitted && isSelected) {
                    btnStyle = isMiddle
                      ? "bg-teal-50 border-teal-500 text-teal-950 ring-1 ring-teal-500"
                      : "bg-indigo-50 border-indigo-500 text-indigo-950 ring-1 ring-indigo-500";
                  } else if (submitted) {
                    if (isRightOption) {
                      btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-950";
                    } else if (isSelected && !isRightOption) {
                      btnStyle = "bg-rose-50 border-rose-400 text-rose-950";
                    } else {
                      btnStyle = "bg-slate-50/50 border-slate-200 text-slate-500";
                    }
                  }

                  return (
                    <button
                      key={opt.letter}
                      type="button"
                      onClick={() => handleSelect(q.id, opt.letter)}
                      disabled={submitted}
                      className={`text-left rounded-xl border p-3.5 transition-colors flex items-start gap-3 cursor-pointer disabled:cursor-default ${btnStyle}`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-arabic text-lg font-bold shrink-0 ${
                          isSelected
                            ? isMiddle
                              ? "bg-teal-600 text-white"
                              : "bg-indigo-600 text-white"
                            : "bg-white border border-slate-200 text-slate-700"
                        }`}
                      >
                        {opt.letter}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm sm:text-base font-medium leading-relaxed">
                          {opt.text}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Feedback & Transcript after submit */}
              {submitted && (
                <div
                  className={`rounded-xl p-4 border text-sm space-y-2 ${
                    isCorrect
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                      : "bg-rose-50/70 border-rose-200 text-rose-900"
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Jawaban Benar ({q.correctLetter})</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Kurang Tepat · Kunci Jawaban: {q.correctLetter}</span>
                      </>
                    )}
                  </div>
                  <p className="text-slate-700">{q.explanation}</p>
                  {showTranscript && (
                    <div className="pt-2 border-t border-slate-200/70">
                      <span className="text-xs font-semibold text-slate-500 block mb-1">
                        Transkrip Audio:
                      </span>
                      <p dir="rtl" className="font-arabic text-lg text-slate-900">
                        {q.audioTextArabic}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!submitted && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setRevealedTranscripts((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{showTranscript ? "Sembunyikan Teks Audio" : "Lihat Bantuan Teks"}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action & Score Summary Footer */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        {!submitted ? (
          <>
            <div className="text-sm text-slate-600 tabular-nums">
              Terjawab: <strong className="text-slate-900">{answeredCount}</strong> dari{" "}
              <strong className="text-slate-900">{questions.length}</strong> soal
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allAnswered}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isMiddle ? "bg-teal-600 hover:bg-teal-700" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {allAnswered ? "Periksa Jawaban & Hitung Nilai" : "Jawab Semua Soal Dahulu"}
            </button>
          </>
        ) : (
          <div className="w-full space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500">Hasil Penilaian الِاسْتِمَاعُ</p>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-3xl font-bold text-slate-900 tabular-nums">
                    {computedScore}
                  </span>
                  <span className="text-sm text-slate-600 tabular-nums">
                    Benar: {correctCount} · Salah: {wrongCount} · Rumus: ({correctCount}/{questions.length}) × 100
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className={`w-6 h-6 ${
                        s <= earnedStars ? "fill-amber-400 text-amber-400" : "text-slate-300"
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Ulangi Latihan</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
