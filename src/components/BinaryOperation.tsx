import React from 'react';
import { getSignStatus } from '../lib/binary';
import { BinaryArithmeticDetails } from '../types/division';

interface BinaryOperationProps {
  arithmetic: BinaryArithmeticDetails;
}

export const BinaryOperation: React.FC<BinaryOperationProps> = ({ arithmetic }) => {
  const resultSign = getSignStatus(arithmetic.resultBinary);
  const resultMsb = arithmetic.resultBinary[0];

  const isSubtract = arithmetic.operation === 'SUBTRACT';
  const isRestore = arithmetic.operation === 'RESTORE';

  const headerTitle = isSubtract
    ? 'Binary Subtraction (A = A - M)'
    : isRestore
    ? 'Binary Restoration / Correction (A = A + M)'
    : 'Binary Addition (A = A + M)';

  const topShortLabel = 'A';
  const bottomShortLabel = isSubtract ? '-M' : '+M';
  const resultShortLabel = isSubtract ? 'A-M' : isRestore ? 'A+M' : 'A+M';

  return (
    <div className="teaching-visual-box binary-operation" aria-label={headerTitle}>
      <div className="visual-box-header">
        <span className="visual-box-tag">{headerTitle}</span>
        <span
          className={`sign-text-tag ${
            resultSign === 'NEGATIVE' ? 'tag-negative' : 'tag-positive'
          }`}
        >
          Result is {resultSign} (MSB = {resultMsb})
        </span>
      </div>

      <div className="arithmetic-columns">
        <div className="vertical-math-card">
          <div className="vertical-math-caption">Register Arithmetic</div>
          <div className="vertical-math-grid" role="region" aria-label="Vertical binary operation">
            <div className="math-row">
              <span className="math-label">{topShortLabel}</span>
              <code className="math-bits">{arithmetic.topBinary}</code>
              <span className="math-dec">({arithmetic.topSignedDecimal}₁₀)</span>
            </div>
            <div className="math-row">
              <span className="math-label">{bottomShortLabel}</span>
              <code className="math-bits">{arithmetic.bottomBinary}</code>
              <span className="math-dec">
                ({arithmetic.operatorSymbol}
                {arithmetic.bottomDecimal}₁₀)
              </span>
            </div>
            <div className="math-divider" aria-hidden="true">
              -------------
            </div>
            <div className="math-row math-result-row">
              <span className="math-label">{resultShortLabel}</span>
              <code className="math-bits">
                <span
                  className={
                    resultSign === 'NEGATIVE' ? 'math-msb-negative' : 'math-msb-positive'
                  }
                  title={`Sign bit = ${resultMsb} (${resultSign})`}
                >
                  {arithmetic.resultBinary[0]}
                </span>
                {arithmetic.resultBinary.slice(1)}
              </code>
              <span className="math-dec">({arithmetic.resultSignedDecimal}₁₀)</span>
            </div>
          </div>
        </div>

        {arithmetic.twoComplementAddend && (
          <div className="vertical-math-card two-complement-card">
            <div className="vertical-math-caption">Two&apos;s-Complement Hardware Adder</div>
            <div
              className="vertical-math-grid"
              role="region"
              aria-label="Two's complement hardware addition"
            >
              <div className="math-row">
                <span className="math-label">A</span>
                <code className="math-bits">{arithmetic.topBinary}</code>
                <span className="math-dec">({arithmetic.topSignedDecimal}₁₀)</span>
              </div>
              <div className="math-row">
                <span className="math-label">+(-M)</span>
                <code className="math-bits">{arithmetic.twoComplementAddend}</code>
                <span className="math-dec">(-{arithmetic.bottomDecimal}₁₀)</span>
              </div>
              <div className="math-divider" aria-hidden="true">
                -------------
              </div>
              <div className="math-row math-result-row">
                <span className="math-label">A-M</span>
                <code className="math-bits">{arithmetic.resultBinary}</code>
                <span className="math-dec">({arithmetic.resultSignedDecimal}₁₀)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="visual-box-note">{arithmetic.explanation}</p>
    </div>
  );
};
