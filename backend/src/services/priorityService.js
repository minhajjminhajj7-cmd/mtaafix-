// ====================================================
// MTAAFIX RISK-BASED PRIORITY ENGINE
//
// Priority is primarily determined by the configured
// problem type, NOT by dramatic words written by the
// citizen.
//
// Example:
// Sparking Electrical Wire -> CRITICAL
// Small Pothole             -> LOW
//
// Duplicate reports are treated as community impact,
// but they cannot reduce the base safety priority.
// ====================================================

const PRIORITY_LEVELS = {
  low: 1,
  normal: 2,
  high: 3,
  critical: 4,
};

const priorityFromLevel = (level) => {
  const entry = Object.entries(PRIORITY_LEVELS).find(
    ([, value]) => value === level
  );

  return entry ? entry[0] : "normal";
};

const assessPriority = ({
  defaultPriority,
  problemTypeName,
  reportCount = 1,
}) => {
  const safeDefaultPriority =
    PRIORITY_LEVELS[defaultPriority]
      ? defaultPriority
      : "normal";

  let level =
    PRIORITY_LEVELS[safeDefaultPriority];

  const reasons = [
    `${problemTypeName} has a configured ${safeDefaultPriority.toUpperCase()} safety priority`,
  ];

  let communityImpact = "low";

  // ==================================================
  // COMMUNITY IMPACT
  //
  // Multiple reports can escalate attention, but they
  // do not define whether something is inherently
  // dangerous.
  // ==================================================

  if (reportCount >= 10) {
    communityImpact = "high";

    reasons.push(
      "High community impact: 10 or more reports received"
    );

    // Escalate by one level, but never above critical.
    level = Math.min(level + 1, 4);
  } else if (reportCount >= 5) {
    communityImpact = "medium";

    reasons.push(
      "Moderate community impact: 5 or more reports received"
    );

    // Only escalate low-priority infrastructure.
    if (level === PRIORITY_LEVELS.low) {
      level = PRIORITY_LEVELS.normal;
    }
  } else if (reportCount >= 2) {
    communityImpact = "emerging";

    reasons.push(
      "Multiple citizens have reported this incident"
    );
  }

  const priority =
    priorityFromLevel(level);

  return {
    priority,
    basePriority: safeDefaultPriority,
    communityImpact,
    reportCount,
    reasons,
  };
};

module.exports = {
  assessPriority,
};
