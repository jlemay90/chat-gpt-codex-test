export function PitchCard({ pitch }) {
  return (
    <section className="card card--wide">
      <div className="section-head">
        <div>
          <p className="eyebrow">Sales angle</p>
          <h2 className="section-title">What to say first</h2>
        </div>
      </div>

      <div className="pitch-block">
        <div className="pitch-badge">Angle</div>
        <p className="pitch-copy">{pitch.angle}</p>
      </div>

      <div className="pitch-script">
        <p className="metric-label">Generated opener script</p>
        <p className="metric-value metric-value--script">{pitch.opener}</p>
        <p className="metric-note">{pitch.script}</p>
        <div className="pitch-question">
          <span className="pitch-question-label">Next question</span>
          <p>{pitch.nextQuestion}</p>
        </div>
      </div>
    </section>
  );
}
