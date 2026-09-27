import React from 'react';
import { DivisionSimulationResult } from '../types/division';

interface TraceTableProps {
  result: DivisionSimulationResult;
  activeCycle: number;
  showAllSteps: boolean;
  activeStepIndex: number;
  onSelectStep: (stepIndex: number) => void;
}

export const TraceTable: React.FC<TraceTableProps> = ({
  result,
  activeCycle,
  showAllSteps,
  activeStepIndex,
  onSelectStep,
}) => {
  const isRestoring = result.algorithm === 'restoring';

  const handleCycleClick = (cycle: number) => {
    const firstStepOfCycle = result.microSteps.find(
      (s) => s.cycle === cycle && s.stepNumberInCycle === 1
    );
    if (firstStepOfCycle) {
      onSelectStep(firstStepOfCycle.stepIndex);
    }
  };

  return (
    <section className="card trace-table-section" aria-labelledby="trace-table-heading">
      <div className="trace-header-row">
        <div>
          <h3 id="trace-table-heading" className="subsection-title">
            Complete Cycle-by-Cycle Register Trace Table
          </h3>
          <p className="section-subtitle">
            Click any cycle row to jump the interactive simulator to that cycle.
          </p>
        </div>
        <span className="trace-count-badge">{result.bitWidth} Cycles Total</span>
      </div>

      <div className="table-scroll-container" role="region" aria-label="Cycle trace table" tabIndex={0}>
        {isRestoring && result.restoringCycles ? (
          <table className="trace-table">
            <thead>
              <tr>
                <th scope="col">Cycle</th>
                <th scope="col">A Before</th>
                <th scope="col">Q Before</th>
                <th scope="col">After Shift A</th>
                <th scope="col">After Shift Q</th>
                <th scope="col">A - M</th>
                <th scope="col">Sign</th>
                <th scope="col">Q₀</th>
                <th scope="col">Restored?</th>
                <th scope="col">A Final</th>
                <th scope="col">Q Final</th>
                <th scope="col">Count</th>
              </tr>
            </thead>
            <tbody>
              {result.restoringCycles.map((row) => {
                const isCurrentCycle = activeCycle === row.cycle;
                return (
                  <tr
                    key={row.cycle}
                    className={`trace-row ${isCurrentCycle ? 'trace-row-active' : ''}`}
                    onClick={() => handleCycleClick(row.cycle)}
                    title={`Click to view Cycle ${row.cycle}`}
                  >
                    <td className="trace-cycle-cell">Cycle {row.cycle}</td>
                    <td>
                      <code>{row.aBefore}</code>
                    </td>
                    <td>
                      <code>{row.qBefore}</code>
                    </td>
                    <td>
                      <code>{row.afterShiftA}</code>
                    </td>
                    <td>
                      <code>{row.afterShiftQ}</code>
                    </td>
                    <td>
                      <code>{row.aMinusM}</code>{' '}
                      <span className="trace-dec-sub">({row.aMinusMSigned})</span>
                    </td>
                    <td>
                      <span
                        className={`sign-text-tag ${
                          row.sign === 'NEGATIVE' ? 'tag-negative' : 'tag-positive'
                        }`}
                      >
                        {row.sign}
                      </span>
                    </td>
                    <td>
                      <strong className="trace-q0">{row.q0}</strong>
                    </td>
                    <td>
                      {row.restored ? (
                        <span className="trace-restored-yes">Yes (A + M)</span>
                      ) : (
                        <span className="trace-restored-no">No</span>
                      )}
                    </td>
                    <td>
                      <code className="trace-final-code">{row.aFinal}</code>
                    </td>
                    <td>
                      <code className="trace-final-code">{row.qFinal}</code>
                    </td>
                    <td className="trace-count-cell">{row.countAfter}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          result.nonRestoringCycles && (
            <table className="trace-table">
              <thead>
                <tr>
                  <th scope="col">Cycle</th>
                  <th scope="col">A Before</th>
                  <th scope="col">Q Before</th>
                  <th scope="col">Previous Sign</th>
                  <th scope="col">Operation</th>
                  <th scope="col">After Shift A</th>
                  <th scope="col">After Shift Q</th>
                  <th scope="col">A After Arithmetic</th>
                  <th scope="col">Q₀</th>
                  <th scope="col">A Final</th>
                  <th scope="col">Q Final</th>
                  <th scope="col">Count</th>
                </tr>
              </thead>
              <tbody>
                {result.nonRestoringCycles.map((row) => {
                  const isCurrentCycle = activeCycle === row.cycle;
                  return (
                    <tr
                      key={row.cycle}
                      className={`trace-row ${isCurrentCycle ? 'trace-row-active' : ''}`}
                      onClick={() => handleCycleClick(row.cycle)}
                      title={`Click to view Cycle ${row.cycle}`}
                    >
                      <td className="trace-cycle-cell">Cycle {row.cycle}</td>
                      <td>
                        <code>{row.aBefore}</code>
                      </td>
                      <td>
                        <code>{row.qBefore}</code>
                      </td>
                      <td>
                        <span
                          className={`sign-text-tag ${
                            row.previousSign === 'NEGATIVE' ? 'tag-negative' : 'tag-positive'
                          }`}
                        >
                          {row.previousSign}
                        </span>
                      </td>
                      <td>
                        <code className="trace-op-pill">{row.operation}</code>
                      </td>
                      <td>
                        <code>{row.afterShiftA}</code>
                      </td>
                      <td>
                        <code>{row.afterShiftQ}</code>
                      </td>
                      <td>
                        <code>{row.aAfterArithmetic}</code>{' '}
                        <span className="trace-dec-sub">({row.aAfterArithmeticSigned})</span>{' '}
                        <span
                          className={`sign-text-tag ${
                            row.afterArithmeticSign === 'NEGATIVE'
                              ? 'tag-negative'
                              : 'tag-positive'
                          }`}
                        >
                          {row.afterArithmeticSign}
                        </span>
                      </td>
                      <td>
                        <strong className="trace-q0">{row.q0}</strong>
                      </td>
                      <td>
                        <code className="trace-final-code">{row.aFinal}</code>
                      </td>
                      <td>
                        <code className="trace-final-code">{row.qFinal}</code>
                      </td>
                      <td className="trace-count-cell">{row.countAfter}</td>
                    </tr>
                  );
                })}
                {result.finalCorrection && (
                  <tr
                    className={`trace-row trace-final-correction-row ${
                      activeCycle === result.bitWidth + 1 ? 'trace-row-active' : ''
                    }`}
                    onClick={() => onSelectStep(result.microSteps.length - 1)}
                    title="Click to view Final Correction Step"
                  >
                    <td className="trace-cycle-cell">Final Check</td>
                    <td>
                      <code>{result.finalCorrection.aBeforeCorrection}</code>
                    </td>
                    <td>
                      <code>{result.quotientBinary}</code>
                    </td>
                    <td>
                      <span
                        className={`sign-text-tag ${
                          result.finalCorrection.needed ? 'tag-negative' : 'tag-positive'
                        }`}
                      >
                        {result.finalCorrection.needed ? 'NEGATIVE' : 'NON-NEGATIVE'}
                      </span>
                    </td>
                    <td>
                      <code className="trace-op-pill">
                        {result.finalCorrection.needed ? 'A = A + M (Restore)' : 'None Required'}
                      </code>
                    </td>
                    <td>—</td>
                    <td>—</td>
                    <td>
                      <code>{result.finalCorrection.aAfterCorrection}</code>{' '}
                      <span className="trace-dec-sub">
                        ({result.finalCorrection.aAfterCorrectionSigned})
                      </span>
                    </td>
                    <td>—</td>
                    <td>
                      <code className="trace-final-code">
                        {result.finalCorrection.aAfterCorrection}
                      </code>
                    </td>
                    <td>
                      <code className="trace-final-code">{result.quotientBinary}</code>
                    </td>
                    <td className="trace-count-cell">0</td>
                  </tr>
                )}
              </tbody>
            </table>
          )
        )}
      </div>

      {showAllSteps && (
        <div className="all-microsteps-panel" aria-label="All micro-steps walkthrough">
          <h4 className="all-steps-heading">
            Complete Step-by-Step Walkthrough ({result.microSteps.length} Micro-Steps)
          </h4>
          <div className="all-steps-list">
            {result.microSteps.map((step) => {
              const isSelected = step.stepIndex === activeStepIndex;
              return (
                <div
                  key={step.stepIndex}
                  className={`all-step-item ${isSelected ? 'all-step-item-active' : ''}`}
                  onClick={() => onSelectStep(step.stepIndex)}
                >
                  <div className="all-step-item-top">
                    <span className="all-step-badge">
                      {step.phase === 'final-correction'
                        ? 'Final Correction'
                        : `Cycle ${step.cycle} • Step ${step.stepNumberInCycle}`}
                    </span>
                    <strong className="all-step-title">{step.title}</strong>
                    <span
                      className={`sign-text-tag ${
                        step.signStatus === 'NEGATIVE' ? 'tag-negative' : 'tag-positive'
                      }`}
                    >
                      {step.signStatus}
                    </span>
                  </div>
                  <div className="all-step-registers">
                    <span>
                      A = <code>{step.A}</code> ({step.ASignedDecimal}₁₀)
                    </span>
                    <span>
                      Q = <code>{step.Q}</code>
                    </span>
                    <span>
                      M = <code>{step.MExtended}</code>
                    </span>
                    <span>
                      Q₀ = <strong>{step.Q0 !== null ? step.Q0 : '—'}</strong>
                    </span>
                    <span>
                      Count = <strong>{step.count}</strong>
                    </span>
                  </div>
                  <p className="all-step-desc">{step.explanation}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
