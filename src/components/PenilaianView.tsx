import { useState } from "react";
import { RotateCcw, Star } from "lucide-react";
import type { DarsId, LearningLevel, LevelCurriculum, LevelProgressState, MaharahId } from "../types";
import { computeDarsSummary, computeLevelTotals } from "../utils/storage";

interface PenilaianViewProps {
  curriculum: LevelCurriculum;
  progress: LevelProgressState;
  onOpenActivity: (darsId: DarsId, maharahId: MaharahId) => void;
  onResetProgress: () => void;
}

const MAHARAH_META: Array<{ id: MaharahId; arabic: string; indonesian: string }> = [
  { id: "istima", arabic: "الِاسْتِمَاعُ", indonesian: "Istima'" },
  { id: "kalam", arabic: "الْكَلَامُ", indonesian: "Kalam" },
  { id: "qiraah", arabic: "الْقِرَاءَةُ", indonesian: "Qira'ah" },
  { id: "kitabah", arabic: "الْكِتَابَةُ", indonesian: "Kitabah" },
];

export function PenilaianView({
  curriculum,
  progress,
  onOpenActivity,
  onResetProgress,
}: PenilaianViewProps) {
  const [confirmReset, setConfirmReset] = useState(false);
  const isMiddle = curriculum.level === "middle";
  const totals = computeLevelTotals(progress);

  return (
    <div className="space-y-6">
      {/* Level Score Summary Banner */}
      <div
        className={`rounded-2xl border p-6 ${
          isMiddle
            ? "bg-gradient-to-br from-teal-50 via-sky-50 to-orange-50/70 border-teal-200"
            : "bg-gradient-to-br from-indigo-50 via-sky-50 to-rose-50/60 border-indigo-200"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Rekap Penilaian Terpisah · {curriculum.labelArabic} · {progress.studentName}
            </p>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Rapor Kemajuan Belajar ({curriculum.labelIndonesian})
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Rumus nilai objektif: <span className="font-semibold">Nilai = (Jumlah jawaban benar / Jumlah seluruh soal) × 100</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Progres {isMiddle ? "Middle" : "Low"}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-white border border-rose-200 rounded-xl px-3 py-1.5">
                <span className="text-xs font-medium text-rose-800">Hapus progres level ini?</span>
                <button
                  type="button"
                  onClick={() => {
                    onResetProgress();
                    setConfirmReset(false);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                >
                  Ya, Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 4 Summary Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="rounded-xl bg-white border border-slate-200/80 p-4">
            <div className="text-xs text-slate-500">Rata-rata Nilai</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {totals.overallAverageScore} / 100
            </div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200/80 p-4">
            <div className="text-xs text-slate-500">Aktivitas Selesai</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {totals.completedActivities} / {totals.totalActivities}
            </div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200/80 p-4">
            <div className="text-xs text-slate-500">Total Poin</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {totals.totalPoints} Poin
            </div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200/80 p-4">
            <div className="text-xs text-slate-500">Bintang Terkumpul</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums flex items-center gap-1.5">
              <span>
                {totals.totalStars} / {totals.maxStars}
              </span>
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Per-Dars Breakdown Table */}
      <div className="space-y-4">
        {curriculum.darsList.map((dars) => {
          const darsProg = progress.dars[dars.id];
          const summary = computeDarsSummary(darsProg);

          return (
            <div key={dars.id} className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-500">
                    Dars {dars.id} · Progres {summary.completionPercent}%
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    <span className="font-arabic text-2xl mr-2">{dars.titleArabic}</span>
                    <span>— {dars.titleIndonesian}</span>
                  </h3>
                </div>
                <div className="text-right tabular-nums">
                  <div className="text-xs text-slate-500">Rata-rata Dars</div>
                  <div className="text-xl font-bold text-slate-900">{summary.averageScore}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {MAHARAH_META.map((m) => {
                  const mp = darsProg[m.id];
                  const wrong = Math.max(0, mp.totalQuestions - mp.correctCount);
                  return (
                    <div
                      key={m.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-arabic text-lg font-bold text-slate-900">
                            {m.arabic}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {m.indonesian}
                          </span>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between tabular-nums">
                          <span className="text-2xl font-bold text-slate-900">
                            {mp.completed ? mp.score : "—"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {mp.completed ? `${mp.points} poin` : "Belum dikerjakan"}
                          </span>
                        </div>
                        {mp.completed && (m.id === "istima" || m.id === "qiraah" || m.id === "kitabah") && (
                          <p className="text-xs text-slate-500 mt-1 tabular-nums">
                            Benar: {mp.correctCount} · Salah: {wrong}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${
                                s <= mp.stars ? "fill-amber-400 text-amber-400" : "text-slate-300"
                              }`}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => onOpenActivity(dars.id, m.id)}
                          className={`text-xs font-semibold cursor-pointer ${
                            isMiddle
                              ? "text-teal-700 hover:text-teal-900"
                              : "text-indigo-700 hover:text-indigo-900"
                          }`}
                        >
                          {mp.completed ? "Buka Ulang" : "Kerjakan"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
