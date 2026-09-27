import React from 'react';
import { MicroStep } from '../types/division';
import { BinaryOperation } from './BinaryOperation';
import { ShiftVisualizer } from './ShiftVisualizer';

interface StepExplanationProps {
  step: MicroStep;
}

export const StepExplanation: React.FC<StepExplanationProps> = ({ step }) => {
  const cycleBadge =
    step.phase === 'final-correction'
      ? 'Final Remainder Check'
      : `Cycle ${step.cycle} of ${step.totalCycles} • Micro-Step ${step.stepNumberInCycle} of ${step.totalStepsInCycle}`;

  return (
    <section className="card step-explanation" aria-labelledby="step-explanation-heading">
      <div className="step-explanation-header">
        <div>
          <span className="step-kicker">{cycleBadge}</span>
          <h3 id="step-explanation-heading" className="step-main-title">
            {step.title}
          </h3>
        </div>
        <div className="step-decision-badges">
          <span
            className={`sign-text-tag ${
              step.signStatus === 'NEGATIVE' ? 'tag-negative' : 'tag-positive'
            }`}
          >
            {step.signStatus}
          </span>
          {step.Q0 !== null && (
            <span className="q0-decision-pill">Q₀ = {step.Q0}</span>
          )}
          {step.restored && (
            <span className="restored-pill">Restored (A = A + M)</span>
          )}
        </div>
      </div>

      <blockquote className="teacher-explanation-quote">
        <p>{step.explanation}</p>
      </blockquote>

      {step.bulletPoints && step.bulletPoints.length > 0 && (
        <ul className="step-bullet-list">
          {step.bulletPoints.map((point, idx) => (
            <li key={idx}>{point}</li>
          ))}
        </ul>
      )}

      {step.shiftDetails && <ShiftVisualizer shift={step.shiftDetails} />}

      {step.primaryArithmetic && <BinaryOperation arithmetic={step.primaryArithmetic} />}
    </section>
  );
};
