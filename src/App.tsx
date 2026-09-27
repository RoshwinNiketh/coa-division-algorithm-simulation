import React, { useEffect, useState } from 'react';
import { InputPanel, PresetExample } from './components/InputPanel';
import { validateSimulationInputs } from './lib/binary';
import { NonRestoringSimulator } from './simulators/NonRestoringSimulator';
import { RestoringSimulator } from './simulators/RestoringSimulator';
import { BitWidth, DivisionAlgorithm } from './types/division';

const DEFAULT_DIVIDEND = 13;
const DEFAULT_DIVISOR = 3;
const DEFAULT_BIT_WIDTH: BitWidth = 4;

export const App: React.FC = () => {
  const [algorithm, setAlgorithm] = useState<DivisionAlgorithm>('restoring');
  const [dividendInput, setDividendInput] = useState<string>(String(DEFAULT_DIVIDEND));
  const [divisorInput, setDivisorInput] = useState<string>(String(DEFAULT_DIVISOR));
  const [bitWidth, setBitWidth] = useState<BitWidth>(DEFAULT_BIT_WIDTH);

  const [activeDividend, setActiveDividend] = useState<number>(DEFAULT_DIVIDEND);
  const [activeDivisor, setActiveDivisor] = useState<number>(DEFAULT_DIVISOR);
  const [activeBitWidth, setActiveBitWidth] = useState<BitWidth>(DEFAULT_BIT_WIDTH);
  const [validationError, setValidationError] = useState<string | undefined>(undefined);

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [showAllSteps, setShowAllSteps] = useState<boolean>(false);
  const [isIntroExpanded, setIsIntroExpanded] = useState<boolean>(true);

  const totalStepsForActive =
    algorithm === 'restoring' ? activeBitWidth * 5 : activeBitWidth * 5 + 1;

  useEffect(() => {
    if (!isAutoPlaying) return;

    if (currentStepIndex >= totalStepsForActive - 1) {
      setIsAutoPlaying(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= totalStepsForActive - 1) {
          setIsAutoPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1100);

    return () => window.clearTimeout(timer);
  }, [isAutoPlaying, currentStepIndex, totalStepsForActive]);

  const applyAndValidate = (
    nextDividendRaw: string,
    nextDivisorRaw: string,
    nextBitWidth: BitWidth
  ) => {
    setIsAutoPlaying(false);
    const check = validateSimulationInputs(nextDividendRaw, nextDivisorRaw, nextBitWidth);
    if (!check.valid) {
      setValidationError(check.error);
      return;
    }
    setValidationError(undefined);
    setActiveDividend(check.dividend!);
    setActiveDivisor(check.divisor!);
    setActiveBitWidth(nextBitWidth);
    setCurrentStepIndex(0);
  };

  const handleAlgorithmSwitch = (nextAlgo: DivisionAlgorithm) => {
    if (nextAlgo === algorithm) return;
    setIsAutoPlaying(false);
    setAlgorithm(nextAlgo);
    setCurrentStepIndex(0);
  };

  const handleDividendChange = (val: string) => {
    setDividendInput(val);
    const check = validateSimulationInputs(val, divisorInput, bitWidth);
    if (!check.valid) {
      setIsAutoPlaying(false);
      setValidationError(check.error);
    } else {
      setValidationError(undefined);
      setActiveDividend(check.dividend!);
      setActiveDivisor(check.divisor!);
      setActiveBitWidth(bitWidth);
      setCurrentStepIndex(0);
    }
  };

  const handleDivisorChange = (val: string) => {
    setDivisorInput(val);
    const check = validateSimulationInputs(dividendInput, val, bitWidth);
    if (!check.valid) {
      setIsAutoPlaying(false);
      setValidationError(check.error);
    } else {
      setValidationError(undefined);
      setActiveDividend(check.dividend!);
      setActiveDivisor(check.divisor!);
      setActiveBitWidth(bitWidth);
      setCurrentStepIndex(0);
    }
  };

  const handleBitWidthChange = (nextWidth: BitWidth) => {
    setBitWidth(nextWidth);
    applyAndValidate(dividendInput, divisorInput, nextWidth);
  };

  const handleStartSimulation = () => {
    applyAndValidate(dividendInput, divisorInput, bitWidth);
  };

  const handleReset = () => {
    setIsAutoPlaying(false);
    setDividendInput(String(DEFAULT_DIVIDEND));
    setDivisorInput(String(DEFAULT_DIVISOR));
    setBitWidth(DEFAULT_BIT_WIDTH);
    setActiveDividend(DEFAULT_DIVIDEND);
    setActiveDivisor(DEFAULT_DIVISOR);
    setActiveBitWidth(DEFAULT_BIT_WIDTH);
    setValidationError(undefined);
    setCurrentStepIndex(0);
    setShowAllSteps(false);
  };

  const handleSelectPreset = (preset: PresetExample) => {
    setIsAutoPlaying(false);
    setDividendInput(String(preset.dividend));
    setDivisorInput(String(preset.divisor));
    setBitWidth(preset.bitWidth);
    setActiveDividend(preset.dividend);
    setActiveDivisor(preset.divisor);
    setActiveBitWidth(preset.bitWidth);
    setValidationError(undefined);
    setCurrentStepIndex(0);
  };

  const handleRestart = () => {
    setIsAutoPlaying(false);
    setCurrentStepIndex(0);
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container header-inner">
          <div className="header-kicker">Computer Organization &amp; Architecture</div>
          <h1 className="site-title">Binary Division Simulator</h1>
          <p className="site-subtitle">
            <strong>Learn Restoring and Non-Restoring Division Step by Step</strong>
          </p>
          <p className="site-author">
            <strong>By Roshwin Niketh M</strong>
          </p>

          <div className="scope-notice-banner" role="note">
            This simulator demonstrates unsigned binary division. Signed division requires
            additional sign-handling rules and is outside the current simulation.
          </div>

          <nav className="algorithm-mode-selector" aria-label="Division algorithm mode selector">
            <button
              type="button"
              className={`mode-tab-btn ${algorithm === 'restoring' ? 'active' : ''}`}
              onClick={() => handleAlgorithmSwitch('restoring')}
              aria-pressed={algorithm === 'restoring'}
            >
              Restoring Division
            </button>
            <button
              type="button"
              className={`mode-tab-btn ${algorithm === 'non-restoring' ? 'active' : ''}`}
              onClick={() => handleAlgorithmSwitch('non-restoring')}
              aria-pressed={algorithm === 'non-restoring'}
            >
              Non-Restoring Division
            </button>
          </nav>
        </div>
      </header>

      <main className="container main-content">
        {/* Section 5 & 6: Beginner Introduction — Before We Start */}
        <section className="card intro-section" aria-labelledby="before-we-start-heading">
          <div className="intro-header-row">
            <h2 id="before-we-start-heading" className="section-title">
              Before We Start — Understanding Binary Division Hardware
            </h2>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setIsIntroExpanded((prev) => !prev)}
              aria-expanded={isIntroExpanded}
            >
              {isIntroExpanded ? 'Compact Guide ▲' : 'Expand Guide ▼'}
            </button>
          </div>

          {isIntroExpanded && (
            <div className="intro-body">
              <div className="intro-two-col">
                <div className="intro-card-block">
                  <h3>What is binary division?</h3>
                  <p>
                    Binary division performs the same conceptual task as decimal division:
                  </p>
                  <pre className="concept-formula">
                    Dividend ÷ Divisor = Quotient with Remainder
                  </pre>
                  <p>For example, using our default values:</p>
                  <pre className="concept-formula">13 ÷ 3 = 4 remainder 1</pre>
                  <p>And we verify the result using the division identity:</p>
                  <pre className="concept-formula">13 = (3 × 4) + 1</pre>
                </div>

                <div className="intro-card-block">
                  <h3>Hardware Registers Explained</h3>
                  <dl className="register-glossary">
                    <div className="glossary-item">
                      <dt>A — Accumulator / Partial Remainder</dt>
                      <dd>
                        Stores the intermediate remainder. Uses <strong>n + 1 bits</strong> so its
                        most-significant bit (MSB) serves as a sign bit during subtraction.
                      </dd>
                    </div>
                    <div className="glossary-item">
                      <dt>Q — Dividend / Quotient Register</dt>
                      <dd>
                        Initially contains the <strong>n-bit dividend</strong>. During the
                        algorithm its bits shift left into A while it gradually fills with the{' '}
                        <strong>quotient</strong>.
                      </dd>
                    </div>
                    <div className="glossary-item">
                      <dt>M — Divisor Register</dt>
                      <dd>
                        Stores the divisor (zero-extended to <strong>n + 1 bits</strong> when
                        operating with A).
                      </dd>
                    </div>
                    <div className="glossary-item">
                      <dt>Q₀ — Least-Significant Quotient Bit</dt>
                      <dd>
                        Least-significant bit of Q. Set to <code>1</code> or <code>0</code> during
                        each iteration based on the sign of A.
                      </dd>
                    </div>
                    <div className="glossary-item">
                      <dt>Count — Iteration Counter</dt>
                      <dd>
                        Number of iterations remaining. For an n-bit dividend:{' '}
                        <code>Count starts at n.</code>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="why-two-algorithms-grid">
                <div className="algo-concept-box">
                  <h3>Restoring Division</h3>
                  <p>After shifting [A, Q] left and subtracting M (A = A - M):</p>
                  <ul>
                    <li>If A becomes negative (A &lt; 0),</li>
                    <li>the subtraction was unsuccessful (M did not fit),</li>
                    <li>
                      therefore A is <strong>immediately restored</strong> by adding M back (A = A
                      + M) and setting Q₀ = 0.
                    </li>
                  </ul>
                  <p className="algo-hence">
                    Hence: <strong>Restoring Division</strong>
                  </p>
                </div>

                <div className="algo-concept-box">
                  <h3>Non-Restoring Division</h3>
                  <p>Instead of immediately restoring a negative A:</p>
                  <ul>
                    <li>keep the negative partial remainder in A,</li>
                    <li>
                      compensate in the next iteration by shifting left and using{' '}
                      <strong>addition (A = A + M)</strong> rather than subtraction.
                    </li>
                    <li>Only perform a single final correction (A = A + M) at the end if A &lt; 0.</li>
                  </ul>
                  <p className="algo-hence">
                    Hence: <strong>Non-Restoring Division</strong> — its conceptual advantage is
                    avoiding the immediate restore addition after every unsuccessful subtraction.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Section 7 & 8: Shared Input Panel */}
        <InputPanel
          dividendInput={dividendInput}
          divisorInput={divisorInput}
          bitWidth={bitWidth}
          validationError={validationError}
          activeDividend={activeDividend}
          activeDivisor={activeDivisor}
          onDividendChange={handleDividendChange}
          onDivisorChange={handleDivisorChange}
          onBitWidthChange={handleBitWidthChange}
          onStartSimulation={handleStartSimulation}
          onReset={handleReset}
          onSelectPreset={handleSelectPreset}
        />

        {/* Active Algorithm Simulator */}
        {!validationError &&
          (algorithm === 'restoring' ? (
            <RestoringSimulator
              dividend={activeDividend}
              divisor={activeDivisor}
              bitWidth={activeBitWidth}
              currentStepIndex={currentStepIndex}
              isAutoPlaying={isAutoPlaying}
              showAllSteps={showAllSteps}
              onStepChange={setCurrentStepIndex}
              onToggleAutoPlay={() => setIsAutoPlaying(true)}
              onPauseAutoPlay={() => setIsAutoPlaying(false)}
              onRestart={handleRestart}
              onToggleShowAllSteps={() => setShowAllSteps((prev) => !prev)}
            />
          ) : (
            <NonRestoringSimulator
              dividend={activeDividend}
              divisor={activeDivisor}
              bitWidth={activeBitWidth}
              currentStepIndex={currentStepIndex}
              isAutoPlaying={isAutoPlaying}
              showAllSteps={showAllSteps}
              onStepChange={setCurrentStepIndex}
              onToggleAutoPlay={() => setIsAutoPlaying(true)}
              onPauseAutoPlay={() => setIsAutoPlaying(false)}
              onRestart={handleRestart}
              onToggleShowAllSteps={() => setShowAllSteps((prev) => !prev)}
            />
          ))}

        {/* Section 23: Comparison Section */}
        <section className="card comparison-section" aria-labelledby="comparison-heading">
          <h2 id="comparison-heading" className="section-title">
            Restoring vs. Non-Restoring Division Comparison
          </h2>
          <p className="section-subtitle">
            Both algorithms compute the exact same unsigned Quotient and Remainder in n iterations,
            differing in how they handle negative partial remainders.
          </p>

          <div className="table-scroll-container">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th scope="col">Restoring Division</th>
                  <th scope="col">Non-Restoring Division</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Subtracts M every cycle after shift</td>
                  <td>Chooses add/subtract using previous A sign</td>
                </tr>
                <tr>
                  <td>Negative result is immediately restored</td>
                  <td>Negative result can remain until next cycle</td>
                </tr>
                <tr>
                  <td>Uses A = A + M to restore</td>
                  <td>Compensates in later cycle</td>
                </tr>
                <tr>
                  <td>Straightforward conceptually</td>
                  <td>Avoids repeated immediate restorations</td>
                </tr>
                <tr>
                  <td>No final correction normally required</td>
                  <td>Final correction required if A &lt; 0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p>
            <strong>Binary Division Simulator</strong> — Educational Computer Organization &amp;
            Architecture Tool • By Roshwin Niketh M
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
