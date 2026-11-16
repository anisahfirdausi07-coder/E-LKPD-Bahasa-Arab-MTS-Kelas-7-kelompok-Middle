import { useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, CheckCircle2, Languages, RotateCcw, Star, XCircle } from "lucide-react";
import type { DarsData, LearningLevel, MaharahProgress } from "../types";
import { calculateScoreFromCounts, calculateStars } from "../utils/storage";
import { AudioPlayer } from "./AudioPlayer";

interface QiraahViewProps {
  dars: DarsData;
  level: LearningLevel;
  savedProgress: MaharahProgress;
  onSaveProgress: (progress: MaharahProgress) => void;
}

export function QiraahView({ dars, level, savedProgress, onSaveProgress }: QiraahViewProps) {
  const isMiddle = level === "middle";
  const qiraah = dars.qiraah;

  const [showTranslation, setShowTranslation] = useState(false);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, "أ" | "ب" | "ج" | "د">>({});
  const [tfAnswers, setTfAnswers] = useState<Record<string, boolean>>({});
  const [fbAnswers, setFbAnswers] = useState<Record<string, string>>({});
  const [cvAnswers, setCvAnswers] = useState<Record<string, "أ" | "ب" | "ج" | "د">>({});
  const [orderedSentences, setOrderedSentences] = useState<string[]>(
    qiraah.sentenceOrderTask ? [...qiraah.sentenceOrderTask.shuffledArabic] : []
  );
  const [submitted, setSubmitted] = useState(false);

  const fullArabicPassage = qiraah.paragraphsArabic.join(" ");

  const moveSentence = (index: number, direction: -1 | 1) => {
    if (submitted) return;
    const target = index + direction;
    if (target < 0 || target >= orderedSentences.length) return;
    const copy = [...orderedSentences];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    setOrderedSentences(copy);
  };

  // Compute objective tally
  const totalObjectiveItems =
    qiraah.comprehensionQuestions.length +
    qiraah.trueFalseItems.length +
    qiraah.fillBlankItems.length +
    (qiraah.contextVocabItems?.length ?? 0) +
    (qiraah.sentenceOrderTask ? 1 : 0);

  let correctCount = 0;
  for (const q of qiraah.comprehensionQuestions) {
    if (mcqAnswers[q.id] === q.correctLetter) correctCount += 1;
  }
  for (const tf of qiraah.trueFalseItems) {
    if (tfAnswers[tf.id] === tf.isTrue) correctCount += 1;
  }
  for (const fb of qiraah.fillBlankItems) {
    if (fbAnswers[fb.id] === fb.correctAnswer) correctCount += 1;
  }
  for (const cv of qiraah.contextVocabItems ?? []) {
    if (cvAnswers[cv.id] === cv.correctLetter) correctCount += 1;
  }
  const isOrderCorrect = qiraah.sentenceOrderTask
    ? orderedSentences.every((s, idx) => s === qiraah.sentenceOrderTask!.correctOrderArabic[idx])
    : false;
  if (qiraah.sentenceOrderTask && isOrderCorrect) {
    correctCount += 1;
  }

  const wrongCount = totalObjectiveItems - correctCount;
  const computedScore = calculateScoreFromCounts(correctCount, totalObjectiveItems);
  const earnedStars = calculateStars(computedScore);

  const handleSubmit = () => {
    setSubmitted(true);
    onSaveProgress({
      completed: true,
      correctCount,
      totalQuestions: totalObjectiveItems,
      score: computedScore,
      stars: earnedStars,
      points: correctCount * (isMiddle ? 15 : 12),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleReset = () => {
    setMcqAnswers({});
    setTfAnswers({});
    setFbAnswers({});
    setCvAnswers({});
    setOrderedSentences(
      qiraah.sentenceOrderTask ? [...qiraah.sentenceOrderTask.shuffledArabic] : []
    );
    setSubmitted(false);
  };

  return (
    <div className="space-y-6">
      {/* Reading Passage Card */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 space-y-5 ${
          isMiddle
            ? "bg-gradient-to-br from-teal-50/85 via-sky-50/70 to-orange-50/50 border-teal-200"
            : "bg-gradient-to-br from-indigo-50/85 via-sky-50/70 to-amber-50/50 border-indigo-200"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              مَهَارَةُ الْقِرَاءَةِ · Teks Bacaan Berharakat & Pemahaman
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              <span className="font-arabic text-2xl sm:text-3xl mr-2">{qiraah.titleArabic}</span>
              <span className="text-slate-600 font-medium text-base sm:text-lg">
                — {qiraah.titleIndonesian}
              </span>
            </h2>
          </div>

          {savedProgress.completed && (
            <div className="bg-white/90 border border-slate-200 rounded-xl px-4 py-2 text-right">
              <div className="text-xs text-slate-500">Nilai Qira'ah</div>
              <div className="text-lg font-bold text-slate-900 tabular-nums">
                {savedProgress.score} / 100
              </div>
            </div>
          )}
        </div>

        <AudioPlayer
          textArabic={fullArabicPassage}
          label="Dengarkan Audio Bacaan Teks"
          level={level}
        />

        {/* Arabic Paragraphs */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-7 space-y-4">
          {qiraah.paragraphsArabic.map((para, idx) => (
            <p
              key={idx}
              dir="rtl"
              className="font-arabic text-xl sm:text-2xl text-slate-900 leading-[2.2] text-right"
            >
              {para}
            </p>
          ))}

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowTranslation((prev) => !prev)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
            >
              <Languages className="w-4 h-4" />
              <span>{showTranslation ? "Sembunyikan Terjemahan" : "Lihat Terjemahan Bahasa Indonesia"}</span>
            </button>
          </div>

          {showTranslation && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-sm text-slate-700 leading-relaxed">
              <div className="font-bold text-slate-800">Terjemahan Teks:</div>
              {qiraah.translationIndonesian.map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </div>
          )}
        </div>

        {/* Key Vocabulary */}
        <div className="rounded-2xl bg-white/90 border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className={`w-4 h-4 ${isMiddle ? "text-teal-600" : "text-indigo-600"}`} />
            <h3 className="text-sm font-bold text-slate-900">
              الْمُفْرَدَاتُ الْمُهِمَّةُ — Kosakata Penting
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {qiraah.vocabulary.map((v, i) => (
              <div key={i} className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                <div dir="rtl" className="font-arabic text-lg font-bold text-slate-900">
                  {v.arabic}
                </div>
                <div className="text-xs font-semibold text-slate-700">{v.indonesian}</div>
                {v.exampleArabic && (
                  <div dir="rtl" className="font-arabic text-sm text-slate-500 mt-1">
                    {v.exampleArabic}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 1: Comprehension Questions */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Bagian A: Pemahaman Bacaan ({qiraah.comprehensionQuestions.length} Soal)
          </h3>
          <p className="text-sm text-slate-600">
            Jawablah pertanyaan berikut berdasarkan informasi di dalam teks bacaan.
          </p>
        </div>

        <div className="space-y-4">
          {qiraah.comprehensionQuestions.map((q, idx) => {
            const chosen = mcqAnswers[q.id];
            const isCorrect = chosen === q.correctLetter;
            return (
              <div key={q.id} className="rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">Pertanyaan {idx + 1}</span>
                </div>
                <p dir="rtl" className="font-arabic text-xl font-semibold text-slate-900 text-right">
                  {q.questionArabic}
                </p>
                <p className="text-sm text-slate-600">{q.questionIndonesian}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt) => {
                    const selected = chosen === opt.letter;
                    const right = opt.letter === q.correctLetter;
                    let cls = "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800";
                    if (!submitted && selected) {
                      cls = isMiddle
                        ? "bg-teal-50 border-teal-500 ring-1 ring-teal-500"
                        : "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500";
                    } else if (submitted) {
                      if (right) cls = "bg-emerald-50 border-emerald-500 text-emerald-950";
                      else if (selected) cls = "bg-rose-50 border-rose-400 text-rose-950";
                    }
                    return (
                      <button
                        key={opt.letter}
                        type="button"
                        disabled={submitted}
                        onClick={() => setMcqAnswers((prev) => ({ ...prev, [q.id]: opt.letter }))}
                        className={`rounded-xl border p-3 flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default ${cls}`}
                      >
                        <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-arabic font-bold text-slate-700 flex items-center justify-center shrink-0">
                          {opt.letter}
                        </span>
                        <span dir="rtl" className="font-arabic text-lg font-medium text-right flex-1">
                          {opt.text}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {submitted && (
                  <p className={`text-xs font-medium ${isCorrect ? "text-emerald-700" : "text-rose-700"}`}>
                    {isCorrect ? "Benar! " : `Kunci: ${q.correctLetter}. `}
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: True / False */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">
          Bagian B: Tentukan Benar (صَحِيح) atau Salah (خَطَأ)
        </h3>
        <div className="space-y-3">
          {qiraah.trueFalseItems.map((tf, idx) => {
            const chosen = tfAnswers[tf.id];
            const isCorrect = chosen === tf.isTrue;
            return (
              <div key={tf.id} className="rounded-xl border border-slate-200 p-4 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <span className="text-xs text-slate-500">Pernyataan {idx + 1}</span>
                    <p dir="rtl" className="font-arabic text-lg font-semibold text-slate-900 text-right">
                      {tf.statementArabic}
                    </p>
                    <p className="text-xs text-slate-600">{tf.statementIndonesian}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {[
                      { val: true, label: "صَحِيح (Benar)" },
                      { val: false, label: "خَطَأ (Salah)" },
                    ].map((btn) => {
                      const active = chosen === btn.val;
                      return (
                        <button
                          key={String(btn.val)}
                          type="button"
                          disabled={submitted}
                          onClick={() => setTfAnswers((prev) => ({ ...prev, [tf.id]: btn.val }))}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer disabled:cursor-default ${
                            active
                              ? isMiddle
                                ? "bg-teal-600 text-white border-teal-600"
                                : "bg-indigo-600 text-white border-indigo-600"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {submitted && (
                  <p className={`text-xs font-medium ${isCorrect ? "text-emerald-700" : "text-rose-700"}`}>
                    {isCorrect ? "Tepat! " : `Seharusnya: ${tf.isTrue ? "صَحِيح (Benar)" : "خَطَأ (Salah)"}. `}
                    {tf.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Fill in the Blank */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">
          Bagian C: Melengkapi Kalimat Berdasarkan Teks
        </h3>
        <div className="space-y-3">
          {qiraah.fillBlankItems.map((fb) => {
            const chosen = fbAnswers[fb.id];
            const isCorrect = chosen === fb.correctAnswer;
            return (
              <div key={fb.id} className="rounded-xl border border-slate-200 p-4 space-y-3">
                <p dir="rtl" className="font-arabic text-xl text-slate-900 text-right">
                  {fb.sentenceBefore}{" "}
                  <span className="inline-block min-w-[90px] px-3 py-0.5 mx-1 rounded-lg border-b-2 border-teal-500 bg-teal-50/60 text-center font-bold">
                    {chosen || "....."}
                  </span>{" "}
                  {fb.sentenceAfter}
                </p>
                <div className="text-xs text-slate-500">Petunjuk arti: {fb.hintIndonesian}</div>
                <div className="flex flex-wrap gap-2">
                  {fb.choices.map((c) => (
                    <button
                      key={c}
                      type="button"
                      disabled={submitted}
                      onClick={() => setFbAnswers((prev) => ({ ...prev, [fb.id]: c }))}
                      className={`px-4 py-2 rounded-xl font-arabic text-lg font-semibold border cursor-pointer disabled:cursor-default ${
                        chosen === c
                          ? isMiddle
                            ? "bg-teal-600 text-white border-teal-600"
                            : "bg-indigo-600 text-white border-indigo-600"
                          : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                {submitted && (
                  <p className={`text-xs font-medium ${isCorrect ? "text-emerald-700" : "text-rose-700"}`}>
                    {isCorrect ? "Benar! " : `Jawaban tepat: ${fb.correctAnswer}. `}
                    {fb.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4 (Middle): Contextual Vocabulary Meaning */}
      {qiraah.contextVocabItems && qiraah.contextVocabItems.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900">
            Bagian D: Menentukan Makna Kosakata Sesuai Konteks
          </h3>
          {qiraah.contextVocabItems.map((cv) => {
            const chosen = cvAnswers[cv.id];
            const isCorrect = chosen === cv.correctLetter;
            return (
              <div key={cv.id} className="rounded-xl border border-slate-200 p-4 space-y-3">
                <p dir="rtl" className="font-arabic text-xl text-slate-900 text-right bg-slate-50 rounded-xl p-3">
                  {cv.sentenceArabic}
                </p>
                <p className="text-sm font-semibold text-slate-800">{cv.questionIndonesian}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {cv.options.map((opt) => (
                    <button
                      key={opt.letter}
                      type="button"
                      disabled={submitted}
                      onClick={() => setCvAnswers((prev) => ({ ...prev, [cv.id]: opt.letter }))}
                      className={`text-left rounded-xl border p-3 flex items-center gap-2.5 cursor-pointer disabled:cursor-default ${
                        chosen === opt.letter
                          ? "bg-teal-50 border-teal-500 ring-1 ring-teal-500 text-teal-950"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800"
                      }`}
                    >
                      <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-arabic font-bold flex items-center justify-center shrink-0">
                        {opt.letter}
                      </span>
                      <span className="text-sm">{opt.text}</span>
                    </button>
                  ))}
                </div>
                {submitted && (
                  <p className={`text-xs font-medium ${isCorrect ? "text-emerald-700" : "text-rose-700"}`}>
                    {isCorrect ? "Tepat! " : `Kunci: ${cv.correctLetter}. `}
                    {cv.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Section 5 (Middle): Sentence Ordering into Paragraph */}
      {qiraah.sentenceOrderTask && (
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Bagian E: Mengurutkan Kalimat Menjadi Paragraf yang Runtut
            </h3>
            <p className="text-sm text-slate-600">{qiraah.sentenceOrderTask.instruction}</p>
          </div>
          <div className="space-y-2.5">
            {orderedSentences.map((sentence, idx) => (
              <div
                key={sentence}
                className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 shrink-0">
                  <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center tabular-nums">
                    {idx + 1}
                  </span>
                  <button
                    type="button"
                    disabled={submitted || idx === 0}
                    onClick={() => moveSentence(idx, -1)}
                    aria-label="Geser ke atas"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={submitted || idx === orderedSentences.length - 1}
                    onClick={() => moveSentence(idx, 1)}
                    aria-label="Geser ke bawah"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
                <p dir="rtl" className="font-arabic text-lg sm:text-xl text-slate-900 text-right flex-1">
                  {sentence}
                </p>
              </div>
            ))}
          </div>

          {submitted && (
            <div
              className={`rounded-xl p-4 border text-sm space-y-2 ${
                isOrderCorrect
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {isOrderCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Urutan paragrafmu sudah tepat!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Urutan masih belum runtut. Perhatikan urutan yang benar:</span>
                  </>
                )}
              </div>
              {!isOrderCorrect && (
                <ol dir="rtl" className="list-decimal list-inside font-arabic text-lg space-y-1 text-slate-800">
                  {qiraah.sentenceOrderTask.correctOrderArabic.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              )}
              <p className="text-xs text-slate-600">Makna paragraf: {qiraah.sentenceOrderTask.indonesianMeaning}</p>
            </div>
          )}
        </div>
      )}

      {/* Final Score Action */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        {!submitted ? (
          <>
            <div className="text-sm text-slate-600">
              Total butir evaluasi Qira'ah: <strong className="text-slate-900">{totalObjectiveItems}</strong>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer ${
                isMiddle ? "bg-teal-600 hover:bg-teal-700" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              Periksa Semua Latihan Qira'ah
            </button>
          </>
        ) : (
          <div className="w-full flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500">Hasil Penilaian الْقِرَاءَةُ</p>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl font-bold text-slate-900 tabular-nums">{computedScore}</span>
                <span className="text-sm text-slate-600 tabular-nums">
                  Benar: {correctCount} · Salah: {wrongCount} · Rumus: ({correctCount}/{totalObjectiveItems}) × 100
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
        )}
      </div>
    </div>
  );
}
