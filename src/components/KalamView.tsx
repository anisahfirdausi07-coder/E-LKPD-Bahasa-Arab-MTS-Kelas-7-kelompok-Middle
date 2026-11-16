import { useRef, useState } from "react";
import { Award, CheckCircle2, Keyboard, Languages, Loader2, Mic, MicOff, RotateCcw, Send, Sparkles, Star } from "lucide-react";
import type { DarsData, LearningLevel, MaharahProgress } from "../types";
import { ArabicKeyboard } from "./ArabicKeyboard";
import { AudioPlayer } from "./AudioPlayer";

interface KalamViewProps {
  dars: DarsData;
  level: LearningLevel;
  savedProgress: MaharahProgress;
  onSaveProgress: (progress: MaharahProgress) => void;
}

interface ChatTurn {
  id: string;
  role: "model" | "user";
  arabic: string;
  indonesian?: string;
  correction?: string;
  suggestedHint?: string;
}

interface FormativeEval {
  vocabularyFeedback: string;
  structureFeedback: string;
  relevanceFeedback: string;
  overallNote: string;
  stars: number;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

export function KalamView({ dars, level, savedProgress, onSaveProgress }: KalamViewProps) {
  const isMiddle = level === "middle";
  const kalam = dars.kalam;

  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      id: "init-1",
      role: "model",
      arabic: kalam.starterPromptArabic,
      indonesian: kalam.starterPromptIndonesian,
      suggestedHint: kalam.exampleResponses[0]?.arabic,
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<FormativeEval | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const userTurnCount = messages.filter((m) => m.role === "user").length;

  const toggleVoiceInput = () => {
    setVoiceError(null);
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      setVoiceError(
        "Pengenalan suara browser belum didukung pada perangkat ini. Silakan ketik jawabanmu menggunakan kolom teks atau keyboard Arab di bawah."
      );
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = "ar-SA";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript ?? "";
        if (transcript) {
          setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.onerror = () => {
        setIsListening(false);
        setVoiceError("Mikrofon tidak menangkap suara dengan jelas. Coba ulangi atau ketik langsung.");
      };
      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      setIsListening(true);
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceError("Tidak dapat mengakses mikrofon. Pastikan izin mikrofon aktif.");
    }
  };

  const sendMessage = async (requestSummary = false) => {
    const trimmed = inputValue.trim();
    if (!requestSummary && !trimmed) return;
    if (isSending) return;

    setApiError(null);
    setIsSending(true);

    const nextMessages = [...messages];
    if (trimmed) {
      nextMessages.push({
        id: `user-${Date.now()}`,
        role: "user",
        arabic: trimmed,
      });
      setMessages(nextMessages);
      setInputValue("");
    }

    try {
      const res = await fetch("/api/kalam/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          darsId: dars.id,
          darsTitle: `${dars.titleArabic} (${dars.titleIndonesian})`,
          scenarioContext: kalam.situationDescription,
          history: nextMessages.map((m) => ({ role: m.role, text: m.arabic })),
          userMessage: trimmed || "أُرِيدُ إِنْهَاءَ الْحِوَارِ وَالْحُصُولَ عَلَى التَّقْيِيمِ",
          requestSummary,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setApiError(data.error || "Gagal terhubung ke Mitra Dialog.");
        return;
      }

      const aiTurn: ChatTurn = {
        id: `ai-${Date.now()}`,
        role: "model",
        arabic: data.aiReplyArabic || "أَحْسَنْتَ! شُكْرًا لِمُشَارَكَتِكَ.",
        indonesian: data.aiReplyIndonesian,
        correction: data.correction,
        suggestedHint: data.suggestedNextHint,
      };
      setMessages((prev) => [...prev, aiTurn]);

      if (requestSummary && data.formativeEvaluation) {
        const evalData: FormativeEval = {
          vocabularyFeedback: data.formativeEvaluation.vocabularyFeedback,
          structureFeedback: data.formativeEvaluation.structureFeedback,
          relevanceFeedback: data.formativeEvaluation.relevanceFeedback,
          overallNote: data.formativeEvaluation.overallNote,
          stars: Math.min(3, Math.max(1, Number(data.formativeEvaluation.stars) || 2)),
        };
        setEvaluation(evalData);
        const estimatedScore = evalData.stars === 3 ? 92 : evalData.stars === 2 ? 78 : 65;
        onSaveProgress({
          completed: true,
          correctCount: evalData.stars,
          totalQuestions: 3,
          score: estimatedScore,
          stars: evalData.stars,
          points: evalData.stars * (isMiddle ? 35 : 25),
          feedbackNote: evalData.overallNote,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch {
      setApiError("Koneksi ke server dialog terputus. Coba kirim ulang.");
    } finally {
      setIsSending(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: "init-1",
        role: "model",
        arabic: kalam.starterPromptArabic,
        indonesian: kalam.starterPromptIndonesian,
        suggestedHint: kalam.exampleResponses[0]?.arabic,
      },
    ]);
    setInputValue("");
    setEvaluation(null);
    setApiError(null);
  };

  return (
    <div className="space-y-6">
      {/* Scenario Header & Visual Guide */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 ${
          isMiddle
            ? "bg-gradient-to-br from-teal-50/90 via-sky-50/80 to-orange-50/60 border-teal-200"
            : "bg-gradient-to-br from-indigo-50/90 via-sky-50/80 to-amber-50/60 border-indigo-200"
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-3">
            <p className="text-xs font-semibold text-slate-500">
              مَهَارَةُ الْكَلَامِ · Mitra Dialog Bahasa Arab Fusha
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {kalam.titleArabic} — {kalam.titleIndonesian}
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">{kalam.situationDescription}</p>

            <div className="pt-1">
              <p className="text-xs font-semibold text-slate-700 mb-1.5">Target Latihan Berbicara:</p>
              <ul className="space-y-1">
                {kalam.targetChecklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        isMiddle ? "text-teal-600" : "text-indigo-600"
                      }`}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {kalam.profileOrVisualData && (
              <div className="mt-3 rounded-xl bg-white/90 border border-slate-200 p-4">
                <p className="text-xs font-bold text-slate-700 mb-2">
                  {kalam.profileOrVisualData.heading}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {kalam.profileOrVisualData.items.map((info, i) => (
                    <div key={i} className="text-xs border border-slate-100 rounded-lg p-2.5 bg-slate-50/70">
                      <div className="font-semibold text-slate-600">{info.label}</div>
                      <div dir="rtl" className="font-arabic text-base font-semibold text-slate-900 mt-0.5">
                        {info.valueArabic}
                      </div>
                      <div className="text-slate-500">{info.valueIndonesian}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-3">
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white aspect-[4/3]">
              <img
                src={dars.imagePath}
                alt={`Ilustrasi ${dars.titleIndonesian}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-xl bg-white/90 border border-slate-200 p-3.5 text-xs space-y-1.5">
              <div className="font-semibold text-slate-700">Contoh Ungkapan yang Bisa Dipakai:</div>
              {kalam.exampleResponses.map((ex, i) => (
                <div key={i} className="pt-1 border-t border-slate-100 first:border-0 first:pt-0">
                  <div dir="rtl" className="font-arabic text-base text-slate-900">
                    {ex.arabic}
                  </div>
                  <div className="text-slate-500">{ex.indonesian}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Transcript & Chat Workspace */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-4 h-4 ${isMiddle ? "text-teal-600" : "text-indigo-600"}`} />
            <span className="text-sm font-bold text-slate-800">
              Transkrip Percakapan ({userTurnCount}/{kalam.minimumTurns} giliran minimal)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTranslations((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{showTranslations ? "Sembunyikan Arti" : "Tampilkan Arti"}</span>
            </button>
            <button
              type="button"
              onClick={resetChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Mulai Ulang</span>
            </button>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="p-5 space-y-4 max-h-[520px] overflow-y-auto bg-slate-50/30">
          {messages.map((turn) => {
            const isModel = turn.role === "model";
            return (
              <div
                key={turn.id}
                className={`flex flex-col ${isModel ? "items-start" : "items-end"}`}
              >
                <div
                  className={`max-w-[92%] sm:max-w-[82%] rounded-2xl p-4 border space-y-2.5 ${
                    isModel
                      ? isMiddle
                        ? "bg-teal-50/60 border-teal-200 text-slate-900"
                        : "bg-indigo-50/60 border-indigo-200 text-slate-900"
                      : "bg-white border-slate-200 text-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-600">
                      {isModel ? "Partner Dialog (رَفِيقُ الْكَلَامِ)" : "Jawabanmu"}
                    </span>
                    {isModel && (
                      <AudioPlayer
                        textArabic={turn.arabic}
                        label="Dengar"
                        level={level}
                        compact
                      />
                    )}
                  </div>

                  <p dir="rtl" className="font-arabic text-xl sm:text-2xl text-slate-900 leading-loose">
                    {turn.arabic}
                  </p>

                  {isModel && showTranslations && turn.indonesian && (
                    <p className="text-xs sm:text-sm text-slate-600 border-t border-slate-200/70 pt-2">
                      Arti: {turn.indonesian}
                    </p>
                  )}

                  {isModel && turn.correction && (
                    <div className="rounded-xl bg-white/90 border border-amber-200 p-3 text-xs text-slate-700">
                      <span className="font-bold text-amber-800 block mb-0.5">
                        Catatan Kosakata & Struktur:
                      </span>
                      {turn.correction}
                    </div>
                  )}

                  {isModel && turn.suggestedHint && (
                    <div className="text-xs text-slate-500">
                      Inspirasi respons:{" "}
                      <span dir="rtl" className="font-arabic text-base text-slate-800">
                        {turn.suggestedHint}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Partner Dialog sedang menyusun tanggapan bahasa Arab...</span>
            </div>
          )}
        </div>

        {/* Input Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white space-y-3">
          {voiceError && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
              {voiceError}
            </div>
          )}
          {apiError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900">
              {apiError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              dir="rtl"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(false);
                }
              }}
              placeholder="اُكْتُبْ جَوَابَكَ هُنَا... (Ketik atau rekam suara Arabmu)"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-arabic text-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleVoiceInput}
                title="Input Suara Bahasa Arab"
                className={`h-12 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 border transition-colors cursor-pointer ${
                  isListening
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isListening ? "Stop Rekam" : "Suara"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowKeyboard((prev) => !prev)}
                title="Tampilkan Keyboard Arab"
                className="h-12 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Keyboard className="w-4 h-4" />
                <span className="hidden md:inline">Keyboard</span>
              </button>

              <button
                type="button"
                onClick={() => sendMessage(false)}
                disabled={isSending || !inputValue.trim()}
                className={`h-12 px-5 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                  isMiddle ? "bg-teal-600 hover:bg-teal-700" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Kirim</span>
              </button>
            </div>
          </div>

          {showKeyboard && (
            <ArabicKeyboard value={inputValue} onChange={setInputValue} level={level} />
          )}

          {/* Complete & Formative Evaluation Trigger */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Lakukan minimal {kalam.minimumTurns} kali balasan sebelum meminta umpan balik akhir dialog.
            </p>
            <button
              type="button"
              onClick={() => sendMessage(true)}
              disabled={isSending || userTurnCount < 1}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-200 cursor-pointer disabled:opacity-50"
            >
              <Award className="w-4 h-4" />
              <span>Selesaikan & Minta Umpan Balik</span>
            </button>
          </div>
        </div>
      </div>

      {/* Formative Evaluation Result */}
      {(evaluation || savedProgress.feedbackNote) && (
        <div className="rounded-2xl bg-white border border-teal-200 p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Umpan Balik Formatif مَهَارَةُ الْكَلَامِ
              </p>
              <h3 className="text-lg font-bold text-slate-900">Ringkasan Kemampuan Berbicara</h3>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  className={`w-5 h-5 ${
                    s <= (evaluation?.stars ?? savedProgress.stars)
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-300"
                  }`}
                />
              ))}
            </div>
          </div>

          {evaluation ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                <div className="font-semibold text-slate-800 mb-1">Ketepatan Kosakata</div>
                <p className="text-slate-600">{evaluation.vocabularyFeedback}</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                <div className="font-semibold text-slate-800 mb-1">Struktur Kalimat</div>
                <p className="text-slate-600">{evaluation.structureFeedback}</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                <div className="font-semibold text-slate-800 mb-1">Kesesuaian Konteks</div>
                <p className="text-slate-600">{evaluation.relevanceFeedback}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-700">{savedProgress.feedbackNote}</p>
          )}

          <p className="text-xs text-slate-500 border-t border-slate-100 pt-3">
            Catatan: Umpan balik otomatis ini membantu membimbing ketepatan kosakata, struktur kalimat, dan konteks dialog; penilaian guru tetap menjadi acuan utama kemampuan berbicara siswa.
          </p>
        </div>
      )}
    </div>
  );
}
