export type LearningLevel = "low" | "middle";
export type DarsId = 1 | 2 | 3;
export type MaharahId = "istima" | "kalam" | "qiraah" | "kitabah";

export interface ArabicOption {
  letter: "أ" | "ب" | "ج" | "د";
  text: string;
  indonesianHint?: string;
}

export interface IstimaQuestion {
  id: string;
  category: "vocab_context" | "sentence_paragraph" | "vocab_recognition";
  categoryLabel: string;
  audioTextArabic: string;
  audioSpeakerHint?: string;
  questionPrompt: string;
  visualCue?: string;
  options: ArabicOption[];
  correctLetter: "أ" | "ب" | "ج" | "د";
  explanation: string;
}

export interface KalamScenario {
  titleArabic: string;
  titleIndonesian: string;
  situationDescription: string;
  targetChecklist: string[];
  profileOrVisualData?: {
    heading: string;
    items: Array<{ label: string; valueArabic: string; valueIndonesian: string }>;
  };
  starterPromptArabic: string;
  starterPromptIndonesian: string;
  exampleResponses: Array<{ arabic: string; indonesian: string }>;
  minimumTurns: number;
}

export interface VocabItem {
  arabic: string;
  indonesian: string;
  exampleArabic?: string;
}

export interface QiraahComprehensionQuestion {
  id: string;
  questionArabic: string;
  questionIndonesian: string;
  options: ArabicOption[];
  correctLetter: "أ" | "ب" | "ج" | "د";
  explanation: string;
}

export interface QiraahTrueFalseItem {
  id: string;
  statementArabic: string;
  statementIndonesian: string;
  isTrue: boolean;
  explanation: string;
}

export interface QiraahFillBlankItem {
  id: string;
  sentenceBefore: string;
  sentenceAfter: string;
  hintIndonesian: string;
  choices: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QiraahContextVocabItem {
  id: string;
  sentenceArabic: string;
  targetWord: string;
  questionIndonesian: string;
  options: ArabicOption[];
  correctLetter: "أ" | "ب" | "ج" | "د";
  explanation: string;
}

export interface QiraahOrderItem {
  id: string;
  instruction: string;
  correctOrderArabic: string[];
  shuffledArabic: string[];
  indonesianMeaning: string;
}

export interface QiraahContent {
  titleArabic: string;
  titleIndonesian: string;
  paragraphsArabic: string[];
  translationIndonesian: string[];
  vocabulary: VocabItem[];
  comprehensionQuestions: QiraahComprehensionQuestion[];
  trueFalseItems: QiraahTrueFalseItem[];
  fillBlankItems: QiraahFillBlankItem[];
  contextVocabItems?: QiraahContextVocabItem[];
  sentenceOrderTask?: QiraahOrderItem;
}

export interface KitabahWordOrderTask {
  id: string;
  instruction: string;
  indonesianMeaning: string;
  shuffledWords: string[];
  correctSentence: string;
}

export interface KitabahCompletionTask {
  id: string;
  instruction: string;
  promptBefore: string;
  promptAfter: string;
  hintIndonesian: string;
  wordBank?: string[];
  acceptedAnswers: string[];
  modelAnswer: string;
}

export interface KitabahParagraphOrderTask {
  id: string;
  instruction: string;
  shuffledSentences: string[];
  correctOrder: string[];
  indonesianSummary: string;
}

export interface KitabahFreeWritingTask {
  id: string;
  title: string;
  instruction: string;
  givenInfoCard: Array<{ label: string; value: string }>;
  guidancePoints: string[];
  examplePatternArabic: string;
}

export interface KitabahContent {
  wordOrderTasks: KitabahWordOrderTask[];
  completionTasks: KitabahCompletionTask[];
  paragraphOrderTask?: KitabahParagraphOrderTask;
  freeWritingTask: KitabahFreeWritingTask;
}

export interface DarsData {
  id: DarsId;
  titleArabic: string;
  titleIndonesian: string;
  subtitle: string;
  imagePath: string;
  learningGoals: string[];
  istima: IstimaQuestion[];
  kalam: KalamScenario;
  qiraah: QiraahContent;
  kitabah: KitabahContent;
}

export interface LevelCurriculum {
  level: LearningLevel;
  labelArabic: string;
  labelIndonesian: string;
  description: string;
  darsList: DarsData[];
}

export interface MaharahProgress {
  completed: boolean;
  correctCount: number;
  totalQuestions: number;
  score: number; // 0-100
  stars: number; // 0-3
  points: number;
  feedbackNote?: string;
  updatedAt?: string;
}

export type DarsProgress = Record<MaharahId, MaharahProgress>;

export interface LevelProgressState {
  studentName: string;
  studentClass: string;
  dars: Record<DarsId, DarsProgress>;
}
