const HARAKAT_REGEX = /[\u064B-\u065F\u0670]/g;

export function stripArabicHarakat(input: string): string {
  return input.replace(HARAKAT_REGEX, "");
}

export function normalizeArabicComparison(input: string): string {
  return stripArabicHarakat(input)
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[،.؟!«»"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isArabicAnswerMatch(studentAnswer: string, acceptedAnswers: string[]): boolean {
  const normalizedStudent = normalizeArabicComparison(studentAnswer);
  if (!normalizedStudent) return false;
  return acceptedAnswers.some((ans) => normalizeArabicComparison(ans) === normalizedStudent);
}
