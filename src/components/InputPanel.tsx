import React from 'react';
import { decimalToBinary, getMaxUnsignedValue, SUPPORTED_BIT_WIDTHS } from '../lib/binary';
import { BitWidth } from '../types/division';

export interface PresetExample {
  label: string;
  dividend: number;
  divisor: number;
  bitWidth: BitWidth;
}

export const PRESET_EXAMPLES: readonly PresetExample[] = [
  { label: '13 ÷ 3', dividend: 13, divisor: 3, bitWidth: 4 },
  { label: '10 ÷ 2', dividend: 10, divisor: 2, bitWidth: 4 },
  { label: '7 ÷ 3', dividend: 7, divisor: 3, bitWidth: 4 },
  { label: '15 ÷ 4', dividend: 15, divisor: 4, bitWidth: 4 },
  { label: '3 ÷ 7', dividend: 3, divisor: 7, bitWidth: 4 },
] as const;

interface InputPanelProps {
  dividendInput: string;
  divisorInput: string;
  bitWidth: BitWidth;
  validationError?: string;
  activeDividend: number;
  activeDivisor: number;
  onDividendChange: (value: string) => void;
  onDivisorChange: (value: string) => void;
  onBitWidthChange: (bitWidth: BitWidth) => void;
  onStartSimulation: () => void;
  onReset: () => void;
  onSelectPreset: (preset: PresetExample) => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  dividendInput,
  divisorInput,
  bitWidth,
  validationError,
  activeDividend,
  activeDivisor,
  onDividendChange,
  onDivisorChange,
  onBitWidthChange,
  onStartSimulation,
  onReset,
  onSelectPreset,
}) => {
  const maxVal = getMaxUnsignedValue(bitWidth);
  const aBitWidth = bitWidth + 1;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartSimulation();
  };

  return (
    <section className="card input-panel" aria-labelledby="input-panel-heading">
      <div className="section-header-row">
        <div>
          <h2 id="input-panel-heading" className="section-title">
            Simulation Inputs &amp; Configuration
          </h2>
          <p className="section-subtitle">
            {bitWidth}-bit unsigned range: <strong>0 to {maxVal}</strong> (Divisor M must be{' '}
            <strong>1 to {maxVal}</strong>; Accumulator A uses <strong>{aBitWidth} bits</strong>)
          </p>
        </div>
        <div className="unsigned-scope-badge" title="Unsigned Binary Division Scope">
          Unsigned {bitWidth}-Bit Mode
        </div>
      </div>

      <form className="input-form" onSubmit={handleFormSubmit} noValidate>
        <div className="input-grid">
          <div className="form-group">
            <label htmlFor="dividend-input" className="form-label">
              Dividend Q (Decimal)
            </label>
            <input
              id="dividend-input"
              type="text"
              inputMode="numeric"
              className={`form-input ${validationError ? 'input-has-error' : ''}`}
              value={dividendInput}
              onChange={(e) => onDividendChange(e.target.value)}
              placeholder={`0 to ${maxVal}`}
              aria-describedby="range-hint"
            />
            <span className="input-helper">
              Initializes {bitWidth}-bit Register Q
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="divisor-input" className="form-label">
              Divisor M (Decimal)
            </label>
            <input
              id="divisor-input"
              type="text"
              inputMode="numeric"
              className={`form-input ${validationError ? 'input-has-error' : ''}`}
              value={divisorInput}
              onChange={(e) => onDivisorChange(e.target.value)}
              placeholder={`1 to ${maxVal}`}
              aria-describedby="range-hint"
            />
            <span className="input-helper">
              Initializes {bitWidth}-bit Register M (extended to {aBitWidth} bits for A arithmetic)
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="bit-width-select" className="form-label">
              Bit Width (n)
            </label>
            <div className="bit-width-group" role="group" aria-label="Bit Width">
              {SUPPORTED_BIT_WIDTHS.map((width) => (
                <button
                  key={width}
                  type="button"
                  className={`bit-width-btn ${bitWidth === width ? 'active' : ''}`}
                  onClick={() => onBitWidthChange(width)}
                  aria-pressed={bitWidth === width}
                >
                  {width}-bit
                </button>
              ))}
            </div>
            <span id="range-hint" className="input-helper">
              {bitWidth}-bit unsigned range: 0 to {maxVal}
            </span>
          </div>
        </div>

        <div className="preset-and-actions-row">
          <div className="presets-bar" aria-label="Preset division examples">
            <span className="presets-label">Preset Examples:</span>
            <div className="preset-buttons">
              {PRESET_EXAMPLES.map((preset) => {
                const isCurrent =
                  !validationError &&
                  activeDividend === preset.dividend &&
                  activeDivisor === preset.divisor &&
                  bitWidth === preset.bitWidth;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    className={`preset-btn ${isCurrent ? 'active' : ''}`}
                    onClick={() => onSelectPreset(preset)}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="action-buttons">
            <button type="submit" className="btn btn-primary">
              Start Simulation
            </button>
            <button type="button" className="btn btn-secondary" onClick={onReset}>
              Reset
            </button>
          </div>
        </div>
      </form>

      {validationError ? (
        <div className="validation-error-box" role="alert" aria-live="assertive">
          <div className="validation-error-title">Invalid Input</div>
          <p className="validation-error-text">{validationError}</p>
        </div>
      ) : (
        <div className="initial-setup-summary" aria-label="Initial binary register setup">
          <div className="setup-chip">
            <span className="setup-chip-label">Initial A ({aBitWidth}-bit):</span>
            <code className="mono-value">{decimalToBinary(0, aBitWidth)}₂</code>
            <span className="setup-chip-dec">(0₁₀)</span>
          </div>
          <div className="setup-chip">
            <span className="setup-chip-label">Initial Q ({bitWidth}-bit):</span>
            <code className="mono-value">{decimalToBinary(activeDividend, bitWidth)}₂</code>
            <span className="setup-chip-dec">({activeDividend}₁₀)</span>
          </div>
          <div className="setup-chip">
            <span className="setup-chip-label">Divisor M ({bitWidth}-bit / {aBitWidth}-bit):</span>
            <code className="mono-value">
              {decimalToBinary(activeDivisor, bitWidth)}₂ /{' '}
              {decimalToBinary(activeDivisor, aBitWidth)}₂
            </code>
            <span className="setup-chip-dec">({activeDivisor}₁₀)</span>
          </div>
          <div className="setup-chip">
            <span className="setup-chip-label">Initial Count:</span>
            <code className="mono-value">{bitWidth}</code>
          </div>
        </div>
      )}
    </section>
  );
};
