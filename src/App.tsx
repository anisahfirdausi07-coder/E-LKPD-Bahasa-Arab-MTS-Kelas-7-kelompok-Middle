import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Ear,
  GraduationCap,
  Layers,
  MessageCircle,
  PenTool,
  Star,
  Trophy,
  UserCheck,
} from "lucide-react";
import { IstimaView } from "./components/IstimaView";
import { KalamView } from "./components/KalamView";
import { KitabahView } from "./components/KitabahView";
import { PastelDecorations } from "./components/PastelDecorations";
import { PenilaianView } from "./components/PenilaianView";
import { QiraahView } from "./components/QiraahView";
import { lowCurriculum } from "./data/lowData";
import { middleCurriculum } from "./data/middleData";
import type { DarsId, LearningLevel, LevelProgressState, MaharahId, MaharahProgress } from "./types";
import {
  computeDarsSummary,
  computeLevelTotals,
  loadLevelProgress,
  resetLevelProgress,
  saveLevelProgress,
} from "./utils/storage";

type ActivePage = "home" | "dars" | "penilaian" | "tentang";

const MAHARAH_TABS: Array<{
  id: MaharahId;
  arabic: string;
  label: string;
  icon: typeof Ear;
}> = [
  { id: "istima", arabic: "الِاسْتِمَاعُ", label: "Istima'", icon: Ear },
  { id: "kalam", arabic: "الْكَلَامُ", label: "Kalam", icon: MessageCircle },
  { id: "qiraah", arabic: "الْقِرَاءَةُ", label: "Qira'ah", icon: BookOpen },
  { id: "kitabah", arabic: "الْكِتَابَةُ", label: "Kitabah", icon: PenTool },
];

