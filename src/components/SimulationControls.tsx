import React from 'react';
import { MicroStep } from '../types/division';

interface SimulationControlsProps {
  currentStepIndex: number;
  totalSteps: number;
  currentStep: MicroStep;
  isAutoPlaying: boolean;
  showAllSteps: boolean;
  onPrevStep: () => void;
  onNextStep: () => void;
  onToggleAutoPlay: () => void;
  onPauseAutoPlay: () => void;
  onRestart: () => void;
  onToggleShowAllSteps: () => void;
  onJumpToStep: (index: number) => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  currentStepIndex,
  totalSteps,
  currentStep,
  isAutoPlaying,
  showAllSteps,
  onPrevStep,
  onNextStep,
  onToggleAutoPlay,
  onPauseAutoPlay,
  onRestart,
  onToggleShowAllSteps,
  onJumpToStep,
}) => {
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const progressPercent =
    totalSteps > 1 ? Math.round(((currentStepIndex + 1) / totalSteps) * 100) : 100;

  const cycleLabel =
    currentStep.phase === 'final-correction'
      ? `Final Correction Step (After Cycle ${currentStep.totalCycles})`
      : `Cycle ${currentStep.cycle} of ${currentStep.totalCycles}`;

  return (
    <section className="card simulation-controls" aria-label="Interactive simulation controls">
      <div className="controls-progress-header">
        <div className="progress-titles">
          <span className="progress-cycle-pill">{cycleLabel}</span>
          <span className="progress-step-title">{currentStep.title}</span>
        </div>
        <div className="progress-step-counter">
          Micro-Step <strong>{currentStepIndex + 1}</strong> of <strong>{totalSteps}</strong> (
          {progressPercent}%)
        </div>
      </div>

      <div className="progress-bar-track" role="progressbar" aria-valuenow={currentStepIndex + 1} aria-valuemin={1} aria-valuemax={totalSteps}>
        <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="controls-button-row">
        <div className="controls-primary-group">
          <button
            type="button"
            className="btn btn-control"
            onClick={onPrevStep}
            disabled={isFirstStep}
          >
            ← Previous Step
          </button>

          <button
            type="button"
            className="btn btn-primary btn-control"
            onClick={onNextStep}
            disabled={isLastStep}
          >
            Next Step →
          </button>

          {!isAutoPlaying ? (
            <button
              type="button"
              className="btn btn-control btn-autoplay"
              onClick={onToggleAutoPlay}
              disabled={isLastStep}
            >
              ▶ Auto Play
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-control btn-pause"
              onClick={onPauseAutoPlay}
            >
              ⏸ Pause
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-control"
            onClick={onRestart}
          >
            ↺ Restart
          </button>
        </div>

        <div className="controls-secondary-group">
          <button
            type="button"
            className={`btn btn-outline btn-control ${showAllSteps ? 'active' : ''}`}
            onClick={onToggleShowAllSteps}
            aria-pressed={showAllSteps}
          >
            {showAllSteps ? 'Hide All Steps' : 'Show All Steps'}
          </button>
        </div>
      </div>

      <div className="step-scrubber-row">
        <label htmlFor="step-scrubber" className="scrubber-label">
          Jump to Micro-Step:
        </label>
        <input
          id="step-scrubber"
          type="range"
          min={0}
          max={totalSteps - 1}
          value={currentStepIndex}
          onChange={(e) => onJumpToStep(Number(e.target.value))}
          className="step-scrubber-input"
        />
      </div>
    </section>
  );
};
