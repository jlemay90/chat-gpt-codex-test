function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function addSignal(signals, reasons, score, signal) {
  signals.push(signal);
  reasons.push(signal.detail);
  return score + signal.points;
}

export function scoreLead(lead) {
  let score = 40;
  const reasons = [];
  const signals = [];

  if (lead.ownership.ownerOccupied) {
    score = addSignal(signals, reasons, score, {
      label: "Owner occupied",
      points: 18,
      detail: "Owner-occupied homes are the cleanest knock targets for a residential upgrade pitch.",
    });
  } else {
    score = addSignal(signals, reasons, score, {
      label: "Not owner occupied",
      points: -8,
      detail: "Non-owner-occupied addresses usually need a softer follow-up path.",
    });
  }

  if (/single-family/i.test(lead.property.type)) {
    score = addSignal(signals, reasons, score, {
      label: "Single-family",
      points: 12,
      detail: "Single-family homes usually support a direct doorstep conversation.",
    });
  } else if (/condo|apartment|duplex/i.test(lead.property.type)) {
    score = addSignal(signals, reasons, score, {
      label: "Multi-unit",
      points: -6,
      detail: "Multi-unit properties are harder to qualify at the door.",
    });
  }

  if (typeof lead.salesHistory.yearsSinceSale === "number" && lead.salesHistory.yearsSinceSale <= 3) {
    score = addSignal(signals, reasons, score, {
      label: "Recent sale",
      points: 14,
      detail: "A recent sale can signal a move, refinance, or service review window.",
    });
  } else if (typeof lead.salesHistory.yearsSinceSale === "number" && lead.salesHistory.yearsSinceSale > 8) {
    score = addSignal(signals, reasons, score, {
      label: "Long tenure",
      points: -4,
      detail: "Long tenure lowers the urgency of a fresh pitch.",
    });
  }

  if (lead.ownership.absenteeOwner) {
    score = addSignal(signals, reasons, score, {
      label: "Absentee owner",
      points: -14,
      detail: "Absentee ownership lowers door efficiency and can complicate the conversation.",
    });
  }

  if (lead.ownership.rentalLikelihood === "High") {
    score = addSignal(signals, reasons, score, {
      label: "Rental likelihood",
      points: -10,
      detail: "High rental likelihood usually means weaker homeowner-style conversion odds.",
    });
  } else if (lead.ownership.rentalLikelihood === "Low") {
    score = addSignal(signals, reasons, score, {
      label: "Rental likelihood",
      points: 4,
      detail: "Low rental likelihood makes a direct homeowner conversation more realistic.",
    });
  }

  if (lead.property.yearBuilt >= 2000) {
    score = addSignal(signals, reasons, score, {
      label: "Newer build",
      points: 6,
      detail: "Newer homes often support a stronger upgrade conversation.",
    });
  }

  if (lead.property.squareFeet >= 1600) {
    score = addSignal(signals, reasons, score, {
      label: "Solid footprint",
      points: 4,
      detail: "A bigger footprint can support a multi-device bundle pitch.",
    });
  }

  const finalScore = clampScore(score);
  const grade = finalScore >= 80 ? "A" : finalScore >= 65 ? "B" : finalScore >= 50 ? "C" : "D";

  return {
    score: finalScore,
    grade,
    recommendedAction:
      grade === "A"
        ? "Knock now"
        : grade === "B"
          ? "Knock or follow up"
          : grade === "C"
            ? "Follow up only"
            : "Pass for now",
    worthKnocking: grade === "A" || grade === "B",
    reasons,
    signals,
  };
}
