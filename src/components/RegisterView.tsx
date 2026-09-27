import React from 'react';
import { formatBinary, getSignStatus } from '../lib/binary';
import { BitWidth, MicroStep } from '../types/division';

interface RegisterViewProps {
  step: MicroStep;
  bitWidth: BitWidth;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ step, bitWidth }) => {
  const aBitWidth = bitWidth + 1;
  const aSignBit = step.A[0];
  const aRemainingBits = step.A.slice(1);
  const currentASignStatus = getSignStatus(step.A);

  const qPrefixBits = step.Q.slice(0, -1);
  const q0Bit = step.Q[step.Q.length - 1];

  return (
    <section className="card register-view" aria-labelledby="register-view-heading">
      <div className="register-header-row">
        <h3 id="register-view-heading" className="subsection-title">
          Live Hardware Registers
        </h3>
        <div className="register-badges">
          <span className="badge badge-cycle">
            {step.phase === 'final-correction'
              ? 'Post-Loop Final Check'
              : `Cycle ${step.cycle} of ${step.totalCycles}`}
          </span>
          <span
            className={`badge ${
              currentASignStatus === 'NEGATIVE' ? 'badge-negative' : 'badge-positive'
            }`}
          >
            A is {currentASignStatus} (MSB = {aSignBit})
          </span>
        </div>
      </div>

      <div className="register-table-wrapper">
        <table className="register-box-table" aria-label="Current CPU division registers">
          <thead>
            <tr>
              <th scope="col">
                <span className="reg-col-title">A</span>
                <span className="reg-col-sub">Accumulator ({aBitWidth}-bit)</span>
              </th>
              <th scope="col">
                <span className="reg-col-title">Q</span>
                <span className="reg-col-sub">Dividend / Quotient ({bitWidth}-bit)</span>
              </th>
              <th scope="col">
                <span className="reg-col-title">M</span>
                <span className="reg-col-sub">Divisor ({aBitWidth}-bit extended)</span>
              </th>
              <th scope="col">
                <span className="reg-col-title">Q₀</span>
                <span className="reg-col-sub">LSB Decision</span>
              </th>
              <th scope="col">
                <span className="reg-col-title">Count</span>
                <span className="reg-col-sub">Cycles Left</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                className={`reg-cell ${
                  step.highlightRegister === 'A' || step.highlightRegister === 'AQ'
                    ? 'reg-cell-highlight'
                    : ''
                }`}
              >
                <div className="binary-bits-display" title="A register bits (MSB is sign bit)">
                  <span
                    className={`sign-bit-pill ${
                      aSignBit === '1' ? 'sign-bit-negative' : 'sign-bit-positive'
                    } ${step.highlightSignBit ? 'sign-bit-emphasized' : ''}`}
                    title={`Sign Bit (MSB) = ${aSignBit} (${currentASignStatus})`}
                  >
                    {aSignBit}
                  </span>
                  <span className="remaining-bits">{formatBinary(aRemainingBits, 4)}</span>
                </div>
                <div className="reg-meta-row">
                  <span className="reg-decimal">Signed: {step.ASignedDecimal}₁₀</span>
                  <span
                    className={`sign-text-tag ${
                      currentASignStatus === 'NEGATIVE' ? 'tag-negative' : 'tag-positive'
                    }`}
                  >
                    {currentASignStatus}
                  </span>
                </div>
              </td>

              <td
                className={`reg-cell ${
                  step.highlightRegister === 'Q' || step.highlightRegister === 'AQ'
                    ? 'reg-cell-highlight'
                    : ''
                }`}
              >
                <div className="binary-bits-display" title="Q register bits (LSB is Q₀)">
                  <span className="remaining-bits">{formatBinary(qPrefixBits, 4)}</span>
                  <span
                    className={`q0-bit-pill ${step.highlightQ0 ? 'q0-bit-active' : ''}`}
                    title={`Q₀ (Least-Significant Quotient Bit) = ${q0Bit}`}
                  >
                    {q0Bit}
                  </span>
                </div>
                <div className="reg-meta-row">
                  <span className="reg-decimal">Unsigned: {step.QUnsignedDecimal}₁₀</span>
                  <span className="q0-status-note">
                    {step.Q0 !== null ? `Q₀ set to ${step.Q0}` : 'Q₀ awaiting decision'}
                  </span>
                </div>
              </td>

              <td className="reg-cell">
                <div className="binary-bits-display">
                  <span className="remaining-bits">{formatBinary(step.MExtended, 4)}</span>
                </div>
                <div className="reg-meta-row">
                  <span className="reg-decimal">
                    {step.M}₂ ({step.MDecimal}₁₀)
                  </span>
                </div>
              </td>

              <td className={`reg-cell ${step.highlightQ0 ? 'reg-cell-highlight' : ''}`}>
                <div className="q0-standalone">
                  {step.Q0 !== null ? (
                    <span className="q0-badge-decided">Q₀ = {step.Q0}</span>
                  ) : (
                    <span className="q0-badge-pending">Pending</span>
                  )}
                </div>
              </td>

              <td
                className={`reg-cell ${
                  step.highlightRegister === 'COUNT' ? 'reg-cell-highlight' : ''
                }`}
              >
                <div className="count-display">
                  <span className="count-number">{step.count}</span>
                </div>
                <div className="reg-meta-row">
                  <span className="reg-decimal">of {step.totalCycles}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};
