import React from 'react';
import { RegisterView } from '../components/RegisterView';
import { ResultView } from '../components/ResultView';
import { SimulationControls } from '../components/SimulationControls';
import { StepExplanation } from '../components/StepExplanation';
import { TraceTable } from '../components/TraceTable';
import { simulateRestoringDivision } from '../lib/restoringDivision';
import { BitWidth } from '../types/division';

interface RestoringSimulatorProps {
  dividend: number;
  divisor: number;
  bitWidth: BitWidth;
  currentStepIndex: number;
  isAutoPlaying: boolean;
  showAllSteps: boolean;
  onStepChange: (index: number) => void;
  onToggleAutoPlay: () => void;
  onPauseAutoPlay: () => void;
  onRestart: () => void;
  onToggleShowAllSteps: () => void;
}

export const RestoringSimulator: React.FC<RestoringSimulatorProps> = ({
  dividend,
  divisor,
  bitWidth,
  currentStepIndex,
  isAutoPlaying,
  showAllSteps,
  onStepChange,
  onToggleAutoPlay,
  onPauseAutoPlay,
  onRestart,
  onToggleShowAllSteps,
}) => {
  const simulation = React.useMemo(
    () => simulateRestoringDivision(dividend, divisor, bitWidth),
    [dividend, divisor, bitWidth]
  );

  const totalSteps = simulation.microSteps.length;
  const safeIndex = Math.min(Math.max(0, currentStepIndex), totalSteps - 1);
  const currentStep = simulation.microSteps[safeIndex];
  const isAtFinalStep = safeIndex === totalSteps - 1;

  return (
    <div className="simulator-workspace" aria-label="Restoring Division Simulator">
      <SimulationControls
        currentStepIndex={safeIndex}
        totalSteps={totalSteps}
        currentStep={currentStep}
        isAutoPlaying={isAutoPlaying}
        showAllSteps={showAllSteps}
        onPrevStep={() => {
          onPauseAutoPlay();
          onStepChange(Math.max(0, safeIndex - 1));
        }}
        onNextStep={() => {
          onPauseAutoPlay();
          onStepChange(Math.min(totalSteps - 1, safeIndex + 1));
        }}
        onToggleAutoPlay={onToggleAutoPlay}
        onPauseAutoPlay={onPauseAutoPlay}
        onRestart={onRestart}
        onToggleShowAllSteps={onToggleShowAllSteps}
        onJumpToStep={(idx) => {
          onPauseAutoPlay();
          onStepChange(idx);
        }}
      />

      <RegisterView step={currentStep} bitWidth={bitWidth} />

      <StepExplanation step={currentStep} />

      <ResultView
        result={simulation}
        isAtFinalStep={isAtFinalStep}
        onJumpToFinalStep={() => {
          onPauseAutoPlay();
          onStepChange(totalSteps - 1);
        }}
      />

      <TraceTable
        result={simulation}
        activeCycle={currentStep.cycle}
        showAllSteps={showAllSteps}
        activeStepIndex={safeIndex}
        onSelectStep={(idx) => {
          onPauseAutoPlay();
          onStepChange(idx);
        }}
      />
    </div>
  );
};
