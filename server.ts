import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === "production";

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Simple in-memory cache for TTS audio clips to avoid redundant API calls on replay
const ttsCache = new Map<string, string>();

const app = express();
app.use(express.json({ limit: "2mb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// 1. Arabic TTS Endpoint (gemini-3.8-flash-lite-tts)
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voiceName = "Kore", style = "Clear, warm, well-paced Modern Standard Arabic teacher voice with crisp pronunciation of vowel endings" } = req.body ?? {};
    if (!text || typeof text !== "string" || !text.trim()) {
      res.status(400).json({ error: "Teks Arab wajib diisi untuk audio." });
      return;
    }

    const trimmed = text.trim();
    const cacheKey = `${voiceName}::${trimmed}`;
    const cached = ttsCache.get(cacheKey);
    if (cached) {
      res.json({ audioBase64: cached, mimeType: "audio/wav", cached: true });
      return;
    }

    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: "GEMINI_API_KEY belum dikonfigurasi di server.",
        fallbackToBrowserSpeech: true,
      });
      return;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: trimmed,
              speechMetadata: {
                style,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      res.status(502).json({
        error: "Audio tidak dapat dihasilkan oleh layanan TTS.",
        fallbackToBrowserSpeech: true,
      });
      return;
    }

    if (ttsCache.size > 120) {
      const oldestKey = ttsCache.keys().next().value;
      if (oldestKey) ttsCache.delete(oldestKey);
    }
    ttsCache.set(cacheKey, base64Audio);

    res.json({ audioBase64: base64Audio, mimeType: "audio/wav" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menghasilkan audio.";
    console.error("TTS error:", message);
    res.status(500).json({ error: message, fallbackToBrowserSpeech: true });
  }
});

// 2. Kalam AI Conversation Partner Endpoint (gemini-4-hydrogen)
app.post("/api/kalam/chat", async (req, res) => {
  try {
    const {
      level = "middle",
      darsId = 1,
      darsTitle = "",
      scenarioContext = "",
      history = [],
      userMessage = "",
      requestSummary = false,
    } = req.body ?? {};

    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: "GEMINI_API_KEY belum aktif. Pastikan secret GEMINI_API_KEY sudah diatur.",
      });
      return;
    }

    const levelGuidance =
      level === "low"
        ? "Tingkat siswa adalah مُسْتَوَى مُنْخَفِض (Pemula kelas VII MTs). Gunakan kalimat Arab fusha yang sangat pendek, sederhana, dan jelas berharakat lengkap. Beri dorongan positif dan koreksi yang sangat lembut."
        : "Tingkat siswa adalah مُسْتَوَى مُتَوَسِّط (Menengah kelas VII MTs). Siswa sudah mampu menyusun kalimat sederhana, menjelaskan informasi rinci, menggunakan kata sifat warna/fungsi, serta kata penghubung (وَ، ثُمَّ، بَعْدَ ذَلِكَ). Gunakan bahasa Arab fusha sederhana yang komunikatif dengan harakat lengkap.";

    const systemInstruction = `Kamu adalah "أُسْتَاذُ/رَفِيقُ الْكَلَامِ" — mitra dialog AI berbahasa Arab untuk E-LKPD siswa kelas VII MTs.
Materi saat ini: Dars ${darsId} (${darsTitle}).
Konteks skenario: ${scenarioContext}
${levelGuidance}

Aturan WAJIB untuk setiap giliran dialog:
1. Seluruh kalimat bahasa Arab WAJIB berharakat (tashkeel) lengkap dan rapi agar mudah dibaca siswa MTs.
2. Tanggapi jawaban siswa secara kontekstual dan ramah dalam bahasa Arab fusha sederhana.
3. Ajukan TEPAT SATU pertanyaan lanjutan dalam satu giliran (jangan menumpuk banyak pertanyaan sekaligus). Jika requestSummary=true, berikan kalimat penutup yang hangat tanpa pertanyaan baru.
4. Pada field "correction", berikan koreksi singkat dalam bahasa Indonesia mengenai ketepatan kosakata (مُفْرَدَات) dan struktur kalimat (تَرْكِيبُ الْجُمْلَةِ) dari pesan terakhir siswa. Jika sudah tepat, puji ketepatannya. Jika siswa baru memulai (pesan pertama kosong/salam pembuka), beri arahan singkat untuk memulai dialog.
5. Jangan pernah menyebut nama model AI atau detail teknis sistem.`;

    const formattedHistory = Array.isArray(history)
      ? history
          .map((m: { role?: string; text?: string }) =>
            `${m.role === "user" ? "Siswa" : "Partner AI"}: ${m.text ?? ""}`
          )
          .join("\n")
      : "";

    const prompt = requestSummary
      ? `Riwayat percakapan:\n${formattedHistory}\n\nPesan terakhir siswa: "${userMessage}"\n\nBerikan penutup dialog bahasa Arab singkat yang mengapresiasi usaha siswa, dan isi formativeEvaluation lengkap (evaluasi kosakata, struktur kalimat, kesesuaian konteks, serta catatan bahwa penilaian ini bersifat formatif untuk membantu belajar).`
      : `Riwayat percakapan:\n${formattedHistory || "(Percakapan baru dimulai)"}\n\nPesan terbaru siswa: "${userMessage}"\n\nBerikan respons dialog berikutnya dengan tepat satu pertanyaan lanjutan dalam bahasa Arab fusha berharakat, terjemahan Indonesia, dan koreksi singkat.`;

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aiReplyArabic: {
              type: Type.STRING,
              description: "Balasan dialog dalam bahasa Arab fusha berharakat lengkap berisi tanggapan dan tepat 1 pertanyaan.",
            },
            aiReplyIndonesian: {
              type: Type.STRING,
              description: "Terjemahan bahasa Indonesia dari aiReplyArabic.",
            },
            correction: {
              type: Type.STRING,
              description: "Koreksi singkat dan ramah dalam bahasa Indonesia tentang kosakata dan struktur kalimat siswa, beserta contoh perbaikan bahasa Arab berharakat jika ada kesalahan.",
            },
            suggestedNextHint: {
              type: Type.STRING,
              description: "Petunjuk singkat pola jawaban Arab berharakat yang dapat dicoba siswa untuk merespons.",
            },
            formativeEvaluation: {
              type: Type.OBJECT,
              properties: {
                vocabularyFeedback: { type: Type.STRING },
                structureFeedback: { type: Type.STRING },
                relevanceFeedback: { type: Type.STRING },
                overallNote: { type: Type.STRING },
                stars: { type: Type.INTEGER },
              },
              required: ["vocabularyFeedback", "structureFeedback", "relevanceFeedback", "overallNote", "stars"],
            },
          },
          required: ["aiReplyArabic", "aiReplyIndonesian", "correction", "suggestedNextHint"],
        },
      },
    });

    const rawText = (response.text ?? "{}").trim();
    const parsed = JSON.parse(rawText);
    res.json(parsed);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memproses dialog Kalam AI.";
    console.error("Kalam AI error:", message);
    res.status(500).json({ error: message });
  }
});

