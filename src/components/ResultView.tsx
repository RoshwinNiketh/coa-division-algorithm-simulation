import React from 'react';
import { DivisionSimulationResult } from '../types/division';

interface ResultViewProps {
  result: DivisionSimulationResult;
  isAtFinalStep: boolean;
  onJumpToFinalStep: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  result,
  isAtFinalStep,
  onJumpToFinalStep,
}) => {
  const {
    dividend,
    divisor,
    quotientBinary,
    quotientDecimal,
    remainderBinary,
    remainderDecimal,
    verification,
    algorithm,
    finalCorrection,
  } = result;

  return (
    <section
      className={`card result-view ${isAtFinalStep ? 'result-view-complete' : ''}`}
      aria-labelledby="result-view-heading"
    >
      <div className="result-header-row">
        <div>
          <h3 id="result-view-heading" className="subsection-title">
            Final Division Result &amp; Mathematical Verification
          </h3>
          <p className="section-subtitle">
            {algorithm === 'restoring' ? 'Restoring Division' : 'Non-Restoring Division'} output
            for <strong>{dividend} ÷ {divisor}</strong>
          </p>
        </div>
        {!isAtFinalStep ? (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onJumpToFinalStep}
          >
            Jump to Final Step →
          </button>
        ) : (
          <span className="completion-pill">Simulation Complete</span>
        )}
      </div>

      <div className="result-cards-grid">
        <div className="result-metric-box">
          <span className="result-metric-label">Quotient (Register Q)</span>
          <div className="result-metric-value">
            <code className="mono-large">{quotientBinary}₂</code>
            <span className="equals-sign">=</span>
            <strong className="decimal-large">{quotientDecimal}₁₀</strong>
          </div>
        </div>

        <div className="result-metric-box">
          <span className="result-metric-label">Remainder (Register A)</span>
          <div className="result-metric-value">
            <code className="mono-large">{remainderBinary}₂</code>
            <span className="equals-sign">=</span>
            <strong className="decimal-large">{remainderDecimal}₁₀</strong>
          </div>
        </div>

        <div className="result-metric-box result-summary-statement">
          <span className="result-metric-label">Division Summary</span>
          <div className="result-statement-text">
            {dividend} ÷ {divisor} = <strong>{quotientDecimal}</strong> remainder{' '}
            <strong>{remainderDecimal}</strong>
          </div>
        </div>
      </div>

      {algorithm === 'non-restoring' && finalCorrection && (
        <div className="final-correction-callout">
          <strong>Non-Restoring Final Correction Check:</strong>{' '}
          {finalCorrection.needed ? (
            <span>
              After Cycle {result.bitWidth}, A was <code>{finalCorrection.aBeforeCorrection}₂</code>{' '}
              ({finalCorrection.aBeforeCorrectionSigned}₁₀, NEGATIVE). Adding M (
              <code>{finalCorrection.mExtended}₂</code>) restored A to{' '}
              <code>{finalCorrection.aAfterCorrection}₂</code> ({remainderDecimal}₁₀).
            </span>
          ) : (
            <span>
              After Cycle {result.bitWidth}, A was <code>{finalCorrection.aBeforeCorrection}₂</code>{' '}
              ({finalCorrection.aBeforeCorrectionSigned}₁₀, NON-NEGATIVE). No final correction was
              required.
            </span>
          )}
        </div>
      )}

      <div className="verification-panel" aria-label="Result verification">
        <div className="verification-checks-grid">
          <div className="verification-item">
            <span className="verification-formula-label">
              Euclidean Division Identity:
            </span>
            <div className="verification-formula">
              Dividend = Divisor × Quotient + Remainder
            </div>
            <div className="verification-equation">
              <code>{verification.equation}</code>
            </div>
          </div>

          <div className="verification-item">
            <span className="verification-formula-label">
              Remainder Range Condition:
            </span>
            <div className="verification-formula">0 ≤ Remainder &lt; Divisor</div>
            <div className="verification-equation">
              <code>
                0 ≤ {remainderDecimal} &lt; {divisor}
              </code>{' '}
              (Remainder &lt; Divisor)
            </div>
          </div>
        </div>

        {verification.isVerified && (
          <div className="verified-badge-banner" role="status">
            ✓ Result Verified — Both Euclidean identity and remainder bounds hold
          </div>
        )}
      </div>
    </section>
  );
};
