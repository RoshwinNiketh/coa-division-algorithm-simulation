import React from 'react';
import { ShiftDetails } from '../types/division';

interface ShiftVisualizerProps {
  shift: ShiftDetails;
}

export const ShiftVisualizer: React.FC<ShiftVisualizerProps> = ({ shift }) => {
  const aBeforeKept = shift.aBefore.slice(1);
  const qBeforeMsb = shift.qBefore[0];
  const qBeforeRest = shift.qBefore.slice(1);

  const aAfterPrefix = shift.aAfter.slice(0, -1);
  const aAfterLsb = shift.aAfter[shift.aAfter.length - 1];
  const qAfterPrefix = shift.qAfter.slice(0, -1);
  const qAfterQ0 = shift.qAfter[shift.qAfter.length - 1];

  return (
    <div className="teaching-visual-box shift-visualizer" aria-label="Combined Left Shift Visualization">
      <div className="visual-box-header">
        <span className="visual-box-tag">Combined Register Left Shift [A, Q]</span>
        <span className="visual-box-summary">
          MSB of Q (<code>{shift.msbMovedFromQToA}</code>) crosses into LSB of A
        </span>
      </div>

      <div className="shift-diagram">
        <div className="shift-state-block">
          <div className="shift-state-caption">Before shift:</div>
          <div className="shift-registers-pair">
            <div className="shift-reg-col">
              <span className="shift-reg-label">A</span>
              <code className="shift-binary-code">
                <span className="bit-discarded" title="Shifted out of A MSB">
                  {shift.discardedMsbFromA}
                </span>
                <span>{aBeforeKept}</span>
              </code>
            </div>
            <span className="shift-pipe" aria-hidden="true">
              |
            </span>
            <div className="shift-reg-col">
              <span className="shift-reg-label">Q</span>
              <code className="shift-binary-code">
                <span className="bit-crossing" title="Moves into LSB of A">
                  {qBeforeMsb}
                </span>
                <span>{qBeforeRest}</span>
              </code>
            </div>
          </div>
        </div>

        <div className="shift-arrow-block" aria-hidden="true">
          <span className="shift-arrow-icon">↓ LEFT SHIFT</span>
          <span className="shift-arrow-detail">
            Q<sub>MSB</sub> ({shift.msbMovedFromQToA}) → A<sub>LSB</sub> | Q<sub>0</sub> vacated
          </span>
        </div>

        <div className="shift-state-block">
          <div className="shift-state-caption">After shift:</div>
          <div className="shift-registers-pair">
            <div className="shift-reg-col">
              <span className="shift-reg-label">A</span>
              <code className="shift-binary-code">
                <span>{aAfterPrefix}</span>
                <span className="bit-crossing" title="Received from MSB of Q">
                  {aAfterLsb}
                </span>
              </code>
            </div>
            <span className="shift-pipe" aria-hidden="true">
              |
            </span>
            <div className="shift-reg-col">
              <span className="shift-reg-label">Q</span>
              <code className="shift-binary-code">
                <span>{qAfterPrefix}</span>
                <span className="bit-vacated" title="Vacated Q₀ position (0 placeholder)">
                  {qAfterQ0}
                </span>
              </code>
            </div>
          </div>
        </div>
      </div>

      <p className="visual-box-note">
        <strong>Cross-Register Movement:</strong> Register A shifts left by 1 bit and receives{' '}
        <code>{shift.msbMovedFromQToA}</code> from Q&apos;s most-significant bit into A&apos;s
        least-significant bit. Register Q shifts left by 1 bit, opening the least-significant slot{' '}
        <strong>Q₀</strong> (shown as <code>0</code> until the sign check sets <code>Q₀</code>).
      </p>
    </div>
  );
};
