function gradeCopy(grade) {
  if (grade === "A") return "Strong knock candidate";
  if (grade === "B") return "Worth a follow-up";
  if (grade === "C") return "Soft follow-up only";
  return "Pass for now";
}

export function LeadScoreCard({ lead, scoreResult }) {
  const scoreTone = `score-tone score-tone--${scoreResult.grade.toLowerCase()}`;

  return (
    <section className="card">
      <div className="section-head">
        <div>
          <p className="eyebrow">Lead quality</p>
          <h2 className="section-title">{lead.scenarioLabel}</h2>
        </div>
        <span className={`grade-pill grade-pill--${scoreResult.grade.toLowerCase()}`}>
          Grade {scoreResult.grade}
        </span>
      </div>

      <div className="score-layout">
        <div className="score-block">
          <div className={scoreTone}>{scoreResult.score}</div>
          <p className="score-caption">{gradeCopy(scoreResult.grade)}</p>
        </div>

        <div className="score-meta">
          <p className="metric-label">Recommended action</p>
          <p className="metric-value">{scoreResult.recommendedAction}</p>
          <p className="metric-note">
            {scoreResult.worthKnocking
              ? "This one deserves a door knock if you’re in the area."
              : "Use this one as a follow-up lead instead of a first knock."}
          </p>
        </div>
      </div>

      <div className="signal-list">
        {scoreResult.signals.slice(0, 4).map((signal) => (
          <div className="signal-item" key={signal.label}>
            <div className="signal-row">
              <span className="signal-label">{signal.label}</span>
              <span className={`signal-points ${signal.points >= 0 ? "signal-points--positive" : "signal-points--negative"}`}>
                {signal.points >= 0 ? "+" : ""}
                {signal.points}
              </span>
            </div>
            <p className="signal-detail">{signal.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
