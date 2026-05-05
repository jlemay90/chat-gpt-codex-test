import type {
  AddressConfidence,
  LeadAction,
  LeadGrade,
  LeadScore,
  LeadSignalBreakdown,
  Recommendation,
} from "../../shared/leadIntel";
import { SIGNAL_RULES, type ScoreInput } from "./signalRules";

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function gradeForScore(score: number): LeadGrade {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  return "Skip";
}

function confidenceForScore(input: ScoreInput, score: number): AddressConfidence {
  if (input.lowConfidence) {
    return "low";
  }

  if (score >= 80) {
    return "high";
  }

  if (score >= 60) {
    return "medium";
  }

  return "low";
}

function chooseBestAngle(input: ScoreInput): string {
  if (input.spectrumServiceable || input.gigAvailable || input.knownUpgradeArea) {
    return "Speed upgrade pitch";
  }

  if (input.mobileBundleFit) {
    return "Mobile bundle fit";
  }

  if (input.recentSale && input.ownerOccupied) {
    return "New mover pitch";
  }

  if (input.rental) {
    return "Savings pitch";
  }

  return "Research more";
}

function chooseAction(score: number, input: ScoreInput): LeadAction {
  if (score >= 70 && !input.lowConfidence) {
    return "knock";
  }

  if (score >= 45) {
    return "leave_sticker";
  }

  if (score > 0) {
    return "research_more";
  }

  return "skip";
}

export function scoreLead(input: ScoreInput): LeadScore {
  const signalBreakdown: LeadSignalBreakdown[] = [];

  let score = 0;
  for (const rule of SIGNAL_RULES) {
    if (input[rule.key]) {
      score += rule.points;
      signalBreakdown.push({
        label: rule.label,
        points: rule.points,
        detail: rule.detail,
      });
    }
  }

  if (
    input.recentSale &&
    input.ownerOccupied &&
    input.singleFamily &&
    (input.spectrumServiceable || input.knownUpgradeArea) &&
    !input.lowConfidence
  ) {
    score += 5;
    signalBreakdown.push({
      label: "Residential Fit Bonus",
      points: 5,
      detail: "Recent owner-occupied single-family homes with serviceability get a tactical bump.",
    });
  }

  const reasons = signalBreakdown.map((signal) => `${signal.label.toLowerCase()}: ${signal.points >= 0 ? "+" : ""}${signal.points}`);
  const safeScore = clampScore(score);
  const bestAngle = chooseBestAngle(input);

  return {
    score: safeScore,
    grade: gradeForScore(safeScore),
    confidence: confidenceForScore(input, safeScore),
    bestAngle,
    recommendedAction: chooseAction(safeScore, input),
    reasons,
    signalBreakdown,
  };
}

export function buildRecommendation(input: {
  leadScore: LeadScore;
  rental: boolean;
  ownerOccupied: boolean;
  likelyOwnerName?: string | null;
  lowConfidence: boolean;
}): Recommendation {
  const opener = input.lowConfidence
    ? "Quick one: I am pulling together the address details now, and I want to confirm the best fit before I recommend anything."
    : input.rental
      ? "I am checking if this address is paying more than it needs to for internet and mobile."
      : "I am checking whether this home can get a better speed and bundle setup than it has now.";

  const followUpAngle = input.leadScore.bestAngle;
  const objectionPreempt = input.lowConfidence
    ? "The data is still thin, so I will keep this short and only lead with what is already clear."
    : input.rental
      ? "If the household is renting, we can still lead with savings and move-friendly options."
      : "If they already have service, the easiest angle is usually a faster plan or a cleaner bundle.";
  const offerToLeadWith = input.leadScore.recommendedAction === "knock"
    ? "free speed and savings check"
    : input.leadScore.recommendedAction === "leave_sticker"
      ? "quick callback after-hours"
      : "a short research pass before the next touch";

  return {
    opener,
    followUpAngle,
    objectionPreempt,
    offerToLeadWith,
  };
}