// 3. Kitabah Writing Evaluation Endpoint (gemini-4-hydrogen)
app.post("/api/evaluate-writing", async (req, res) => {
  try {
    const {
      level = "middle",
      darsTitle = "",
      taskPrompt = "",
      guidancePoints = [],
      studentText = "",
    } = req.body ?? {};

    if (!studentText || typeof studentText !== "string" || !studentText.trim()) {
      res.status(400).json({ error: "Tulisan Arab belum diisi." });
      return;
    }

    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: "GEMINI_API_KEY belum aktif. Pastikan secret GEMINI_API_KEY sudah diatur.",
      });
      return;
    }

    const systemInstruction = `Kamu adalah guru Bahasa Arab MTs kelas VII yang memeriksa latihan menulis (مَهَارَةُ الْكِتَابَةِ) untuk level ${level === "low" ? "مُسْتَوَى مُنْخَفِض (Pemula)" : "مُسْتَوَى مُتَوَسِّط (Menengah)"}.
Berikan umpan balik formatif berbahasa Indonesia yang jelas, ramah, dan mendidik berdasarkan 3 aspek:
1. Ketepatan kosakata (المفردات)
2. Struktur kalimat dan kesesuaian mudzakkar/muannats atau kata penghubung (التركيب)
3. Kesesuaian jawaban dengan instruksi/panduan tugas.
Sertakan juga contoh perbaikan kalimat Arab berharakat lengkap. Ingat: penilaian otomatis ini bersifat umpan balik formatif, bukan pengukuran mutlak.`;

    const prompt = `Materi: ${darsTitle}
Instruksi tugas: ${taskPrompt}
Poin panduan: ${Array.isArray(guidancePoints) ? guidancePoints.join("; ") : ""}
Tulisan siswa: "${studentText.trim()}"`;

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vocabularyFeedback: { type: Type.STRING },
            structureFeedback: { type: Type.STRING },
            relevanceFeedback: { type: Type.STRING },
            correctedExampleArabic: {
              type: Type.STRING,
              description: "Contoh kalimat perbaikan dalam bahasa Arab berharakat lengkap.",
            },
            encouragement: { type: Type.STRING },
            stars: {
              type: Type.INTEGER,
              description: "Bintang formatif 1 sampai 3.",
            },
          },
          required: [
            "vocabularyFeedback",
            "structureFeedback",
            "relevanceFeedback",
            "correctedExampleArabic",
            "encouragement",
            "stars",
          ],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? "{}").trim());
    res.json(parsed);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengevaluasi tulisan.";
    console.error("Evaluate writing error:", message);
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`E-LKPD Bahasa Arab server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
