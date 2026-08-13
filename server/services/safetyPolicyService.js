/**
 * Safety Policy — deterministic 6-rule verification of Challenger output.
 * PRD §10: Safety Policy section.
 * The LLM identifies risks. This code verifies them. Code has authority.
 */

/**
 * @param {object} proposal - { proposedAction, dose }
 * @param {object} challengerResult - result from Python /challenge
 * @param {object} evidence - actual field data used to verify challenger claims
 * @returns {{ finalAction, decisionReason }}
 */
function applyPolicy(proposal, challengerResult, evidence) {
  // Rule 1: No challenge → keep the proposal
  if (!challengerResult || !challengerResult.challenged) {
    return {
      finalAction: proposal.proposedAction === 'APPLY' ? 'APPLY'
        : proposal.proposedAction === 'HARVEST' ? 'HARVEST'
        : 'HOLD',
      decisionReason: 'No challenger objection. Proposal accepted.',
    };
  }

  const citedEvidence = challengerResult.cited_evidence || [];

  // Rule 2 & 3: Verify every cited value against actual tool data
  const unverifiedClaims = citedEvidence.filter((claim) => {
    const actualValue = evidence[claim.field];
    if (actualValue === undefined || actualValue === null) return true; // unsupported
    // Mismatch check: allow 10% tolerance for numeric values
    if (typeof actualValue === 'number' && typeof claim.value === 'number') {
      return Math.abs(actualValue - claim.value) / (Math.abs(actualValue) || 1) > 0.10;
    }
    return String(actualValue).toLowerCase() !== String(claim.value).toLowerCase();
  });

  if (unverifiedClaims.length === citedEvidence.length && citedEvidence.length > 0) {
    // All claims unverified → discard objection
    return {
      finalAction: proposal.proposedAction === 'APPLY' ? 'APPLY'
        : proposal.proposedAction === 'HARVEST' ? 'HARVEST'
        : 'HOLD',
      decisionReason: 'Challenger objection discarded: no cited evidence verified against actual data.',
    };
  }

  // Rule 4: Verified rainfall risk ≥15mm and probability ≥50% → WAIT
  const rainfallClaim = citedEvidence.find(
    (c) => c.field.toLowerCase().includes('rain') || c.field.toLowerCase().includes('rainfall')
  );
  if (rainfallClaim) {
    const actualRain = evidence.next3DayRainfall ?? evidence.forecast_rainfall ?? 0;
    const rainProb = evidence.rainProbability ?? evidence.rain_probability ?? 0;
    if (actualRain >= 15 && rainProb >= 50) {
      return {
        finalAction: 'WAIT',
        decisionReason: `Rainfall risk verified: ${actualRain.toFixed(1)}mm expected with ${rainProb}% probability. Waiting for better window.`,
      };
    }
  }

  // Rule 5: Verified objection with soil test older than 90 days → HOLD
  const soilClaim = citedEvidence.find((c) => c.field.toLowerCase().includes('soil'));
  if (soilClaim && evidence.soilTestedOn) {
    const daysSinceSoilTest = (Date.now() - new Date(evidence.soilTestedOn).getTime()) / 86400000;
    if (daysSinceSoilTest > 90) {
      return {
        finalAction: 'HOLD',
        decisionReason: `Soil test is ${Math.round(daysSinceSoilTest)} days old (>90 days). Recommend fresh soil test before applying.`,
      };
    }
  }

  // Rule 6: Otherwise keep the original proposal
  return {
    finalAction: proposal.proposedAction === 'APPLY' ? 'APPLY'
      : proposal.proposedAction === 'HARVEST' ? 'HARVEST'
      : 'HOLD',
    decisionReason: 'Challenger objection reviewed but not sufficient to override proposal.',
  };
}

module.exports = { applyPolicy };