export default function App() {
  const [activeLevel, setActiveLevel] = useState<LearningLevel>(() => {
    try {
      const saved = localStorage.getItem("elkpd_active_level");
      return saved === "low" || saved === "middle" ? saved : "middle";
    } catch {
      return "middle";
    }
  });

  const [progressByLevel, setProgressByLevel] = useState<Record<LearningLevel, LevelProgressState>>(() => ({
    low: loadLevelProgress("low"),
    middle: loadLevelProgress("middle"),
  }));

  const [activePage, setActivePage] = useState<ActivePage>("home");
  const [selectedDarsId, setSelectedDarsId] = useState<DarsId>(1);
  const [selectedMaharah, setSelectedMaharah] = useState<MaharahId>("istima");

  useEffect(() => {
    try {
      localStorage.setItem("elkpd_active_level", activeLevel);
    } catch {
      // Ignore storage error
    }
  }, [activeLevel]);

  const curriculum = activeLevel === "middle" ? middleCurriculum : lowCurriculum;
  const currentProgress = progressByLevel[activeLevel];
  const levelTotals = computeLevelTotals(currentProgress);
  const isMiddle = activeLevel === "middle";

  const activeDars =
    curriculum.darsList.find((d) => d.id === selectedDarsId) ?? curriculum.darsList[0];

  const handleSelectLevel = (level: LearningLevel) => {
    setActiveLevel(level);
  };

  const handleOpenActivity = (darsId: DarsId, maharahId: MaharahId) => {
    setSelectedDarsId(darsId);
    setSelectedMaharah(maharahId);
    setActivePage("dars");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveMaharahProgress = (
    darsId: DarsId,
    maharahId: MaharahId,
    nextMaharah: MaharahProgress
  ) => {
    setProgressByLevel((prev) => {
      const targetLevelState = prev[activeLevel];
      const updatedLevelState: LevelProgressState = {
        ...targetLevelState,
        dars: {
          ...targetLevelState.dars,
          [darsId]: {
            ...targetLevelState.dars[darsId],
            [maharahId]: nextMaharah,
          },
        },
      };
      saveLevelProgress(activeLevel, updatedLevelState);
      return {
        ...prev,
        [activeLevel]: updatedLevelState,
      };
    });
  };

  const handleUpdateStudentName = (name: string) => {
    setProgressByLevel((prev) => {
      const updated: LevelProgressState = {
        ...prev[activeLevel],
        studentName: name,
      };
      saveLevelProgress(activeLevel, updated);
      return { ...prev, [activeLevel]: updated };
    });
  };

  const handleResetCurrentLevel = () => {
    const fresh = resetLevelProgress(activeLevel);
    setProgressByLevel((prev) => ({
      ...prev,
      [activeLevel]: fresh,
    }));
  };

  // Theme-specific canvas & structural surface tokens (Low vs Middle)
  const pageBackground = isMiddle
    ? "bg-gradient-to-b from-[#ECFEFC] via-[#F4FAFF] to-[#FFF6EE]"
    : "bg-gradient-to-b from-[#F4F5FF] via-[#F7FBFF] to-[#FFF8FA]";

  const primaryAccentBtn = isMiddle
    ? "bg-teal-600 hover:bg-teal-700 text-white"
    : "bg-indigo-600 hover:bg-indigo-700 text-white";

  const accentText = isMiddle ? "text-teal-700" : "text-indigo-700";

  return (
    <div className={`min-h-screen relative text-slate-800 ${pageBackground}`}>
      <PastelDecorations level={activeLevel} />

      {/* Top Navigation Bar — 3-Zone Contract */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActivePage("home")}
            className="font-arabic text-xl sm:text-2xl font-bold text-slate-900 whitespace-nowrap shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          >
            هَيَّا نَتَعَلَّمْ
          </button>

          {/* Zone 2: 4 Single-line Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setActivePage("home")}
              className={`whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-slate-900 ${
                activePage === "home" ? `${accentText} font-semibold underline underline-offset-8` : ""
              }`}
            >
              Beranda
            </button>
            <button
              type="button"
              onClick={() => setActivePage("dars")}
              className={`whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-slate-900 ${
                activePage === "dars" ? `${accentText} font-semibold underline underline-offset-8` : ""
              }`}
            >
              Materi Dars
            </button>
            <button
              type="button"
              onClick={() => setActivePage("penilaian")}
              className={`whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-slate-900 ${
                activePage === "penilaian"
                  ? `${accentText} font-semibold underline underline-offset-8`
                  : ""
              }`}
            >
              Penilaian
            </button>
            <button
              type="button"
              onClick={() => setActivePage("tentang")}
              className={`whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-slate-900 ${
                activePage === "tentang"
                  ? `${accentText} font-semibold underline underline-offset-8`
                  : ""
              }`}
            >
              Tentang Level
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => {
                setActivePage("home");
                const el = document.getElementById("level-selector");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${primaryAccentBtn}`}
            >
              {isMiddle ? "مُسْتَوَى مُتَوَسِّط" : "مُسْتَوَى مُنْخَفِض"}
            </button>
          </div>
        </div>

        {/* Mobile compact nav row */}
        <div className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center justify-around gap-2 text-xs font-medium text-slate-600 bg-white/95">
          {[
            { id: "home" as ActivePage, label: "Beranda" },
            { id: "dars" as ActivePage, label: "Materi Dars" },
            { id: "penilaian" as ActivePage, label: "Penilaian" },
            { id: "tentang" as ActivePage, label: "Tentang" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActivePage(item.id)}
              className={`px-2 py-1 whitespace-nowrap shrink-0 cursor-pointer ${
                activePage === item.id ? `${accentText} font-bold` : ""
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Container */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
        {activePage === "home" && (
          <>
            {/* Hero Section */}
            <section
              className={`rounded-3xl border overflow-hidden shadow-xs ${
                isMiddle
                  ? "bg-gradient-to-br from-teal-50/90 via-sky-50/85 to-[#FFE9D6]/85 border-teal-200/90"
                  : "bg-gradient-to-br from-indigo-50/90 via-sky-50/85 to-rose-50/80 border-indigo-200/90"
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                <div className="lg:col-span-7 p-6 sm:p-9 flex flex-col justify-center space-y-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                    <span>E-LKPD Bahasa Arab Kelas VII MTs</span>
                    <span aria-hidden="true">·</span>
                    <span className={`font-arabic text-base font-bold ${accentText}`}>
                      {curriculum.labelArabic}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{curriculum.labelIndonesian}</span>
                  </div>

                  <div className="space-y-2">
                    <h1
                      dir="rtl"
                      className="font-arabic text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 text-right lg:text-left leading-snug"
                    >
                      هَيَّا نَتَعَلَّمْ
                    </h1>
                    <p className="text-lg sm:text-xl font-semibold text-slate-800">
                      Jelajahi Bahasa Arab, Belajar dengan Seru!
                    </p>
                  </div>

                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                    {curriculum.description}
                  </p>

                  {/* Student Name Input & Quick Start */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                    <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5">
                      <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={currentProgress.studentName}
                        onChange={(e) => handleUpdateStudentName(e.target.value)}
                        aria-label="Nama Siswa"
                        placeholder="Tulis namamu di sini..."
                        className="w-full text-sm text-slate-800 focus:outline-none bg-transparent"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenActivity(1, "istima")}
                      className={`px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${primaryAccentBtn}`}
                    >
                      Mulai Belajar Dars 1
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 min-h-[240px] lg:min-h-full relative bg-white/40">
                  <img
                    src="/src/assets/images/hero_pastel_fantasy_1794822806421.jpg"
                    alt="Ilustrasi Pastel Fantasy Learning siswa MTs belajar bahasa Arab"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </section>

            {/* Level Summary Strip */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5">
                <div className="text-xs font-medium text-slate-500">Level Aktif</div>
                <div className={`font-arabic text-xl font-bold mt-1 ${accentText}`}>
                  {curriculum.labelArabic}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{curriculum.labelIndonesian}</div>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5">
                <div className="text-xs font-medium text-slate-500">Aktivitas Selesai</div>
                <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                  {levelTotals.completedActivities} / {levelTotals.totalActivities}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">4 Maharah × 3 Dars</div>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5">
                <div className="text-xs font-medium text-slate-500">Total Poin Level</div>
                <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums flex items-center gap-1.5">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span>{levelTotals.totalPoints}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Tersimpan terpisah</div>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5">
                <div className="text-xs font-medium text-slate-500">Bintang Terkumpul</div>
                <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums flex items-center gap-1.5">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span>
                    {levelTotals.totalStars} / {levelTotals.maxStars}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Rata-rata nilai: {levelTotals.overallAverageScore}
                </div>
              </div>
            </section>

            {/* Level Selector — Strict Separation between Low & Middle */}
            <section id="level-selector" className="space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Pilih Kelompok Pembelajaran
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Setiap level memiliki materi, tingkat kesulitan, soal, dan penyimpanan nilai yang terpisah.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Low Card */}
                <button
                  type="button"
                  onClick={() => handleSelectLevel("low")}
                  className={`text-left rounded-2xl border p-6 transition-all cursor-pointer space-y-3 ${
                    activeLevel === "low"
                      ? "bg-gradient-to-br from-indigo-50 via-sky-50 to-rose-50/70 border-indigo-400 ring-2 ring-indigo-300"
                      : "bg-white border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-indigo-700">
                      Kelompok Dasar · Kelas VII MTs
                    </span>
                    {activeLevel === "low" && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Sedang Aktif</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-arabic text-2xl sm:text-3xl font-bold text-slate-900">
                      مُسْتَوَى مُنْخَفِض
                    </h3>
                    <span className="text-xs font-medium text-slate-500">Pemula</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Fokus pada pengenalan kosakata dasar, audio frasa singkat dengan bantuan arti, bacaan pendek, serta latihan menulis terbimbing.
                  </p>
                </button>

                {/* Middle Card */}
                <button
                  type="button"
                  onClick={() => handleSelectLevel("middle")}
                  className={`text-left rounded-2xl border p-6 transition-all cursor-pointer space-y-3 ${
                    activeLevel === "middle"
                      ? "bg-gradient-to-br from-teal-50 via-sky-50 to-[#FFE6D4]/80 border-teal-400 ring-2 ring-teal-300"
                      : "bg-white border-slate-200 hover:border-teal-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-teal-700">
                      Kelompok Menengah · Kelas VII MTs
                    </span>
                    {activeLevel === "middle" && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Sedang Aktif</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-arabic text-2xl sm:text-3xl font-bold text-slate-900">
                      مُسْتَوَى مُتَوَسِّط
                    </h3>
                    <span className="text-xs font-medium text-slate-500">Menengah</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    10 soal istima' kontekstual per dars, dialog interaktif dua arah, bacaan panjang beraneka latihan, dan penulisan paragraf mandiri.
                  </p>
                </button>
              </div>
            </section>

            {/* 3 Dars Learning Modules */}
            <section className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Tiga Dars Pembelajaran ({curriculum.labelArabic})
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Pilih Dars dan salah satu dari empat maharah (الِاسْتِمَاعُ، الْكَلَامُ، الْقِرَاءَةُ، الْكِتَابَةُ).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {curriculum.darsList.map((dars) => {
                  const dProg = currentProgress.dars[dars.id];
                  const summary = computeDarsSummary(dProg);

                  return (
                    <div
                      key={dars.id}
                      className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden flex flex-col justify-between shadow-xs"
                    >
                      <div>
                        <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                          <img
                            src={dars.imagePath}
                            alt={`Ilustrasi Dars ${dars.id}: ${dars.titleIndonesian}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="p-5 space-y-3">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="font-semibold">Dars {dars.id}</span>
                            <span className="tabular-nums">
                              Progres {summary.completionPercent}% · Nilai {summary.averageScore}
                            </span>
                          </div>

                          <div>
                            <h3 className="font-arabic text-2xl font-bold text-slate-900">
                              {dars.titleArabic}
                            </h3>
                            <p className="text-base font-bold text-slate-800">{dars.titleIndonesian}</p>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              {dars.subtitle}
                            </p>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                isMiddle ? "bg-teal-500" : "bg-indigo-500"
                              }`}
                              style={{ width: `${summary.completionPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="px-5 pb-5 pt-2 grid grid-cols-2 gap-2">
                        {MAHARAH_TABS.map((tab) => {
                          const Icon = tab.icon;
                          const done = dProg[tab.id].completed;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => handleOpenActivity(dars.id, tab.id)}
                              className={`rounded-xl border px-3 py-2.5 text-left transition-colors cursor-pointer flex items-center justify-between gap-1.5 ${
                                done
                                  ? isMiddle
                                    ? "bg-teal-50/70 border-teal-200 text-teal-900 hover:bg-teal-100/70"
                                    : "bg-indigo-50/70 border-indigo-200 text-indigo-900 hover:bg-indigo-100/70"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-bold truncate">{tab.label}</div>
                                <div className="font-arabic text-sm text-slate-600 truncate">
                                  {tab.arabic}
                                </div>
                              </div>
                              {done ? (
                                <CheckCircle2
                                  className={`w-4 h-4 shrink-0 ${
                                    isMiddle ? "text-teal-600" : "text-indigo-600"
                                  }`}
                                />
                              ) : (
                                <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {activePage === "dars" && (
          <div className="space-y-6">
            {/* Dars & Maharah Workspace Switcher */}
            <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActivePage("home")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Beranda</span>
                </button>

                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                  <span className={`font-arabic text-base font-bold ${accentText}`}>
                    {curriculum.labelArabic}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{curriculum.labelIndonesian}</span>
                </div>
              </div>

              {/* Dars Selector Tabs */}
              <div className="flex flex-wrap gap-2">
                {curriculum.darsList.map((d) => {
                  const active = d.id === selectedDarsId;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedDarsId(d.id)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
                        active
                          ? isMiddle
                            ? "bg-teal-600 text-white border-teal-600"
                            : "bg-indigo-600 text-white border-indigo-600"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      Dars {d.id}: {d.titleIndonesian} ({d.titleArabic})
                    </button>
                  );
                })}
              </div>

              {/* Maharah Selector Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                {MAHARAH_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const active = selectedMaharah === tab.id;
                  const prog = currentProgress.dars[activeDars.id][tab.id];
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedMaharah(tab.id)}
                      className={`rounded-xl border p-3 text-left transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                        active
                          ? isMiddle
                            ? "bg-teal-50 border-teal-500 text-teal-950 ring-1 ring-teal-500"
                            : "bg-indigo-50 border-indigo-500 text-indigo-950 ring-1 ring-indigo-500"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className="w-4 h-4 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-arabic text-base font-bold leading-tight truncate">
                            {tab.arabic}
                          </div>
                          <div className="text-xs text-slate-500 truncate">{tab.label}</div>
                        </div>
                      </div>
                      {prog.completed && (
                        <span className="text-xs font-bold tabular-nums shrink-0">
                          {prog.score}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Maharah Stage */}
            {selectedMaharah === "istima" && (
              <IstimaView
                key={`${activeLevel}-${activeDars.id}-istima`}
                dars={activeDars}
                level={activeLevel}
                savedProgress={currentProgress.dars[activeDars.id].istima}
                onSaveProgress={(prog) =>
                  handleSaveMaharahProgress(activeDars.id, "istima", prog)
                }
              />
            )}
            {selectedMaharah === "kalam" && (
              <KalamView
                key={`${activeLevel}-${activeDars.id}-kalam`}
                dars={activeDars}
                level={activeLevel}
                savedProgress={currentProgress.dars[activeDars.id].kalam}
                onSaveProgress={(prog) =>
                  handleSaveMaharahProgress(activeDars.id, "kalam", prog)
                }
              />
            )}
            {selectedMaharah === "qiraah" && (
              <QiraahView
                key={`${activeLevel}-${activeDars.id}-qiraah`}
                dars={activeDars}
                level={activeLevel}
                savedProgress={currentProgress.dars[activeDars.id].qiraah}
                onSaveProgress={(prog) =>
                  handleSaveMaharahProgress(activeDars.id, "qiraah", prog)
                }
              />
            )}
            {selectedMaharah === "kitabah" && (
              <KitabahView
                key={`${activeLevel}-${activeDars.id}-kitabah`}
                dars={activeDars}
                level={activeLevel}
                savedProgress={currentProgress.dars[activeDars.id].kitabah}
                onSaveProgress={(prog) =>
                  handleSaveMaharahProgress(activeDars.id, "kitabah", prog)
                }
              />
            )}
          </div>
        )}

        {activePage === "penilaian" && (
          <PenilaianView
            curriculum={curriculum}
            progress={currentProgress}
            onOpenActivity={handleOpenActivity}
            onResetProgress={handleResetCurrentLevel}
          />
        )}

        {activePage === "tentang" && (
          <section className="space-y-6">
            <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Layers className="w-4 h-4" />
                <span>Perbandingan Kelompok Belajar Kelas VII MTs</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Perbedaan مُسْتَوَى مُنْخَفِض dan مُسْتَوَى مُتَوَسِّط
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                E-LKPD ini dirancang untuk melayani perbedaan kemampuan awal siswa kelas VII MTs dengan dua jalur pembelajaran terpisah namun tetap dalam satu keluarga desain Pastel Fantasy Learning.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-arabic text-2xl font-bold text-indigo-900">
                      مُسْتَوَى مُنْخَفِض
                    </h3>
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                  </div>
                  <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
                    <li>Identitas visual pastel lavender, biru langit, dan krem.</li>
                    <li>5 soal Istima' per Dars berfokus pada pengenalan bunyi kosakata dasar.</li>
                    <li>Dialog interaktif dengan kalimat sangat pendek dan petunjuk terjemahan awal.</li>
                    <li>Bacaan Qira'ah 2 kalimat pendek dengan 3 soal pemahaman inti.</li>
                    <li>Latihan Kitabah terbimbing dengan susun kata sederhana.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/70 via-sky-50/50 to-orange-50/60 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-arabic text-2xl font-bold text-teal-900">
                      مُسْتَوَى مُتَوَسِّط
                    </h3>
                    <GraduationCap className="w-5 h-5 text-teal-600" />
                  </div>
                  <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
                    <li>Identitas visual pembeda soft turquoise, biru pastel, dan peach.</li>
                    <li>10 soal Istima' per Dars (5 kosakata kontekstual + 5 kalimat/paragraf pendek).</li>
                    <li>Dialog interaktif dua arah: perkenalan profil, deskripsi isi tas (warna & guna), serta rutinitas harian dengan ثُمَّ، وَ، بَعْدَ ذَلِكَ.</li>
                    <li>Teks Qira'ah lebih panjang dan kaya informasi + 5 soal pemahaman + Benar/Salah, melengkapi kalimat, makna konteks, dan mengurutkan paragraf.</li>
                    <li>Kitabah tingkat menengah lengkap dengan keyboard Arab virtual dan harakat.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Clean Footer */}
      <footer className="relative z-10 border-t border-slate-200/80 bg-white/80 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-arabic text-base font-bold text-slate-700">
              هَيَّا نَتَعَلَّمْ
            </span>
            <span aria-hidden="true">·</span>
            <span>Jelajahi Bahasa Arab, Belajar dengan Seru!</span>
          </div>
          <div>E-LKPD Bahasa Arab Kelas VII MTs · مُسْتَوَى مُنْخَفِض & مُسْتَوَى مُتَوَسِّط</div>
        </div>
      </footer>
    </div>
  );
}
