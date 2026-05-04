export function generatePitch(lead, scoreResult) {
  const ownerOccupied = lead.ownership.ownerOccupied;
  const absenteeOwner = lead.ownership.absenteeOwner;
  const grade = scoreResult.grade;

  let angle = "Lead with a quick service review and ask what they want to improve.";
  if (ownerOccupied) {
    angle = "Lead with speed, reliability, and bundle savings.";
  } else if (absenteeOwner) {
    angle = "Lead with a property-owner check-in and ask who handles service decisions.";
  } else if (grade === "C") {
    angle = "Lead with a soft follow-up and keep the ask short.";
  }

  const openerParts = [];
  openerParts.push(`Hi, this is Spectrum. I'm reaching out about ${lead.address}.`);
  openerParts.push(
    ownerOccupied
      ? "Houses like this usually respond well to a quick speed and value check."
      : "I wanted to see who handles the service decision here and whether a quick review would be useful.",
  );
  openerParts.push(
    grade === "A" || grade === "B"
      ? "If you have 20 seconds, I can show you the fastest fit and get out of your way."
      : "If now is not the right time, I can make this very brief and leave a simple callback path.",
  );

  const opener = openerParts.join(" ");
  const script = `${opener} ${
    ownerOccupied
      ? "I'm happy to keep this focused on speed and value, plus a cleaner bundle if it helps."
      : "I'm just trying to put the right contact on the right follow-up path."
  }`;

  return {
    angle,
    opener,
    script,
    nextQuestion: ownerOccupied
      ? "Are you happy with the speed you have now, or is there room to improve?"
      : "Who is the best contact for service decisions here?",
  };
}
