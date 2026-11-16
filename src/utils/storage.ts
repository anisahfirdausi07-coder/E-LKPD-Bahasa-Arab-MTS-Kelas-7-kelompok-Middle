import type { DarsId, DarsProgress, LearningLevel, LevelProgressState, MaharahId, MaharahProgress } from "../types";

const STORAGE_KEYS: Record<LearningLevel, string> = {
  low: "elkpd_progress_low_v1",
  middle: "elkpd_progress_middle_v1",
};

function createEmptyMaharah(): MaharahProgress {
  return {
    completed: false,
    correctCount: 0,
    totalQuestions: 0,
    score: 0,
    stars: 0,
    points: 0,
  };
}

function createEmptyDarsProgress(): DarsProgress {
  return {
    istima: createEmptyMaharah(),
    kalam: createEmptyMaharah(),
    qiraah: createEmptyMaharah(),
    kitabah: createEmptyMaharah(),
  };
}

export function createInitialLevelProgress(level: LearningLevel): LevelProgressState {
  return {
    studentName: level === "low" ? "Siswa Kelas VII (Dasar)" : "Siswa Kelas VII (Menengah)",
    studentClass: "VII MTs",
    dars: {
      1: createEmptyDarsProgress(),
      2: createEmptyDarsProgress(),
      3: createEmptyDarsProgress(),
    },
  };
}

export function loadLevelProgress(level: LearningLevel): LevelProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[level]);
    if (!raw) return createInitialLevelProgress(level);
    const parsed = JSON.parse(raw) as Partial<LevelProgressState>;
    const base = createInitialLevelProgress(level);
    return {
      studentName: parsed.studentName || base.studentName,
      studentClass: parsed.studentClass || base.studentClass,
      dars: {
        1: { ...base.dars[1], ...(parsed.dars?.[1] ?? {}) },
        2: { ...base.dars[2], ...(parsed.dars?.[2] ?? {}) },
        3: { ...base.dars[3], ...(parsed.dars?.[3] ?? {}) },
      },
    };
  } catch {
    return createInitialLevelProgress(level);
  }
}

export function saveLevelProgress(level: LearningLevel, state: LevelProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEYS[level], JSON.stringify(state));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function resetLevelProgress(level: LearningLevel): LevelProgressState {
  const fresh = createInitialLevelProgress(level);
  saveLevelProgress(level, fresh);
  return fresh;
}

export function calculateScoreFromCounts(correctCount: number, totalQuestions: number): number {
  if (totalQuestions <= 0) return 0;
  return Math.round((correctCount / totalQuestions) * 100);
}

export function calculateStars(score: number): number {
  if (score >= 85) return 3;
  if (score >= 65) return 2;
  if (score > 0) return 1;
  return 0;
}

export function computeDarsSummary(darsProgress: DarsProgress): {
  completedCount: number;
  completionPercent: number;
  averageScore: number;
  totalStars: number;
  totalPoints: number;
} {
  const maharahIds: MaharahId[] = ["istima", "kalam", "qiraah", "kitabah"];
  let completedCount = 0;
  let scoreSum = 0;
  let totalStars = 0;
  let totalPoints = 0;

  for (const id of maharahIds) {
    const m = darsProgress[id];
    if (m.completed) {
      completedCount += 1;
      scoreSum += m.score;
    }
    totalStars += m.stars;
    totalPoints += m.points;
  }

  return {
    completedCount,
    completionPercent: Math.round((completedCount / 4) * 100),
    averageScore: completedCount > 0 ? Math.round(scoreSum / completedCount) : 0,
    totalStars,
    totalPoints,
  };
}

export function computeLevelTotals(progress: LevelProgressState): {
  totalPoints: number;
  totalStars: number;
  maxStars: number;
  completedActivities: number;
  totalActivities: number;
  overallAverageScore: number;
} {
  const darsIds: DarsId[] = [1, 2, 3];
  let totalPoints = 0;
  let totalStars = 0;
  let completedActivities = 0;
  let scoreSum = 0;

  for (const dId of darsIds) {
    const d = progress.dars[dId];
    const maharahIds: MaharahId[] = ["istima", "kalam", "qiraah", "kitabah"];
    for (const mId of maharahIds) {
      const m = d[mId];
      totalPoints += m.points;
      totalStars += m.stars;
      if (m.completed) {
        completedActivities += 1;
        scoreSum += m.score;
      }
    }
  }

  return {
    totalPoints,
    totalStars,
    maxStars: 36, // 3 dars * 4 maharah * 3 stars
    completedActivities,
    totalActivities: 12,
    overallAverageScore: completedActivities > 0 ? Math.round(scoreSum / completedActivities) : 0,
  };
}
