/**
 * Rule-based SEO score generator.
 * Starts at 100 and deducts points for each missing signal, weighted by
 * how much that signal typically matters for search & social visibility.
 */
const RULES = [
  { key: "title", points: 15, reason: "Missing page title" },
  { key: "description", points: 15, reason: "Missing meta description" },
  { key: "canonical", points: 10, reason: "Missing canonical URL" },
  { key: "viewport", points: 5, reason: "Missing viewport meta tag" },
  { key: "ogTitle", points: 8, reason: "Missing Open Graph title" },
  { key: "ogDescription", points: 7, reason: "Missing Open Graph description" },
  { key: "ogImage", points: 10, reason: "Missing Open Graph image" },
  { key: "twitterCard", points: 8, reason: "Missing Twitter Card type" },
  { key: "twitterImage", points: 7, reason: "Missing Twitter Card image" },
  { key: "favicon", points: 5, reason: "Missing favicon" },
  { key: "robots", points: 5, reason: "Missing robots meta tag" },
  { key: "keywords", points: 2, reason: "Missing meta keywords" },
  { key: "author", points: 3, reason: "Missing author meta tag" },
];

const gradeFor = (value) => {
  if (value >= 90) return "Excellent";
  if (value >= 70) return "Good";
  if (value >= 40) return "Needs Improvement";
  return "Poor";
};

/**
 * @param {object} signals - boolean-ish presence map keyed by RULES keys
 * @returns {{ value: number, grade: string, deductions: {reason:string, points:number}[] }}
 */
export const computeSeoScore = (signals) => {
  let score = 100;
  const deductions = [];

  for (const rule of RULES) {
    const present = Boolean(signals[rule.key]);
    if (!present) {
      score -= rule.points;
      deductions.push({ reason: rule.reason, points: rule.points });
    }
  }

  score = Math.max(0, Math.min(100, score));

  return { value: score, grade: gradeFor(score), deductions };
};

/**
 * Builds human-readable suggestions from the same deduction list, so the
 * UI can show "what to fix" without re-deriving logic.
 */
export const buildSuggestions = (deductions) =>
  deductions.map((d) => `Add a(n) ${d.reason.replace("Missing ", "").toLowerCase()} to improve visibility.`);
